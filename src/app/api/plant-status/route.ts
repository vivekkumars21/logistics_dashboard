import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export interface PlantEntry {
  id: number;
  plant: string;
  location: string;
  isReady: boolean;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get("batchId");

    const supabase = getSupabase();

    // Get the target batch
    let batch;
    if (batchId) {
      const { data, error } = await supabase
        .from("upload_batches")
        .select("*")
        .eq("id", Number(batchId))
        .single();
      if (error || !data) {
        return NextResponse.json({ plants: [], batch: null });
      }
      batch = data;
    } else {
      const { data, error } = await supabase
        .from("upload_batches")
        .select("*")
        .order("upload_date", { ascending: false })
        .limit(1)
        .single();
      if (error || !data) {
        return NextResponse.json({ plants: [], batch: null });
      }
      batch = data;
    }

    // Get all individual records for this batch
    const { data: records, error: recError } = await supabase
      .from("shipments")
      .select("id, plant, location, is_ready")
      .eq("batch_id", batch.id)
      .order("plant", { ascending: true })
      .order("id", { ascending: true });

    if (recError) {
      return NextResponse.json(
        { error: "Failed to fetch records.", details: recError.message },
        { status: 500 }
      );
    }

    const entries: PlantEntry[] = (records ?? []).map((r) => ({
      id: r.id,
      plant: r.plant,
      location: r.location ?? "",
      isReady: !!r.is_ready,
    }));

    const readyCount = entries.filter((e) => e.isReady).length;

    return NextResponse.json({
      entries,
      batch,
      summary: {
        total: entries.length,
        ready: readyCount,
        pending: entries.length - readyCount,
      },
    });
  } catch (err) {
    console.error("Plant status error:", err);
    return NextResponse.json({ error: "Server error." }, { status: 500 });
  }
}
