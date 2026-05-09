import { NextRequest, NextResponse } from "next/server";
import { createServerClient, tryCreateAdminClient } from "@/lib/supabase";
import fs from "fs";
import path from "path";
import { fetchCoinLoreData } from "@/lib/coinlore";

// Force dynamic rendering - this route uses request headers and needs fresh data
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();

    // 1. Authenticate User
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Setup Database Logic
    // We prefer the admin client to ensure we can read all columns (trading_level, quantity, etc)
    // which might be protected by RLS or have strict column permissions.
    const adminSupabase = tryCreateAdminClient();
    const dbClient = adminSupabase || supabase;

    // 3. Fetch User Profile
    const { data: userData, error: userError } = await dbClient
      .from("users")
      .select("account_balance, total_invested, credit_score, level, trading_level")
      .eq("id", user.id)
      .single();

    if (userError) {
      console.error("Error fetching user data:", userError);
      // We don't error out entirely, we can try to return partial data if needed, 
      // but usually this is fatal for the dashboard.
    }

    // 4. Fetch Portfolio Positions
    const { data: positions, error: positionsError } = await dbClient
      .from("portfolio_positions")
      .select("*")
      .eq("user_id", user.id);

    if (positionsError) {
      console.error("Error fetching positions:", positionsError);
      return NextResponse.json({ error: "Failed to fetch portfolio" }, { status: 500 });
    }

    // 5. Calculate "Level" consistency
    // The DB has 'level' (int) and 'trading_level' (string like "Level 3")
    // Use numeric level if possible, else parse trading_level string
    let displayedLevel = userData?.level || 1;
    if (userData?.trading_level && typeof userData.trading_level === 'string') {
      const matches = userData.trading_level.match(/\d+/);
      if (matches) {
        displayedLevel = parseInt(matches[0]);
      }
    }

    // If no positions, return early with defaults
    if (!positions || positions.length === 0) {
      return NextResponse.json({
        accountBalance: userData?.account_balance || 100000,
        totalInvested: userData?.total_invested || 0,
        positions: [],
        totalValue: userData?.account_balance || 0,
        totalCost: 0,
        totalGain: 0,
        totalGainPercent: 0,
        watchlist: [],
        creditScore: userData?.credit_score || 1,
        level: displayedLevel,
      }, {
        headers: {
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      });
    }

    // 6. Fetch Stock Prices (Simulated Real-time + Local Fallback)
    const coinLoreStocks = await fetchCoinLoreData();
    let localStocks: any[] = [];
    try {
      const filePath = path.join(process.cwd(), 'public', 'data', 'stocks.json');
      const fileContent = fs.readFileSync(filePath, 'utf8');
      localStocks = JSON.parse(fileContent);
    } catch (e) {
      console.error("Failed to read stocks.json", e);
    }
    const allStocks = [...coinLoreStocks, ...localStocks];

    // Create Price Map
    const priceMap = new Map<string, { price: number; name: string }>();
    positions.forEach((pos: any) => {
      // DB Schema fallback: DB might have 'average_price' OR 'avg_price'
      const dbAvgPrice = parseFloat(pos.average_price || pos.avg_price) || 0;

      // Find current market price
      const stock = allStocks.find((s: any) => s.symbol === pos.symbol);

      if (stock && stock.price) {
        priceMap.set(pos.symbol, {
          price: parseFloat(stock.price),
          name: stock.name
        });
      } else {
        // Fallback to average price if we can't find a market price
        priceMap.set(pos.symbol, {
          price: dbAvgPrice,
          name: pos.symbol
        });
      }
    });

    // 7. Calculate Portfolio Metrics
    const portfolioPositions = positions.map((pos: any) => {
      const dbAvgPrice = parseFloat(pos.average_price || pos.avg_price) || 0;
      const dbQuantity = parseFloat(pos.quantity || pos.shares) || 0;

      const marketData = priceMap.get(pos.symbol) || { price: dbAvgPrice, name: pos.symbol };
      const currentPrice = marketData.price;

      const currentValue = dbQuantity * currentPrice;
      const gain = currentValue - (dbQuantity * dbAvgPrice);
      const gainPercent = dbAvgPrice > 0 ? (gain / (dbQuantity * dbAvgPrice)) * 100 : 0;

      return {
        symbol: pos.symbol,
        name: marketData.name,
        shares: dbQuantity,      // API standardized key
        avgPrice: dbAvgPrice,    // API standardized key
        currentPrice: currentPrice,
        currentValue: currentValue,
        gain: gain,
        gainPercent: gainPercent
      };
    });

    const totalValue = portfolioPositions.reduce((sum: number, pos: any) => sum + pos.currentValue, 0);
    const totalInvested = portfolioPositions.reduce((sum: number, pos: any) => sum + (pos.shares * pos.avgPrice), 0);
    const totalGain = totalValue - totalInvested;
    const totalGainPercent = totalInvested > 0 ? (totalGain / totalInvested) * 100 : 0;

    // 8. Return Final Response
    return NextResponse.json({
      accountBalance: userData?.account_balance || 100000,
      totalInvested: userData?.total_invested || totalInvested, // Use calculated invested as fallback
      positions: portfolioPositions,
      totalValue: (userData?.account_balance || 0) + totalValue,
      totalCost: totalInvested,
      totalGain: totalGain,
      totalGainPercent: totalGainPercent,
      watchlist: [],
      creditScore: userData?.credit_score || 1,
      level: displayedLevel,
    }, {
      headers: {
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      }
    });

  } catch (error) {
    console.error("Error fetching portfolio:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
