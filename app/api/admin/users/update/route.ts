
import { NextRequest, NextResponse } from "next/server";
import { createServerClient, tryCreateAdminClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
    try {
        const supabase = createServerClient();

        // Auth Check
        const authHeader = request.headers.get("authorization");
        if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const token = authHeader.replace("Bearer ", "").trim();

        // Verify Admin (Simplified)
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

        const body = await request.json();
        const { targetUserId, creditScore, level } = body;

        if (!targetUserId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        const adminClient = tryCreateAdminClient();
        if (!adminClient) {
            return NextResponse.json({ error: "Admin client unavailable" }, { status: 500 });
        }

        // Resolve User ID (Handle UUID, Unique ID, or Email)
        let resolvedUserId = targetUserId;
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUserId);

        if (!isUUID) {
            // Try to find user by unique_user_id or email
            const { data: foundUser, error: findError } = await adminClient
                .from("users")
                .select("id")
                .or(`unique_user_id.eq.${targetUserId},email.eq.${targetUserId}`)
                .single();

            if (findError || !foundUser) {
                return NextResponse.json({ error: "User not found with that ID or Email" }, { status: 404 });
            }
            resolvedUserId = foundUser.id;
        }

        // Update User
        const updates: any = {};
        if (creditScore !== undefined) updates.credit_score = creditScore;
        if (level !== undefined) {
            // If level is a number, store it as string, or map to 'Level X'
            // If it's just a number like 1, 2, 5 -> "Level 5"
            // If it's already "Level 5", keep it.
            const levelNum = parseInt(level.toString().replace(/\D/g, ''));
            if (!isNaN(levelNum)) {
                updates.trading_level = `Level ${levelNum}`;
            } else {
                updates.trading_level = level;
            }
        }

        const { error: updateError } = await adminClient
            .from("users")
            .update(updates)
            .eq("id", resolvedUserId);

        if (updateError) {
            console.error("Update failed:", updateError);
            return NextResponse.json({ error: "Failed to update user" }, { status: 500 });
        }

        return NextResponse.json({ success: true, userId: resolvedUserId });

    } catch (error) {
        console.error("Error updating user stats:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
