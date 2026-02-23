import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import * as XLSX from "xlsx";

// ── Required Excel headers (exact match) ───────────────
const REQUIRED_HEADERS = [
  "Plant",
  "Location",
  "PGI No.",
  "PGI Date",
  "Invoice No.",
  "Invoice Date",
  "Mode",
  "No. of Case",
  "Weight",
  "Volume",
  "Amount",
  "Preferred Mode",
  "Preferred EDD",
  "Dispatch Remark",
];

// ── Helpers ────────────────────────────────────────────
function parseExcelDate(val: unknown): string {
  if (!val) return "";
  if (val instanceof Date) return val.toISOString().split("T")[0];
  const s = String(val).trim();

  // DD.MM.YYYY or DD-MM-YYYY
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
  // Remove Indian-style commas: "2,56,675.96"
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
    const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(sheet);

    if (rows.length === 0) {
      return NextResponse.json(
        { error: "Excel file is empty." },
        { status: 400 }
      );
    }

    // ── Validate headers ───────────────────────────────
    const headers = Object.keys(rows[0]);
    const missing = REQUIRED_HEADERS.filter((h) => !headers.includes(h));
    const extra = headers.filter((h) => !REQUIRED_HEADERS.includes(h));

    if (missing.length > 0) {
      return NextResponse.json(
        {
          error: "Invalid Excel format. Please use official template.",
          details: { missing, extra },
        },
        { status: 400 }
      );
    }

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
        const plant = String(row["Plant"] ?? "").trim().toUpperCase();
        return plant && plant !== "TOTAL" && plant !== "";
      })
      .map((row) => ({
        batch_id: batch.id,
        plant: String(row["Plant"] ?? "").trim(),
        location: String(row["Location"] ?? "").trim(),
        pgi_no: String(row["PGI No."] ?? "").trim(),
        pgi_date: parseExcelDate(row["PGI Date"]),
        invoice_no: String(row["Invoice No."] ?? "").trim(),
        invoice_date: parseExcelDate(row["Invoice Date"]),
        mode: String(row["Mode"] ?? "").trim(),
        case_count: Number(row["No. of Case"] ?? 0),
        weight: parseAmount(row["Weight"]),
        volume: parseAmount(row["Volume"]),
        amount: parseAmount(row["Amount"]),
        preferred_mode: String(row["Preferred Mode"] ?? "").trim(),
        preferred_edd: parseExcelDate(row["Preferred EDD"]),
        dispatch_remark: String(row["Dispatch Remark"] ?? "").trim(),
        eod_data: String(row["EOD Data"] ?? "").trim(),
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
