import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ batchId: string }> }
) {
  try {
    const { batchId } = await params;
    const supabase = getSupabase();

    // Get batch info
    const { data: batch, error: batchError } = await supabase
      .from("upload_batches")
      .select("*")
      .eq("id", Number(batchId))
      .single();

    if (batchError || !batch) {
      return NextResponse.json(
        { error: "Batch not found.", details: batchError?.message },
        { status: 404 }
      );
    }

    // Get all shipments in this batch
    const { data: shipments, error: shipError } = await supabase
      .from("shipments")
      .select("*")
      .eq("batch_id", Number(batchId))
      .order("id", { ascending: true });

    if (shipError) {
      return NextResponse.json(
        { error: "Failed to fetch shipments.", details: shipError.message },
        { status: 500 }
      );
    }

    const shipmentList = shipments ?? [];
    const stats = {
      total: shipmentList.length,
      ready: shipmentList.filter((s) => s.is_ready).length,
      in_process: shipmentList.filter((s) => !s.is_ready).length,
    };

    return NextResponse.json({
      batch,
      shipments: shipmentList,
      stats,
    });
  } catch (err) {
    console.error("Batch detail error:", err);
    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}
