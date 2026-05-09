import { NextRequest, NextResponse } from "next/server";
import { createServerClient, tryCreateAdminClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";

export const dynamic = 'force-dynamic';

// GET - Fetch all withdrawal requests (admin only)
export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient();

        const authHeader = request.headers.get("authorization");
        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.replace("Bearer ", "").trim();

        // Decode JWT to get user ID
        let userId: string | null = null;
        try {
            const parts = token.split('.');
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            userId = payload.sub;
        } catch (e) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        if (!userId || !(await isAdmin(userId))) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const adminClient = tryCreateAdminClient();
        if (!adminClient) {
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        // Get status filter from query params
        const { searchParams } = new URL(request.url);
        const statusFilter = searchParams.get('status');

        let query = adminClient
            .from("withdrawal_requests")
            .select(`
                *,
                users:user_id (
                    id,
                    email,
                    name,
                    unique_user_id,
                    account_balance
                )
            `)
            .order("created_at", { ascending: false });

        if (statusFilter && ['pending', 'approved', 'rejected'].includes(statusFilter)) {
            query = query.eq('status', statusFilter);
        }

        const { data: withdrawals, error } = await query;

        if (error) {
            console.error("Error fetching withdrawals:", error);
            return NextResponse.json({ error: "Failed to fetch withdrawals" }, { status: 500 });
        }

        return NextResponse.json({ withdrawals });
    } catch (error) {
        console.error("Error in admin withdrawal GET:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Process withdrawal request (approve/reject)
export async function POST(request: NextRequest) {
    try {
        const supabase = createServerClient();

        const authHeader = request.headers.get("authorization");
        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.replace("Bearer ", "").trim();

        // Decode JWT to get user ID
        let adminUserId: string | null = null;
        try {
            const parts = token.split('.');
            const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
            adminUserId = payload.sub;
        } catch (e) {
            return NextResponse.json({ error: "Invalid token" }, { status: 401 });
        }

        if (!adminUserId || !(await isAdmin(adminUserId))) {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }

        const body = await request.json();
        const { withdrawal_id, action, reason } = body;

        if (!withdrawal_id || !['approve', 'reject'].includes(action)) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        const adminClient = tryCreateAdminClient();
        if (!adminClient) {
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        // Get withdrawal request
        const { data: withdrawal, error: fetchError } = await adminClient
            .from("withdrawal_requests")
            .select("*")
            .eq("id", withdrawal_id)
            .single();

        if (fetchError || !withdrawal) {
            return NextResponse.json({ error: "Withdrawal request not found" }, { status: 404 });
        }

        if (withdrawal.status !== 'pending') {
            return NextResponse.json({ error: "Withdrawal already processed" }, { status: 400 });
        }

        const status = action === 'approve' ? 'approved' : 'rejected';

        // If approving, deduct balance
        if (action === 'approve') {
            const { data: userData, error: userError } = await adminClient
                .from("users")
                .select("account_balance")
                .eq("id", withdrawal.user_id)
                .single();

            if (userError || !userData) {
                return NextResponse.json({ error: "User not found" }, { status: 404 });
            }

            const currentBalance = Number(userData.account_balance);
            if (currentBalance < withdrawal.amount) {
                return NextResponse.json({
                    error: "User has insufficient balance. Reject this request or wait for deposit."
                }, { status: 400 });
            }

            // Deduct balance
            const { error: balanceError } = await adminClient
                .from("users")
                .update({ account_balance: currentBalance - withdrawal.amount })
                .eq("id", withdrawal.user_id);

            if (balanceError) {
                console.error("Error deducting balance:", balanceError);
                return NextResponse.json({ error: "Failed to process withdrawal" }, { status: 500 });
            }
        }

        // Update withdrawal status
        const { error: updateError } = await adminClient
            .from("withdrawal_requests")
            .update({
                status: status,
                admin_reason: reason || null,
                processed_by: adminUserId,
                processed_at: new Date().toISOString()
            })
            .eq("id", withdrawal_id);

        if (updateError) {
            console.error("Error updating withdrawal:", updateError);
            return NextResponse.json({ error: "Failed to update withdrawal" }, { status: 500 });
        }

        // Notify user about the result
        try {
            const notificationTitle = action === 'approve'
                ? "Withdrawal Approved"
                : "Withdrawal Rejected";

            const notificationMessage = action === 'approve'
                ? `Your withdrawal of $${withdrawal.amount} via ${withdrawal.network} has been approved and processed.`
                : `Your withdrawal of $${withdrawal.amount} has been rejected.${reason ? ` Reason: ${reason}` : ''}`;

            await adminClient
                .from("notifications")
                .insert({
                    user_id: withdrawal.user_id,
                    title: notificationTitle,
                    message: notificationMessage,
                    type: action === 'approve' ? 'success' : 'error',
                    is_read: false
                });
        } catch (notifError) {
            console.error("Notification error:", notifError);
        }

        return NextResponse.json({
            success: true,
            message: `Withdrawal ${status} successfully`
        });

    } catch (error) {
        console.error("Error in admin withdrawal POST:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
