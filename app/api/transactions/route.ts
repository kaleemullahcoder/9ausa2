import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // 1. Auth Check
    const authHeader = request.headers.get("authorization");
    if (!authHeader) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const token = authHeader.replace("Bearer ", "").trim();

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse Body
    const body = await request.json();
    const { symbol, type, shares, price } = body; // type: 'buy' | 'sell'

    if (!symbol || !type || !shares || !price) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const qty = Number(shares);
    const unitPrice = Number(price);
    const total = qty * unitPrice;

    // 3. User Data (Balance)
    const { data: userData } = await supabase.from("users").select("account_balance").eq("id", user.id).single();
    if (!userData) return NextResponse.json({ error: "User not found" }, { status: 404 });

    const currentBalance = Number(userData.account_balance);

    // 4. BUY Logic
    if (type === 'buy') {
      if (currentBalance < total) {
        return NextResponse.json({ error: "Insufficient balance" }, { status: 400 });
      }

      // Deduct Balance
      const { error: balError } = await supabase.from("users").update({ account_balance: currentBalance - total }).eq("id", user.id);
      if (balError) throw balError;

      // Log Transaction
      await supabase.from("transactions").insert({
        user_id: user.id,
        type: 'BUY',
        symbol,
        shares: qty,
        price: unitPrice,
        amount: total,
        status: 'COMPLETED'
      });

      // Update Portfolio
      // Check existing position
      const { data: position } = await supabase.from("portfolio_positions").select("*").eq("user_id", user.id).eq("symbol", symbol).single();

      if (position) {
        const newShares = Number(position.shares) + qty;
        // Weighted average price
        const oldTotalCost = Number(position.shares) * Number(position.avg_price);
        const newAvgPrice = (oldTotalCost + total) / newShares;

        await supabase.from("portfolio_positions").update({
          shares: newShares,
          avg_price: newAvgPrice,
          updated_at: new Date().toISOString()
        }).eq("id", position.id);
      } else {
        await supabase.from("portfolio_positions").insert({
          user_id: user.id,
          symbol,
          shares: qty,
          avg_price: unitPrice,
          name: symbol // Ideally fetch name, but symbol OK fallback
        });
      }
    }
    // 5. SELL Logic
    else if (type === 'sell') {
      // Check Position
      const { data: position } = await supabase.from("portfolio_positions").select("*").eq("user_id", user.id).eq("symbol", symbol).single();
      if (!position || Number(position.shares) < qty) {
        return NextResponse.json({ error: "Insufficient shares" }, { status: 400 });
      }

      // Add Balance
      const { error: balError } = await supabase.from("users").update({ account_balance: currentBalance + total }).eq("id", user.id);
      if (balError) throw balError;

      // Log Transaction
      await supabase.from("transactions").insert({
        user_id: user.id,
        type: 'SELL',
        symbol,
        shares: qty,
        price: unitPrice,
        amount: total,
        status: 'COMPLETED'
      });

      // Update Portfolio
      const newShares = Number(position.shares) - qty;
      if (newShares > 0) {
        await supabase.from("portfolio_positions").update({
          shares: newShares,
          updated_at: new Date().toISOString()
        }).eq("id", position.id);
      } else {
        await supabase.from("portfolio_positions").delete().eq("id", position.id);
      }
    } else {
      return NextResponse.json({ error: "Invalid transaction type" }, { status: 400 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Trade execution error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");

    // Verify user token
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { data: transactions, error } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching transactions:", error);
      return NextResponse.json({ transactions: [] });
    }

    return NextResponse.json({ transactions: transactions || [] });
  } catch (error) {
    console.error("Error fetching transactions:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
