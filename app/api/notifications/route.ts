import { NextRequest, NextResponse } from "next/server";
import { createServerClient, tryCreateAdminClient } from "@/lib/supabase";

// Force dynamic rendering and disable caching
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerClient();
    // Use admin client for user queries to bypass RLS
    const adminSupabase = tryCreateAdminClient();
    const clientToUse = adminSupabase || supabase;

    // Get auth token from request
    const authHeader = request.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get query params for filtering
    const searchParams = request.nextUrl.searchParams;
    const unreadOnly = searchParams.get("unread") === "true";
    const limit = parseInt(searchParams.get("limit") || "20");

    // Client Selection Strategy:
    // 1. Try Admin Client (Service Role) - Ideal for bypassing RLS completely.
    // 2. Fallback to Scoped User Client - Uses user's JWT to pass RLS policies.
    let clientForNotifications = adminSupabase;
    let strategy = "admin_service_role";

    if (!clientForNotifications) {
      // Fallback: Create a client specifically for this request using the user's token
      // This ensures RLS policies work correctly (User sees their own data)
      const { createClient } = require('@supabase/supabase-js');
      clientForNotifications = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: { headers: { Authorization: authHeader } },
          auth: { persistSession: false }
        }
      );
      strategy = "authenticated_user_scope";
      console.log("⚠️ Admin client missing. Falling back to authenticated user scope.");
    }

    console.log(`🔔 Fetching notifications for user: ${user.id} using strategy: ${strategy}`);

    // Fetch notifications
    const { data: notificationsData, error: notificationsError } = await clientForNotifications!
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(limit);

    // Log errors if any
    if (notificationsError) {
      if (notificationsError.code === 'PGRST116' || notificationsError.code === '42P01') {
        console.log("⚠️ Notifications table does not exist yet");
      } else {
        console.error(`❌ Error fetching notifications (${strategy}):`, notificationsError);
      }
    }

    // Fetch recent credit transfers where user is involved
    // Try with foreign key first, fallback to manual join if needed
    let query = supabase
      .from("credit_transfers")
      .select(`
        *,
        from_user:users!credit_transfers_from_user_id_fkey(id, name, email, unique_user_id),
        to_user:users!credit_transfers_to_user_id_fkey(id, name, email, unique_user_id)
      `)
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .order("created_at", { ascending: false })
      .limit(limit);

    let { data: transfers, error } = await query;

    // If foreign key query fails, try without foreign key
    if (error) {
      console.error("Error with foreign key query, trying alternative:", error);
      const altQuery = supabase
        .from("credit_transfers")
        .select("*")
        .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
        .order("created_at", { ascending: false })
        .limit(limit);

      const { data: transfersData, error: altError } = await altQuery;

      if (altError) {
        console.error("Error fetching notifications:", altError);
        console.error("Error details:", JSON.stringify(altError, null, 2));
        return NextResponse.json(
          { error: "Failed to fetch notifications", details: altError.message },
          { status: 500 }
        );
      }

      // Manually fetch user data for each transfer
      transfers = transfersData;
      if (transfers && transfers.length > 0) {
        const userIds = new Set<string>();
        transfers.forEach((t: any) => {
          if (t.from_user_id) userIds.add(t.from_user_id);
          if (t.to_user_id) userIds.add(t.to_user_id);
        });

        const { data: usersData } = await clientForNotifications!
          .from("users")
          .select("id, name, email, unique_user_id")
          .in("id", Array.from(userIds));

        const usersMap = new Map((usersData || []).map((u: any) => [u.id, u]));

        transfers = transfers.map((t: any) => ({
          ...t,
          from_user: usersMap.get(t.from_user_id),
          to_user: usersMap.get(t.to_user_id),
        }));
      }
    }

    // Transform transfers into notifications
    const transferNotifications = (transfers || []).map((transfer: any) => {
      const isReceived = transfer.to_user_id === user.id;
      const otherUser = isReceived ? transfer.from_user : transfer.to_user;

      return {
        id: `transfer-${transfer.id}`,
        type: isReceived ? "credit_received" : "credit_sent",
        title: isReceived
          ? `Received ${transfer.amount} credits from ${otherUser?.name || "Unknown"}`
          : `Sent ${transfer.amount} credits to ${otherUser?.name || "Unknown"}`,
        message: transfer.note || (isReceived
          ? `You received $${transfer.amount} from ${otherUser?.name || "Unknown"}`
          : `You sent $${transfer.amount} to ${otherUser?.name || "Unknown"}`),
        amount: transfer.amount,
        from_user: transfer.from_user,
        to_user: transfer.to_user,
        isReceived,
        created_at: transfer.created_at,
        read: false,
        source: "transfer",
      };
    });

    // Transform admin notifications - use the actual ID from database
    const adminNotifications = (notificationsData || []).map((notif: any) => ({
      id: notif.id,
      type: notif.type || "info",
      title: notif.title,
      message: notif.message,
      created_at: notif.created_at,
      read: notif.is_read === true || notif.read === true, // Handle both boolean true and 'true' string cases if any
      is_read: notif.is_read || notif.read || false, // Pass raw for debugging
      from_admin: notif.from_admin || false,
      source: "admin",
    }));

    // Combine and sort by date with safe TZ parsing
    const allNotifications = [...transferNotifications, ...adminNotifications]
      .sort((a, b) => {
        let dateA = a.created_at;
        let dateB = b.created_at;
        if (!dateA.endsWith('Z')) dateA += 'Z';
        if (!dateB.endsWith('Z')) dateB += 'Z';
        return new Date(dateB).getTime() - new Date(dateA).getTime();
      })
      .slice(0, limit);

    // Count unread notifications
    const unreadCount = allNotifications.filter((n: any) => !n.read).length;

    console.log(`📊 Notification summary: ${transferNotifications.length} transfers, ${adminNotifications.length} admin, ${allNotifications.length} total, ${unreadCount} unread`);

    // ... (rest of function)

    const response = NextResponse.json({
      notifications: allNotifications,
      unreadCount,
      total: allNotifications.length,
    });

    response.headers.set('X-Fetch-Strategy', strategy);
    // Explicitly disable caching - CRITICAL for real-time polling
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store'); // Netlify specific
    response.headers.set('CDN-Cache-Control', 'no-store'); // Netlify specific

    return response;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

