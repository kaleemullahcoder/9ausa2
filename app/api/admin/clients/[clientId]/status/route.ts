import { NextRequest, NextResponse } from "next/server";
import { createServerClient, tryCreateAdminClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";

export const dynamic = 'force-dynamic';

// PUT - Update user account status (admin only)
export async function PUT(
    request: NextRequest,
    { params }: { params: { clientId: string } }
) {
    try {
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

        const { clientId: userId } = params;
        const body = await request.json();
        const { account_status, reason } = body;

        if (!account_status || !['active', 'frozen', 'blocked'].includes(account_status)) {
            return NextResponse.json({ error: "Invalid account status" }, { status: 400 });
        }

        const adminClient = tryCreateAdminClient();
        if (!adminClient) {
            return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
        }

        // Update user account status
        const { error: updateError } = await adminClient
            .from("users")
            .update({ account_status })
            .eq("id", userId);

        if (updateError) {
            console.error("Error updating account status:", updateError);
            return NextResponse.json({ error: "Failed to update account status" }, { status: 500 });
        }

        // Send notification to user
        const statusMessages: Record<string, { title: string; message: string; type: string }> = {
            active: {
                title: "Account Activated",
                message: "Your account has been reactivated. You can now trade normally.",
                type: "success"
            },
            frozen: {
                title: "⚠️ Account Frozen",
                message: `Your account has been temporarily frozen.${reason ? ` Reason: ${reason}` : ''} Please contact support for assistance.`,
                type: "warning"
            },
            blocked: {
                title: "🚫 Account Blocked",
                message: `Your account has been blocked.${reason ? ` Reason: ${reason}` : ''} Please contact support immediately.`,
                type: "error"
            }
        };

        const notification = statusMessages[account_status];
        await adminClient
            .from("notifications")
            .insert({
                user_id: userId,
                title: notification.title,
                message: notification.message,
                type: notification.type,
                is_read: false
            });

        return NextResponse.json({
            success: true,
            message: `Account status updated to ${account_status}`
        });

    } catch (error) {
        console.error("Error in account status update:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
