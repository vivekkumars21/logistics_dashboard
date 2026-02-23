import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

// GET all batches (last 7 days), newest first
export async function GET() {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from("upload_batches")
      .select("*")
      .order("upload_date", { ascending: false })
      .limit(7);

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch batches.", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(data ?? []);
  } catch (err) {
    console.error("Batches fetch error:", err);
    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}
