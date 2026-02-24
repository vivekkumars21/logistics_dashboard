import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const batchId = searchParams.get("batchId");

    // ── Get batch ──────────────────────────────────────
    const supabase = getSupabase();
    let batch;

    if (batchId) {
      const { data, error } = await supabase
        .from("upload_batches")
        .select("*")
        .eq("id", Number(batchId))
        .single();
      if (error || !data) {
        return NextResponse.json(
          { batch: null, in_process_list: [], ready_list: [], stats: emptyStats() },
          { status: 200 }
        );
      }
      batch = data;
    } else {
      // Latest batch
      const { data, error } = await supabase
        .from("upload_batches")
        .select("*")
        .order("upload_date", { ascending: false })
        .limit(1)
        .single();
      if (error || !data) {
        return NextResponse.json(
          { batch: null, in_process_list: [], ready_list: [], stats: emptyStats() },
          { status: 200 }
        );
      }
      batch = data;
    }

    // ── Get records for this batch ─────────────────────
    const { data: records, error: recError } = await supabase
      .from("shipments")
      .select("*")
      .eq("batch_id", batch.id)
      .order("id", { ascending: true });

    if (recError) {
      return NextResponse.json(
        { error: "Failed to fetch records.", details: recError.message },
        { status: 500 }
      );
    }

    const allRecords = records ?? [];

    // ── Backend filtering ──────────────────────────────
    const inProcessList = allRecords.filter((r) => !r.is_ready);
    const readyList = allRecords.filter((r) => r.is_ready);

    // ── Stats ──────────────────────────────────────────
    const sumCases = (list: typeof allRecords) => list.reduce((s, r) => s + (r.case_count ?? 0), 0);
    const stats = {
      total: sumCases(allRecords),
      inProcess: sumCases(inProcessList),
      ready: sumCases(readyList),
      totalRows: allRecords.length,
      inProcessRows: inProcessList.length,
      readyRows: readyList.length,
    };

    return NextResponse.json({
      batch,
      in_process_list: inProcessList,
      ready_list: readyList,
      stats,
    });
  } catch (err) {
    console.error("Records fetch error:", err);
    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}

function emptyStats() {
  return {
    total: 0,
    inProcess: 0,
    ready: 0,
    totalRows: 0,
    inProcessRows: 0,
    readyRows: 0,
  };
}
