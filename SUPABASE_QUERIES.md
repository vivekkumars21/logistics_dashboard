# Supabase Queries Reference

## Database Schema

### Tables
- `upload_batches` - Stores excel upload batches
- `shipments` - Stores shipment records from excel files

---

## 1. UPLOAD ROUTES (POST /api/upload)

### Create Upload Batch
```typescript
// Delete today's old batch (replace mode)
await supabase
  .from("upload_batches")
  .delete()
  .eq("upload_date", today);

// Create new batch for today
const { data: batch, error: batchError } = await supabase
  .from("upload_batches")
  .insert({ upload_date: today })
  .select()
  .single();
```

### Insert Shipments (Records Mapping)
```typescript
const { error: insertError } = await supabase
  .from("shipments")
  .insert(records); // records is array of shipment objects

// Example record structure:
{
  batch_id: number,
  plant: string,
  location: string,
  pgi_no: string,
  pgi_date: string (YYYY-MM-DD),
  nc_cc: string (YES/NO),
  mode: string,
  case_count: number,
  preferred_edd: string (YYYY-MM-DD),
  dispatch_remark: string,
  remarks: string,
  is_ready: boolean
}
```

### Cleanup Old Batches
```typescript
// Delete batches older than 24 days
const cutoffDate = new Date();
cutoffDate.setDate(cutoffDate.getDate() - 24);
const cutoff = cutoffDate.toISOString().split("T")[0];

await supabase
  .from("upload_batches")
  .delete()
  .lt("upload_date", cutoff);
```

---

## 2. BATCH QUERIES

### Get All Batches with Stats (GET /api/batches)
```typescript
// Fetch all batches (last 24 days)
const { data: batches, error: batchError } = await supabase
  .from("upload_batches")
  .select("*")
  .order("upload_date", { ascending: false })
  .limit(24);

// Fetch shipment stats for batches
const { data: stats, error: statsError } = await supabase
  .from("shipments")
  .select("batch_id, is_ready")
  .in("batch_id", batchIds);

// Response includes:
// - total_shipments count
// - ready_count (is_ready = true)
// - in_process_count (is_ready = false)
```

### Get Batch Details (GET /api/batches/[batchId])
```typescript
// Get batch info
const { data: batch, error: batchError } = await supabase
  .from("upload_batches")
  .select("*")
  .eq("id", batchId)
  .single();

// Get all shipments in batch
const { data: shipments, error: shipError } = await supabase
  .from("shipments")
  .select("*")
  .eq("batch_id", batchId)
  .order("id", { ascending: true });
```

---

## 3. RECORDS/SHIPMENTS QUERIES

### Get Records for Display (GET /api/records)
```typescript
// Optional: filter by batchId or get latest batch
const { data: batch } = await supabase
  .from("upload_batches")
  .select("*")
  .eq("id", batchId)
  .single();

// Or get latest batch
const { data: batch } = await supabase
  .from("upload_batches")
  .select("*")
  .order("upload_date", { ascending: false })
  .limit(1)
  .single();

// Get all shipments for batch
const { data: records, error: recError } = await supabase
  .from("shipments")
  .select("*")
  .eq("batch_id", batch.id)
  .order("id", { ascending: true });

// Split into lists
const inProcessList = records.filter((r) => !r.is_ready);
const readyList = records.filter((r) => r.is_ready);
```

### Update Record (PATCH /api/records/[id]/ready)
```typescript
// Update dispatch_remark, remarks, or is_ready status
const { data, error } = await supabase
  .from("shipments")
  .update(updatePayload)
  .eq("id", recordId)
  .select()
  .single();

// Allowed fields for update:
// - location, pgi_no, pgi_date
// - nc_cc, mode, case_count
// - preferred_edd, dispatch_remark, remarks
// - is_ready
```

### Delete Record (DELETE /api/records/[id]/ready)
```typescript
const { error } = await supabase
  .from("shipments")
  .delete()
  .eq("id", recordId);
```

---

## 4. PLANT HISTORY QUERIES (GET /api/plant-history)

### Get Plant History (Last 24 Days)
```typescript
// Get all batches from last 24 days
const cutoffDate = new Date();
cutoffDate.setDate(cutoffDate.getDate() - 24);
const cutoff = cutoffDate.toISOString().split("T")[0];

const { data: batches } = await supabase
  .from("upload_batches")
  .select("id, upload_date")
  .gte("upload_date", cutoff)
  .order("upload_date", { ascending: false });

// Get plant records across those batches
const { data: records, error } = await supabase
  .from("shipments")
  .select("*, batch:upload_batches(upload_date)")
  .eq("plant", plant)
  .in("batch_id", batchIds)
  .order("batch_id", { ascending: false });

// Build history entries with stats:
// - upload_date
// - mode, case_count, nc_cc
// - location, is_ready, pgi_no
// - preferred_edd, dispatch_remark
```

---

## 5. PLANT STATUS QUERIES (GET /api/plant-status)

### Get All Plants Status for TV Display
```typescript
// Get latest batch
const { data: batch } = await supabase
  .from("upload_batches")
  .select("*")
  .order("upload_date", { ascending: false })
  .limit(1)
  .single();

// Get all shipments grouped by plant
const { data: records } = await supabase
  .from("shipments")
  .select("id, plant, location, is_ready")
  .eq("batch_id", batch.id)
  .order("plant", { ascending: true })
  .order("id", { ascending: true });

// Groups by plant with counts:
// - plant_name
// - status_map { "plant": { ready: X, pending: Y } }
```

---

## 6. REALTIME SUBSCRIPTIONS

### Dashboard Realtime (page.tsx)
```typescript
const channel = supabase
  .channel(`logistics-records-batch-${batchId}`)
  .on(
    'postgres_changes',
    {
      event: '*', // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'shipments',
      filter: `batch_id=eq.${batchId}`
    },
    (payload) => {
      // Handle: INSERT, UPDATE, DELETE events
      // Automatically sync table on changes
    }
  )
  .subscribe();

// Cleanup
return () => {
  supabase.removeChannel(channel);
};
```

### TV View Realtime (tv/page.tsx)
```typescript
const channel = supabase
  .channel("zdc-hub-realtime")
  .on(
    "postgres_changes",
    {
      event: "*",
      schema: "public",
      table: "shipments",
    },
    () => {
      fetchPlantStatus(); // Refresh on any change
    }
  )
  .subscribe();
```

---

## 7. DATA MODELS

### Shipment Record
```typescript
interface PLANTFLOW7Record {
  id: number;
  batch_id: number;
  plant: string;
  location: string;
  pgi_no: string;
  pgi_date: string;
  nc_cc: string; // YES or NO
  mode: string;
  case_count: number;
  preferred_edd: string;
  dispatch_remark: string;
  remarks: string;
  is_ready: boolean;
  created_at: string;
}
```

### Upload Batch
```typescript
interface UploadBatch {
  id: number;
  upload_date: string; // YYYY-MM-DD
  created_at: string;
}
```

### Dashboard Stats
```typescript
interface DashboardStats {
  total: number;
  inProcess: number;
  ready: number;
}
```

### Batch with Stats
```typescript
interface BatchWithStats {
  id: number;
  upload_date: string;
  created_at: string;
  total_shipments: number;
  ready_count: number;
  in_process_count: number;
}
```

---

## 8. ERROR HANDLING

All endpoints return standard error format:
```typescript
{
  error: "Error message",
  details: "Detailed error from Supabase"
}
```

---

## 9. PERFORMANCE INDEXES

Database has the following indexes for fast queries:
- `idx_shipments_batch_id` - Fast batch lookups
- `idx_shipments_plant` - Fast plant filters
- `idx_shipments_is_ready` - Quick ready/pending splits
- `idx_shipments_pgi_no` - PGI number searches
- `idx_shipments_pgi_date` - Date range queries

---

## 10. API ENDPOINTS SUMMARY

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/api/upload` | Upload Excel file & create batch |
| GET | `/api/batches` | Get all batches with stats |
| GET | `/api/batches/[batchId]` | Get batch details + shipments |
| GET | `/api/records` | Get records for dashboard |
| PATCH | `/api/records/[id]/ready` | Update shipment fields |
| DELETE | `/api/records/[id]/ready` | Delete shipment |
| GET | `/api/plant-history` | Get plant history (24 days) |
| GET | `/api/plant-status` | Get all plants status |

---

## 11. QUERY PATTERNS

### Filtering
```typescript
// Single value
.eq("field", value)

// Range (date, numbers)
.gte("field", minValue)
.lte("field", maxValue)

// Multiple values
.in("field", arrayOfValues)

// Not equal
.neq("field", value)
```

### Ordering
```typescript
.order("field", { ascending: true })
.order("field", { ascending: false })
```

### Limiting
```typescript
.limit(10)
.limit(1).single() // Return single object
```

### Selecting Specific Columns
```typescript
.select("id, plant, location, is_ready")
```

### Nested Relations
```typescript
.select("*, batch:upload_batches(upload_date)")
```

---

## 12. COMMON OPERATIONS

### Count Records
```typescript
const total = records.length;
const ready = records.filter(r => r.is_ready).length;
const inProcess = records.filter(r => !r.is_ready).length;
```

### Search/Filter Client-Side
```typescript
const filtered = records.filter(r =>
  r.plant.includes(query) ||
  r.location.includes(query) ||
  r.pgi_no.includes(query)
);
```

### Format Dates
```typescript
const date = "2026-02-24";
const dt = new Date(date + "T00:00:00");
const formatted = `${dd}-${mm}-${yyyy}`; // 24-02-2026
```

---
