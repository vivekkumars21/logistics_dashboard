import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const plant = searchParams.get("plant");

    if (!plant) {
      return NextResponse.json(
        { error: "Plant parameter is required." },
        { status: 400 }
      );
    }

    // ── Get last 7 days of batches ─────────────────────
    const supabase = getSupabase();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoff = sevenDaysAgo.toISOString().split("T")[0];

    const { data: batches } = await supabase
      .from("upload_batches")
      .select("id, upload_date")
      .gte("upload_date", cutoff)
      .order("upload_date", { ascending: false });

    if (!batches || batches.length === 0) {
      return NextResponse.json({ plant, history: [], summary: null });
    }

    const batchIds = batches.map((b) => b.id);

    // ── Get plant records across those batches ─────────
    const { data: records, error } = await supabase
      .from("logistics_records")
      .select("*, batch:upload_batches(upload_date)")
      .eq("plant", plant)
      .in("batch_id", batchIds)
      .order("batch_id", { ascending: false });

    if (error) {
      return NextResponse.json(
        { error: "Failed to fetch history.", details: error.message },
        { status: 500 }
      );
    }

    // ── Build history entries ──────────────────────────
    const history = (records ?? []).map((r) => ({
      upload_date: (r.batch as { upload_date: string })?.upload_date ?? "",
      mode: r.mode,
      weight: r.weight,
      amount: r.amount,
      invoice_no: r.invoice_no,
      eod_data: r.eod_data,
      case_count: r.case_count,
      volume: r.volume,
      location: r.location,
      is_ready: r.is_ready,
    }));

    // ── 7-day summary ──────────────────────────────────
    const summary = {
      totalWeight: history.reduce((s, r) => s + (r.weight ?? 0), 0),
      totalAmount: history.reduce((s, r) => s + (r.amount ?? 0), 0),
      totalVolume: history.reduce((s, r) => s + (r.volume ?? 0), 0),
      daysPresent: new Set(history.map((r) => r.upload_date)).size,
    };

    return NextResponse.json({ plant, history, summary });
  } catch (err) {
    console.error("Plant history error:", err);
    return NextResponse.json(
      { error: "Server error." },
      { status: 500 }
    );
  }
}
