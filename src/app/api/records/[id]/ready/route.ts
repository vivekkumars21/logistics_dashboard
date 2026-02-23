import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const isReady = Boolean(body.is_ready);
    const supabase = getSupabase();

    const { data, error } = await supabase
      .from("logistics_records")
      .update({ is_ready: isReady })
      .eq("id", Number(id))
      .select()
      .single();

    if (error) {
      return NextResponse.json(
        { error: "Failed to update record.", details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, record: data });
  } catch (err) {
    console.error("Ready toggle error:", err);
    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}
