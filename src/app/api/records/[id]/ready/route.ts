import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const supabase = getSupabase();

    // Build update payload — supports is_ready and/or remark
    const updatePayload: Record<string, unknown> = {};
    if ("is_ready" in body) updatePayload.is_ready = Boolean(body.is_ready);
    if ("remark" in body) updatePayload.remark = String(body.remark);

    if (Object.keys(updatePayload).length === 0) {
      return NextResponse.json(
        { error: "No valid fields to update." },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("logistics_records")
      .update(updatePayload)
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
