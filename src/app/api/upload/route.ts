import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

// ── Column name mapping (normalized lowercase → standard key) ──
// Maps all known variations of column headers to a single key.
const HEADER_ALIASES: Record<string, string> = {
  "plant":            "plant",
  "location":         "location",
  "pgi no.":          "pgi_no",
  "pgi no":           "pgi_no",
  "pgi date":         "pgi_date",
  "pgi dt":           "pgi_date",
  "pgi dt.":          "pgi_date",
  "invoice no.":      "invoice_no",
  "invoice no":       "invoice_no",
  "inv no.":          "invoice_no",
  "inv no":           "invoice_no",
  "invoice date":     "invoice_date",
  "inv dt.":          "invoice_date",
  "inv dt":           "invoice_date",
  "inv date":         "invoice_date",
  "mode":             "mode",
  "no. of case":      "case_count",
  "no of case":       "case_count",
  "case":             "case_count",
  "cases":            "case_count",
  "weight":           "weight",
  "volume":           "volume",
  "amount":           "amount",
  "preferred mode":   "preferred_mode",
  "pref mode":        "preferred_mode",
  "preferred edd":    "preferred_edd",
  "pref edd":         "preferred_edd",
  "dispatch remark":  "dispatch_remark",
  "dispatch":         "dispatch_remark",
  "eod data":         "eod_data",
  "eod":              "eod_data",
};

// Keys that must be present after mapping
const REQUIRED_KEYS = [
  "plant", "location", "pgi_no", "pgi_date",
  "invoice_no", "mode", "case_count",
  "weight", "volume", "amount",
];

// ── Helpers ────────────────────────────────────────────
function normalizeHeader(h: string): string {
  return h.trim().toLowerCase().replace(/\s+/g, " ");
}

function parseExcelDate(val: unknown): string {
  if (!val) return "";
  if (val instanceof Date) return val.toISOString().split("T")[0];
  const s = String(val).trim();

  // DD.MM.YYYY or DD-MM-YYYY or DD/MM/YYYY
  const dmy = s.match(/^(\d{1,2})[.\-/](\d{1,2})[.\-/](\d{2,4})$/);
  if (dmy) {
    const y = dmy[3].length === 2 ? `20${dmy[3]}` : dmy[3];
    return `${y}-${dmy[2].padStart(2, "0")}-${dmy[1].padStart(2, "0")}`;
  }

  // Excel serial number
  const num = Number(s);
  if (!isNaN(num) && num > 30000 && num < 60000) {
    const d = new Date((num - 25569) * 86400000);
    return d.toISOString().split("T")[0];
  }

  return s;
}

function parseAmount(val: unknown): number {
  if (val == null) return 0;
  if (typeof val === "number") return val;
  const cleaned = String(val).replace(/,/g, "").trim();
  const n = parseFloat(cleaned);
  return isNaN(n) ? 0 : n;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || !file.name.endsWith(".xlsx")) {
      return NextResponse.json(
        { error: "Invalid file. Only .xlsx format is accepted." },
        { status: 400 }
      );
    }

    // ── Parse Excel ────────────────────────────────────
    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { cellDates: true });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawRows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet);

    if (rawRows.length === 0) {
      return NextResponse.json(
        { error: "Excel file is empty." },
        { status: 400 }
      );
    }

    // ── Build header mapping ───────────────────────────
    const rawHeaders = Object.keys(rawRows[0]);
    const headerMap: Record<string, string> = {}; // raw header → standard key
    const unmapped: string[] = [];

    for (const raw of rawHeaders) {
      const norm = normalizeHeader(raw);
      const key = HEADER_ALIASES[norm];
      if (key) {
        headerMap[raw] = key;
      } else {
        unmapped.push(raw);
      }
    }

    // Check required keys are present
    const mappedKeys = new Set(Object.values(headerMap));
    const missingKeys = REQUIRED_KEYS.filter((k) => !mappedKeys.has(k));

    if (missingKeys.length > 0) {
      return NextResponse.json(
        {
          error: "Excel is missing required columns.",
          details: {
            missing: missingKeys,
            unmapped: unmapped.length > 0 ? unmapped : undefined,
          },
        },
        { status: 400 }
      );
    }

    // ── Normalize rows using header map ────────────────
    const rows = rawRows.map((raw) => {
      const mapped: Record<string, unknown> = {};
      for (const [rawKey, stdKey] of Object.entries(headerMap)) {
        mapped[stdKey] = raw[rawKey];
      }
      return mapped;
    });

    // ── Today's date (auto-assigned) ───────────────────
    const today = new Date().toISOString().split("T")[0];
    const supabase = getSupabase();

    // ── Delete today's old batch (replace mode) ────────
    await supabase
      .from("upload_batches")
      .delete()
      .eq("upload_date", today);

    // ── Insert new batch ───────────────────────────────
    const { data: batch, error: batchError } = await supabase
      .from("upload_batches")
      .insert({ upload_date: today })
      .select()
      .single();

    if (batchError || !batch) {
      return NextResponse.json(
        { error: "Failed to create batch.", details: batchError?.message },
        { status: 500 }
      );
    }

    // ── Parse & insert records ─────────────────────────
    const records = rows
      .filter((row) => {
        const plant = String(row["plant"] ?? "").trim().toUpperCase();
        return plant && plant !== "TOTAL" && plant !== "";
      })
      .map((row) => ({
        batch_id: batch.id,
        plant: String(row["plant"] ?? "").trim(),
        location: String(row["location"] ?? "").trim(),
        pgi_no: String(row["pgi_no"] ?? "").trim(),
        pgi_date: parseExcelDate(row["pgi_date"]),
        invoice_no: String(row["invoice_no"] ?? "").trim(),
        invoice_date: parseExcelDate(row["invoice_date"]),
        mode: String(row["mode"] ?? "").trim(),
        case_count: Number(row["case_count"] ?? 0),
        weight: parseAmount(row["weight"]),
        volume: parseAmount(row["volume"]),
        amount: parseAmount(row["amount"]),
        preferred_mode: String(row["preferred_mode"] ?? "").trim(),
        preferred_edd: parseExcelDate(row["preferred_edd"]),
        dispatch_remark: String(row["dispatch_remark"] ?? "").trim(),
        eod_data: String(row["eod_data"] ?? "").trim(),
        is_ready: false,
      }));

    if (records.length === 0) {
      return NextResponse.json(
        { error: "No valid data rows found in Excel." },
        { status: 400 }
      );
    }

    const { error: insertError } = await supabase
      .from("logistics_records")
      .insert(records);

    if (insertError) {
      return NextResponse.json(
        { error: "Failed to insert records.", details: insertError.message },
        { status: 500 }
      );
    }

    // ── Cleanup: delete batches older than 7 days ──────
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const cutoff = sevenDaysAgo.toISOString().split("T")[0];

    await supabase
      .from("upload_batches")
      .delete()
      .lt("upload_date", cutoff);

    return NextResponse.json({
      success: true,
      batch_id: batch.id,
      upload_date: today,
      row_count: records.length,
    });
  } catch (err) {
    console.error("Upload error:", err);
    return NextResponse.json(
      { error: "Server error processing upload." },
      { status: 500 }
    );
  }
}
