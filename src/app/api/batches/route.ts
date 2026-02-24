import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

interface BatchWithStats {
  id: number;
  upload_date: string;
  created_at: string;
  total_shipments: number;
  ready_count: number;
  in_process_count: number;
}

// GET all batches (last 24 days) with statistics
export async function GET() {
  try {
    const supabase = getSupabase();
    
    // Get all batches
    const { data: batches, error: batchError } = await supabase
      .from("upload_batches")
      .select("*")
      .order("upload_date", { ascending: false })
      .limit(24);

    if (batchError) {
      return NextResponse.json(
        { error: "Failed to fetch batches.", details: batchError.message },
        { status: 500 }
      );
    }

    if (!batches || batches.length === 0) {
      return NextResponse.json([]);
    }

    // Get shipment stats for each batch
    const batchIds = batches.map((b: any) => b.id);
    const { data: stats, error: statsError } = await supabase
      .from("shipments")
      .select("batch_id, is_ready")
      .in("batch_id", batchIds);

    if (statsError) {
      console.error("Stats fetch error:", statsError);
      return NextResponse.json(
        { error: "Failed to fetch shipment stats.", details: statsError.message },
        { status: 500 }
      );
    }

    // Build result with stats
    const result: BatchWithStats[] = batches.map((batch: any) => {
      const batchStats = stats?.filter((s: any) => s.batch_id === batch.id) ?? [];
      return {
        id: batch.id,
        upload_date: batch.upload_date,
        created_at: batch.created_at,
        total_shipments: batchStats.length,
        ready_count: batchStats.filter((s: any) => s.is_ready).length,
        in_process_count: batchStats.filter((s: any) => !s.is_ready).length,
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("Batches fetch error:", err);
    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}
