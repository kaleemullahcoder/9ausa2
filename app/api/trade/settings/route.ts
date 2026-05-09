import { NextRequest, NextResponse } from "next/server";
import { createServerClient, tryCreateAdminClient } from "@/lib/supabase";

export const dynamic = 'force-dynamic';

// Default trade settings if database table doesn't exist
const DEFAULT_TRADE_SETTINGS = [
    { duration_seconds: 60, profit_percentage: 30, is_active: true },
    { duration_seconds: 120, profit_percentage: 50, is_active: true },
    { duration_seconds: 180, profit_percentage: 60, is_active: true },
    { duration_seconds: 240, profit_percentage: 70, is_active: true },
    { duration_seconds: 300, profit_percentage: 80, is_active: true },
];

// GET - Fetch trade settings (public)
export async function GET() {
    try {
        const adminClient = tryCreateAdminClient();

        if (adminClient) {
            const { data: settings, error } = await adminClient
                .from("trade_settings")
                .select("*")
                .eq("is_active", true)
                .order("duration_seconds", { ascending: true });

            if (!error && settings && settings.length > 0) {
                return NextResponse.json({ settings });
            }
        }

        // Return default settings if table doesn't exist or is empty
        return NextResponse.json({ settings: DEFAULT_TRADE_SETTINGS });
    } catch (error) {
        console.error("Error fetching trade settings:", error);
        return NextResponse.json({ settings: DEFAULT_TRADE_SETTINGS });
    }
}
