import { NextRequest, NextResponse } from "next/server";
import { createServerClient, tryCreateAdminClient } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

// GET - Fetch user's withdrawal requests
export async function GET(request: NextRequest) {
    try {
        const supabase = createServerClient();

        const authHeader = request.headers.get("authorization");
        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.replace("Bearer ", "").trim();

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const adminClient = tryCreateAdminClient();
        const clientToUse = adminClient || supabase;

        const { data: withdrawals, error } = await clientToUse
            .from("withdrawal_requests")
            .select("*")
            .eq("user_id", user.id)
            .order("created_at", { ascending: false });

        if (error) {
            console.error("Error fetching withdrawals:", error);
            return NextResponse.json({ error: "Failed to fetch withdrawals" }, { status: 500 });
        }

        return NextResponse.json({ withdrawals });
    } catch (error) {
        console.error("Error in withdrawal GET:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// POST - Create a new withdrawal request
export async function POST(request: NextRequest) {
    try {
        const supabase = createServerClient();

        const authHeader = request.headers.get("authorization");
        if (!authHeader) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }
        const token = authHeader.replace("Bearer ", "").trim();

        const { data: { user }, error: authError } = await supabase.auth.getUser(token);
        if (authError || !user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();
        const { amount, network, wallet_address } = body;

        // Validation
        if (!amount || amount <= 0) {
            return NextResponse.json({ error: "Invalid amount" }, { status: 400 });
        }

        if (!network || !['ERC20', 'TRC20', 'BTC'].includes(network)) {
            return NextResponse.json({ error: "Invalid network. Choose ERC20, TRC20, or BTC" }, { status: 400 });
        }

        if (!wallet_address || wallet_address.trim().length < 10) {
            return NextResponse.json({ error: "Invalid wallet address" }, { status: 400 });
        }

        const adminClient = tryCreateAdminClient();
        if (!adminClient) {
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        // Check user's balance
        const { data: userData, error: userError } = await adminClient
            .from("users")
            .select("account_balance, account_status")
            .eq("id", user.id)
            .single();

        if (userError || !userData) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        // Check account status
        if (userData.account_status === 'frozen') {
            return NextResponse.json({ error: "Your account is frozen. Please contact support." }, { status: 403 });
        }

        if (userData.account_status === 'blocked') {
            return NextResponse.json({ error: "Your account is blocked. Please contact support." }, { status: 403 });
        }

        const currentBalance = Number(userData.account_balance);
        if (currentBalance < amount) {
            return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
        }

        // Check for pending withdrawals
        const { data: pendingWithdrawals } = await adminClient
            .from("withdrawal_requests")
            .select("id")
            .eq("user_id", user.id)
            .eq("status", "pending");

        if (pendingWithdrawals && pendingWithdrawals.length > 0) {
            return NextResponse.json({
                error: "You already have a pending withdrawal request. Please wait for it to be processed."
            }, { status: 400 });
        }

        // Create withdrawal request
        const { data: withdrawal, error: insertError } = await adminClient
            .from("withdrawal_requests")
            .insert({
                user_id: user.id,
                amount: amount,
                network: network,
                wallet_address: wallet_address.trim(),
                status: 'pending'
            })
            .select()
            .single();

        if (insertError) {
            console.error("Error creating withdrawal:", insertError);
            return NextResponse.json({ error: "Failed to create withdrawal request" }, { status: 500 });
        }

        // Notify admins about new withdrawal request
        try {
            const { data: admins } = await adminClient
                .from("users")
                .select("id")
                .eq("role", "admin");

            if (admins && admins.length > 0) {
                const notifications = admins.map(admin => ({
                    user_id: admin.id,
                    title: "New Withdrawal Request",
                    message: `Client requested withdrawal of $${amount} via ${network}`,
                    type: "warning",
                    is_read: false
                }));

                await adminClient
                    .from("notifications")
                    .insert(notifications);
            }
        } catch (notifError) {
            console.error("Notification error:", notifError);
        }

        return NextResponse.json({
            success: true,
            withdrawal,
            message: "Withdrawal request submitted successfully. Please wait for admin approval."
        });

    } catch (error) {
        console.error("Error in withdrawal POST:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
