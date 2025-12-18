"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Download, Eye, X, Save, CheckCircle2, Banknote } from "lucide-react";

/* ---------------------------------------------
   TYPES
--------------------------------------------- */
type PayrollStatus = "PREVIEW" | "GENERATED" | "APPROVED" | "PARTIAL" | "PAID";

interface PayrollRow {
  id: number; // UI row id (driverId)
  driverId: number;
  payrollId?: number | null;
  driverName: string;
  periodStart: string; // yyyy-mm-dd
  periodEnd: string; // yyyy-mm-dd
  tripCount: number;

  // computed (read-only from backend)
  computedTotalWeightKg: number;
  computedRatePerKg: number; // backend weighted avg/reference only (NOT shown in UI)
  computedPayableAmount: number;

  // stored totals in payroll (backend)
  totalWeightKg: number;
  ratePerKg: number; // backend weighted avg/reference only (NOT shown in UI)
  payableAmount: number;

  paidAmount: number;
  status: PayrollStatus;
  generatedAt: string;

  discrepancyNote?: string;
}

/**
 * ✅ Trip row for modal (preview + generated)
 * Always includes clientName + clientRatePerKg so accounting can verify.
 */
type ModalTripRow = {
  haulingTripId: number; // ✅ matches backend DriverPayrollTrip.HaulingTripId
  clientName: string;
  clientRatePerKg: number;

  wasteType: string;
  timeDone: string;

  originalWeightKg: number;
  editedWeightKg: number | null;
  effectiveWeightKg: number; // edited ?? original

  receiptNumber: string | null;
  status: string;
};

/* ---------------------------------------------
   MAIN PAGE
--------------------------------------------- */
export default function DriverPayrollPage() {
  const todayIso = () => new Date().toISOString().slice(0, 10);

  const [periodStart, setPeriodStart] = useState<string>(() => todayIso());
  const [periodEnd, setPeriodEnd] = useState<string>(() => todayIso());
  const [driverSearch, setDriverSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<PayrollStatus | "ALL">("ALL");

  const [rows, setRows] = useState<PayrollRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<PayrollRow | null>(null);

  // modal data
  const [modalTrips, setModalTrips] = useState<ModalTripRow[]>([]);
  const [modalTripsLoading, setModalTripsLoading] = useState(false);
  const [modalTripsError, setModalTripsError] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL;

  const getTokenOrThrow = (): string => {
    const token = localStorage.getItem("gc_token");
    if (!token) throw new Error("Not logged in. Please login first.");
    return token;
  };

  const nowLocalStamp = () => new Date().toISOString().slice(0, 16).replace("T", " ");

  /* ---------------------------------------------
     STATUS NORMALIZER
  --------------------------------------------- */
  const normalizeStatus = (raw: unknown): PayrollStatus => {
    const v = String(raw ?? "").trim().toUpperCase();
    switch (v) {
      case "GENERATED":
      case "APPROVED":
      case "PARTIAL":
      case "PAID":
        return v as PayrollStatus;
      case "PENDING":
        return "GENERATED";
      default:
        return "PREVIEW";
    }
  };

  /* ---------------------------------------------
     FILE -> BASE64 (for proof image)
  --------------------------------------------- */
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  /* ---------------------------------------------
     LOAD OVERVIEW
  --------------------------------------------- */
    const loadOverview = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!API_BASE) throw new Error("NEXT_PUBLIC_API_URL is not set");

      const qs = new URLSearchParams({ from: periodStart, to: periodEnd }).toString();
      const token = getTokenOrThrow();

      const res = await fetch(`${API_BASE}/api/Accounting/payroll/overview?${qs}`, {
        method: "GET",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(`Failed to load payroll (${res.status}): ${msg}`);
      }

      const data = (await res.json()) as unknown[];

      const mapped: PayrollRow[] = data.map((r) => {
        const o = (r ?? {}) as Record<string, unknown>;

        const pick = (...keys: string[]) => {
          for (const k of keys) {
            const v = o[k];
            if (v !== undefined && v !== null) return v;
          }
          return undefined;
        };

        const driverId = Number(pick("DriverId", "driverId") ?? 0);
        const driverName = String(pick("DriverName", "driverName") ?? "");
        const tripCount = Number(pick("TripCount", "tripCount") ?? 0);

        const payrollIdRaw = pick("PayrollId", "payrollId");
        const payrollIdNum =
          payrollIdRaw === undefined || payrollIdRaw === null ? null : Number(payrollIdRaw);
        const payrollId = payrollIdNum != null && !Number.isNaN(payrollIdNum) ? payrollIdNum : null;

        const computedTotalWeightKg = Number(
          pick("ComputedTotalWeightKg", "computedTotalWeightKg", "TotalWeight", "totalWeight") ?? 0
        );

        const computedRatePerKg = Number(
          pick("ComputedRatePerKg", "computedRatePerKg", "RatePerKg", "ratePerKg") ?? 0
        );

        const computedPayableAmount =
          pick("ComputedPayableAmount") != null
            ? Number(pick("ComputedPayableAmount"))
            : pick("computedPayableAmount") != null
            ? Number(pick("computedPayableAmount"))
            : pick("PayableAmount") != null
            ? Number(pick("PayableAmount"))
            : pick("payableAmount") != null
            ? Number(pick("payableAmount"))
            : round2(computedTotalWeightKg * computedRatePerKg);

        const totalWeightKg = Number(
          pick("TotalWeightKg", "totalWeightKg", "TotalWeight", "totalWeight") ?? computedTotalWeightKg
        );

        const payableAmount = Number(pick("PayableAmount", "payableAmount") ?? computedPayableAmount);
        const ratePerKg = Number(pick("RatePerKg", "ratePerKg") ?? computedRatePerKg); // reference only

        const paidAmount = Number(pick("PaidAmount", "paidAmount") ?? 0);

        const status: PayrollStatus = normalizeStatus(pick("Status", "status"));
        const generatedAt =
          status === "PREVIEW"
            ? ""
            : String(pick("GeneratedAt", "generatedAt") ?? nowLocalStamp());

        return {
          id: driverId,
          payrollId,
          driverId,
          driverName,
          periodStart,
          periodEnd,
          tripCount,

          computedTotalWeightKg,
          computedRatePerKg,
          computedPayableAmount,

          totalWeightKg,
          ratePerKg,
          payableAmount,

          paidAmount,
          status,
          generatedAt,
          discrepancyNote: String(pick("DiscrepancyNote", "discrepancyNote") ?? ""),
        };
      });

      setRows(mapped);
    } catch (e: unknown) {
      setRows([]);
      const msg =
        e instanceof Error ? e.message : typeof e === "string" ? e : "Failed to load payroll";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOverview();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [periodStart, periodEnd]);

  /* ---------------------------------------------
     TRIPS LOADER (PREVIEW vs GENERATED)
  --------------------------------------------- */
  const loadPreviewTripsByDriver = async (driverId: number) => {
    if (!API_BASE) throw new Error("NEXT_PUBLIC_API_URL is not set");
    const token = getTokenOrThrow();

    const qs = new URLSearchParams({
      driverId: String(driverId),
      from: periodStart,
      to: periodEnd,
    }).toString();

    const res = await fetch(`${API_BASE}/api/Accounting/reports/payroll/drivers/details?${qs}`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(await res.text());

    const data: any[] = await res.json();

    return data.map((t) => {
      const tripId = Number(t.Id ?? t.id ?? 0);
      const w = Number(t.WeightHauledKg ?? t.weightHauledKg ?? 0);

      const rateRaw = t.ClientRatePerKg ?? t.clientRatePerKg ?? 0;
      const rate = Number(rateRaw);

      return {
        haulingTripId: tripId,
        clientName: String(t.ClientName ?? t.clientName ?? ""),
        clientRatePerKg: Number.isFinite(rate) ? rate : 0,

        wasteType: String(t.WasteType ?? t.wasteType ?? ""),
        timeDone: String(t.TimeDone ?? t.timeDone ?? ""),
        originalWeightKg: w,
        editedWeightKg: null,
        effectiveWeightKg: w,

        receiptNumber: t.ReceiptNumber ?? t.receiptNumber ?? null,
        status: String(t.Status ?? t.status ?? ""),
      } as ModalTripRow;
    });
  };

  const loadPayrollTripsByPayrollId = async (payrollId: number) => {
    if (!API_BASE) throw new Error("NEXT_PUBLIC_API_URL is not set");
    const token = getTokenOrThrow();

    const res = await fetch(`${API_BASE}/api/Accounting/payroll/${payrollId}/trips`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) throw new Error(await res.text());

    const data: any[] = await res.json();

    return data.map((x) => {
      const haulingTripId = Number(x.HaulingTripId ?? x.haulingTripId ?? x.Id ?? x.id ?? 0);
      const original = Number(x.OriginalWeightKg ?? x.originalWeightKg ?? 0);
      const edited = x.EditedWeightKg ?? x.editedWeightKg ?? null;
      const effective = Number(x.EffectiveWeightKg ?? x.effectiveWeightKg ?? (edited ?? original));

      const rateRaw = x.ClientRatePerKg ?? x.clientRatePerKg ?? 0;
      const rate = Number(rateRaw);

      return {
        haulingTripId,
        clientName: String(x.ClientName ?? x.clientName ?? ""),
        clientRatePerKg: Number.isFinite(rate) ? rate : 0,

        wasteType: String(x.WasteType ?? x.wasteType ?? ""),
        timeDone: String(x.TimeDone ?? x.timeDone ?? ""),
        originalWeightKg: original,
        editedWeightKg: edited != null ? Number(edited) : null,
        effectiveWeightKg: effective,

        receiptNumber: x.ReceiptNumber ?? x.receiptNumber ?? null,
        status: String(x.Status ?? x.status ?? ""),
      } as ModalTripRow;
    });
  };

  const loadTripsForModal = async (row: PayrollRow) => {
    setModalTrips([]);
    setModalTripsError(null);
    setModalTripsLoading(true);

    try {
      const trips = row.payrollId
        ? await loadPayrollTripsByPayrollId(row.payrollId)
        : await loadPreviewTripsByDriver(row.driverId);

      setModalTrips(trips);
    } catch (e: any) {
      setModalTripsError(e?.message ?? "Failed to load trips");
    } finally {
      setModalTripsLoading(false);
    }
  };

  /* ---------------------------------------------
     GENERATE PAYROLL (PER DRIVER)
  --------------------------------------------- */
  const generatePayrollForDriver = async (driverId: number) => {
    try {
      if (!API_BASE) throw new Error("NEXT_PUBLIC_API_URL is not set");
      const token = getTokenOrThrow();

      const res = await fetch(`${API_BASE}/api/Accounting/payroll/generate`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ driverId, periodStart, periodEnd }),
      });

      if (res.status === 409) {
        await loadOverview();
        alert("Payroll already generated for this driver and period.");
        return;
      }

      if (!res.ok) throw new Error(await res.text());

      await res.json();
      await loadOverview();
      alert("Payroll generated successfully.");
    } catch (e: any) {
      alert(e?.message ?? "Failed to generate payroll");
    }
  };

  /* ---------------------------------------------
     GENERATE PAYROLL (BATCH)
  --------------------------------------------- */
  const generatePayrollBatch = async () => {
    try {
      if (!API_BASE) throw new Error("NEXT_PUBLIC_API_URL is not set");
      const token = getTokenOrThrow();

      const res = await fetch(`${API_BASE}/api/Accounting/payroll/generate/batch`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ periodStart, periodEnd, skipExisting: true }),
      });

      if (!res.ok) throw new Error(await res.text());

      const report = await res.json();
      await loadOverview();

      alert(
        `Batch result:\n` +
          `Generated: ${report.Generated}\n` +
          `Skipped existing: ${report.SkippedExisting}\n` +
          `Notes/Failures: ${report.Failed}`
      );
    } catch (e: any) {
      alert(e?.message ?? "Failed to generate batch payroll");
    }
  };

  /* ---------------------------------------------
     SAVE DISCREPANCY NOTE ONLY (PUT payroll/{id})
  --------------------------------------------- */
  const savePayrollNote = async (row: PayrollRow, discrepancyNote: string) => {
    if (!row.payrollId) {
      alert("Payroll must be generated before saving edits.");
      return;
    }

    try {
      if (!API_BASE) throw new Error("NEXT_PUBLIC_API_URL is not set");
      const token = getTokenOrThrow();

      const res = await fetch(`${API_BASE}/api/Accounting/payroll/${row.payrollId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ discrepancyNote: discrepancyNote ?? "" }),
      });

      if (!res.ok) throw new Error(await res.text());
    } catch (e: any) {
      alert(e?.message ?? "Failed to save note.");
      throw e;
    }
  };

  /* ---------------------------------------------
     ✅ SAVE PER-TRIP WEIGHTS (PUT payroll/{id}/trips)
     { trips: [{ haulingTripId, weightKg }] }
  --------------------------------------------- */
  const savePayrollTripWeights = async (payrollId: number, trips: ModalTripRow[]) => {
    try {
      if (!API_BASE) throw new Error("NEXT_PUBLIC_API_URL is not set");
      const token = getTokenOrThrow();

      const payload = {
        trips: trips.map((t) => ({
          haulingTripId: t.haulingTripId,
          weightKg: Number(t.effectiveWeightKg || 0),
        })),
      };

      const res = await fetch(`${API_BASE}/api/Accounting/payroll/${payrollId}/trips`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error(await res.text());
    } catch (e: any) {
      alert(e?.message ?? "Failed to save per-trip weights.");
      throw e;
    }
  };

  /* ---------------------------------------------
     ✅ APPROVE
  --------------------------------------------- */
  const approvePayroll = async (row: PayrollRow) => {
    if (!row.payrollId) return alert("Generate payroll first.");
    if (row.status !== "GENERATED") return alert("Only GENERATED payrolls can be approved.");

    try {
      if (!API_BASE) throw new Error("NEXT_PUBLIC_API_URL is not set");
      const token = getTokenOrThrow();

      const res = await fetch(`${API_BASE}/api/Accounting/payroll/${row.payrollId}/approve`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) throw new Error(await res.text());

      await loadOverview();
      alert("Payroll approved.");
    } catch (e: any) {
      alert(e?.message ?? "Failed to approve payroll.");
    }
  };

  /* ---------------------------------------------
     ✅ PAY (base64 proof)
  --------------------------------------------- */
  const payPayroll = async (row: PayrollRow, amount: number, proofFile: File, referenceNo?: string) => {
    if (!row.payrollId) return alert("Generate payroll first.");
    if (amount <= 0) return alert("Amount must be > 0.");
    if (!proofFile) return alert("Proof image is required.");

    try {
      if (!API_BASE) throw new Error("NEXT_PUBLIC_API_URL is not set");
      const token = getTokenOrThrow();
      const base64Image = await fileToBase64(proofFile);

      const res = await fetch(`${API_BASE}/api/Accounting/payroll/${row.payrollId}/pay`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ amount, base64Image, referenceNo }),
      });

      if (!res.ok) throw new Error(await res.text());

      await loadOverview();
      alert("Payment recorded.");
    } catch (e: any) {
      alert(e?.message ?? "Failed to record payment.");
    }
  };

  /* ---------------------------------------------
     FILTERED + SUMMARY
  --------------------------------------------- */
  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchesDriver =
        !driverSearch.trim() ||
        r.driverName.toLowerCase().includes(driverSearch.trim().toLowerCase()) ||
        String(r.driverId).includes(driverSearch.trim());

      const matchesStatus = statusFilter === "ALL" ? true : r.status === statusFilter;
      const matchesPeriod = r.periodStart === periodStart && r.periodEnd === periodEnd;

      return matchesDriver && matchesStatus && matchesPeriod;
    });
  }, [rows, driverSearch, statusFilter, periodStart, periodEnd]);

  const summary = useMemo(() => {
    const totalDrivers = filtered.length;
    const totalRuns = filtered.reduce((sum, r) => sum + r.tripCount, 0);
    const totalWeight = filtered.reduce((sum, r) => sum + Number(r.totalWeightKg || 0), 0);
    const totalPayable = filtered.reduce((sum, r) => sum + Number(r.payableAmount || 0), 0);
    return { totalDrivers, totalRuns, totalWeight, totalPayable };
  }, [filtered]);

  /* ---------------------------------------------
     EXPORT CSV (no effective rate column)
  --------------------------------------------- */
  const exportCSV = () => {
    if (filtered.length === 0) return alert("No data to export");

    const header = [
      "Driver",
      "Driver ID",
      "Period Start",
      "Period End",
      "Run Count",
      "Total Weight (kg)",
      "Payable",
      "Status",
      "Paid Amount",
    ];

    const rowsCsv = filtered.map((r) => [
      r.driverName,
      r.driverId.toString(),
      r.periodStart,
      r.periodEnd,
      r.tripCount.toString(),
      String(r.totalWeightKg),
      String(r.payableAmount),
      r.status,
      String(r.paidAmount),
    ]);

    const csv = [header, ...rowsCsv].map((row) => row.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `driver-payroll-${periodStart}-to-${periodEnd}.csv`;
    link.click();
  };

  const clearFilters = () => {
    setDriverSearch("");
    setStatusFilter("ALL");
  };

  const hasActiveFilters = driverSearch || statusFilter !== "ALL";

  const openDetails = async (r: PayrollRow) => {
    setSelected(r);
    await loadTripsForModal(r);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 p-6">
      {/* TITLE */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Driver Payroll</h1>
        <p className="text-gray-500 mt-1">
          Weekly payroll based on completed runs and pickup weights × per-trip client rate.
        </p>
      </div>

      {/* SUMMARY */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-800">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard label="Drivers Included" value={summary.totalDrivers.toString()} />
          <SummaryCard label="Total Runs" value={summary.totalRuns.toString()} />
          <SummaryCard label="Total Weight" value={`${summary.totalWeight.toLocaleString()} kg`} />
          <SummaryCard label="Total Payable" value={`₱${summary.totalPayable.toLocaleString()}`} />
        </div>
      </div>

      {/* FILTERS + TABLE */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        {/* TOP CONTROLS */}
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">
            Payroll{" "}
            {filtered.length > 0 && <span className="text-sm text-gray-500">({filtered.length} results)</span>}
          </h2>

          <div className="flex gap-3">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                Clear Filters
              </button>
            )}

            <button
              onClick={generatePayrollBatch}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
            >
              Generate Payroll
            </button>

            <button
              onClick={exportCSV}
              disabled={filtered.length === 0}
              className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>

        {/* FILTER FIELDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            placeholder="Search Driver (name or ID)"
            value={driverSearch}
            onChange={(e) => setDriverSearch(e.target.value)}
          />

          <Select
            label="Status"
            value={statusFilter}
            onChange={(v) => setStatusFilter(v as PayrollStatus | "ALL")}
            options={[
              { label: "All", value: "ALL" },
              { label: "Preview", value: "PREVIEW" },
              { label: "Generated", value: "GENERATED" },
              { label: "Approved", value: "APPROVED" },
              { label: "Partial", value: "PARTIAL" },
              { label: "Paid", value: "PAID" },
            ]}
          />

          <DateInput label="Period Start" value={periodStart} onChange={(e) => setPeriodStart(e.target.value)} />
          <DateInput label="Period End" value={periodEnd} onChange={(e) => setPeriodEnd(e.target.value)} />
        </div>

        {/* LOADING / ERROR */}
        {loading && <div className="text-sm text-gray-500">Loading payroll...</div>}
        {error && <div className="text-sm text-red-600">{error}</div>}

        {/* TABLE */}
        <PayrollTable rows={filtered} onOpen={openDetails} onGenerate={generatePayrollForDriver} />
      </div>

      {/* DETAILS MODAL */}
      {selected && (
        <PayrollDetailsModal
          row={selected}
          trips={modalTrips}
          tripsLoading={modalTripsLoading}
          tripsError={modalTripsError}
          onClose={() => setSelected(null)}
          onSave={async (payload) => {
            if (!selected.payrollId) {
              alert("Generate payroll first.");
              return;
            }

            await savePayrollNote(selected, payload.discrepancyNote);
            await savePayrollTripWeights(selected.payrollId, payload.trips);

            await loadOverview();
            await loadTripsForModal({ ...selected });

            alert("Payroll updated.");
          }}
          onApprove={() => approvePayroll(selected)}
          onPay={(amount, file, ref) => payPayroll(selected, amount, file, ref)}
        />
      )}
    </div>
  );
}

/* ---------------------------------------------
   TABLE (NO effective rate column)
--------------------------------------------- */
function PayrollTable({
  rows,
  onOpen,
  onGenerate,
}: {
  rows: PayrollRow[];
  onOpen: (r: PayrollRow) => void;
  onGenerate: (driverId: number) => void;
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr className="text-left uppercase text-xs tracking-wide">
            <th className="py-3 px-4">Driver</th>
            <th className="py-3 px-4">Runs</th>
            <th className="py-3 px-4">Weight</th>
            <th className="py-3 px-4">Payable</th>
            <th className="py-3 px-4">Status</th>
            <th className="py-3 px-4">Actions</th>
          </tr>
        </thead>

        <tbody>
          {rows.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center py-12 text-gray-400">
                No results found
              </td>
            </tr>
          )}

          {rows.map((r) => {
            const canGenerate = r.status === "PREVIEW";
            return (
              <tr key={r.id} className="border-t hover:bg-gray-50 transition">
                <td className="py-3 px-4">
                  <div className="flex flex-col">
                    <span className="font-semibold text-gray-900">{r.driverName}</span>
                    <span className="text-xs text-gray-500">Driver ID: {r.driverId}</span>
                  </div>
                </td>

                <td className="py-3 px-4 text-gray-700">{r.tripCount}</td>
                <td className="py-3 px-4 text-gray-700">{Number(r.totalWeightKg || 0).toLocaleString()} kg</td>

                <td className="py-3 px-4 font-semibold text-green-700">
                  ₱{Number(r.payableAmount || 0).toLocaleString()}
                </td>

                <td className="py-3 px-4">
                  <StatusPill status={r.status} />
                </td>

                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onOpen(r)}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
                    >
                      <Eye size={16} />
                      View
                    </button>

                    <button
                      onClick={() => onGenerate(r.driverId)}
                      disabled={!canGenerate}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                      Generate
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------------------------------------
   DETAILS MODAL
--------------------------------------------- */
type ModalSavePayload = {
  discrepancyNote: string;
  trips: ModalTripRow[];
};

function PayrollDetailsModal({
  row,
  trips,
  tripsLoading,
  tripsError,
  onClose,
  onSave,
  onApprove,
  onPay,
}: {
  row: PayrollRow;
  trips: ModalTripRow[];
  tripsLoading: boolean;
  tripsError: string | null;
  onClose: () => void;

  onSave: (payload: ModalSavePayload) => void | Promise<void>;
  onApprove: () => void;
  onPay: (amount: number, proofFile: File, referenceNo?: string) => void;
}) {
  const [note, setNote] = useState<string>(row.discrepancyNote || "");
  const [editTrips, setEditTrips] = useState<ModalTripRow[]>([]);

  // payment fields
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [referenceNo, setReferenceNo] = useState<string>("");

  useEffect(() => {
    setNote(row.discrepancyNote || "");
    setEditTrips(trips.map((t) => ({ ...t })));
    setPaymentAmount(0);
    setProofFile(null);
    setReferenceNo("");
  }, [row, trips]);

  const totalWeightKg = useMemo(() => {
    return round2(editTrips.reduce((sum, t) => sum + Number(t.effectiveWeightKg || 0), 0));
  }, [editTrips]);

  // ✅ payable = sum(weight × clientRate)
  const computedPayable = useMemo(() => {
    return round2(
      editTrips.reduce((sum, t) => {
        const w = Number(t.effectiveWeightKg || 0);
        const r = Number(t.clientRatePerKg || 0);
        return sum + w * r;
      }, 0)
    );
  }, [editTrips]);

  // ✅ per-client subtotals (group by clientName + rate)
  const clientSubtotals = useMemo(() => {
    const map = new Map<
      string,
      { clientName: string; clientRatePerKg: number; trips: number; totalWeightKg: number; subtotalPayable: number }
    >();

    for (const t of editTrips) {
      const clientName = String(t.clientName ?? "");
      const rate = Number(t.clientRatePerKg || 0);
      const w = Number(t.effectiveWeightKg || 0);
      const key = `${clientName}__${rate}`;

      const cur = map.get(key) ?? {
        clientName,
        clientRatePerKg: rate,
        trips: 0,
        totalWeightKg: 0,
        subtotalPayable: 0,
      };

      cur.trips += 1;
      cur.totalWeightKg = round2(cur.totalWeightKg + w);
      cur.subtotalPayable = round2(cur.subtotalPayable + w * rate);

      map.set(key, cur);
    }

    return Array.from(map.values()).sort((a, b) => {
      if (a.clientName !== b.clientName) return a.clientName.localeCompare(b.clientName);
      return a.clientRatePerKg - b.clientRatePerKg;
    });
  }, [editTrips]);

  const canSave = row.status === "GENERATED" && !!row.payrollId;
  const canApprove = row.status === "GENERATED" && !!row.payrollId;
  const canPay = !!row.payrollId && row.status !== "PAID";

  const updateTripWeight = (haulingTripId: number, weight: number) => {
    setEditTrips((prev) =>
      prev.map((t) => {
        if (t.haulingTripId !== haulingTripId) return t;
        const w = round2(weight);
        return { ...t, editedWeightKg: w, effectiveWeightKg: w };
      })
    );
  };

  const save = async () => {
    if (!canSave) return;
    await onSave({ discrepancyNote: note, trips: editTrips });
    onClose();
  };

  const approve = () => {
    if (!canApprove) return;
    onApprove();
    onClose();
  };

  const pay = () => {
    if (!canPay) return;
    if (paymentAmount <= 0) return alert("Payment amount must be > 0.");
    if (!proofFile) return alert("Please upload proof image.");
    onPay(paymentAmount, proofFile, referenceNo || undefined);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-6xl bg-white rounded-xl shadow-xl flex flex-col max-h-[90vh]">
        {/* HEADER */}
        <div className="flex items-start justify-between px-6 py-4 border-b shrink-0">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Payroll Details</h3>
            <p className="text-sm text-gray-500">
              {row.driverName} • {row.periodStart} to {row.periodEnd}
            </p>
            {row.status !== "PREVIEW" && row.generatedAt && (
              <p className="text-xs text-gray-400 mt-1">Generated: {row.generatedAt}</p>
            )}
          </div>

          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 text-gray-600">
            <X size={18} />
          </button>
        </div>

        {/* BODY */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* SUMMARY */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MiniCard label="Runs" value={row.tripCount.toString()} />
            <MiniCard label="Computed Weight (backend)" value={`${row.computedTotalWeightKg.toLocaleString()} kg`} />
            <MiniCard label="Editable Total Weight (sum trips)" value={`${totalWeightKg.toLocaleString()} kg`} />
            <MiniCard label="Payable (sum weight × client rate)" value={`₱${computedPayable.toLocaleString()}`} />
          </div>

          {/* ✅ PER-CLIENT SUBTOTALS */}
          <div className="border rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b flex justify-between">
              <h4 className="text-sm font-semibold text-gray-800">Per-Client Subtotals</h4>
              <span className="text-xs text-gray-500">{clientSubtotals.length} client rate lines</span>
            </div>

            <div className="max-h-[220px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-white sticky top-0 z-10">
                  <tr className="text-left uppercase text-xs tracking-wide text-gray-600">
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Rate</th>
                    <th className="py-3 px-4">Trips</th>
                    <th className="py-3 px-4">Total Weight (kg)</th>
                    <th className="py-3 px-4">Subtotal Payable</th>
                  </tr>
                </thead>

                <tbody>
                  {clientSubtotals.length === 0 && (
                    <tr>
                      <td colSpan={5} className="text-center py-10 text-gray-400">
                        No subtotal data
                      </td>
                    </tr>
                  )}

                  {clientSubtotals.map((s, idx) => (
                    <tr key={`${s.clientName}-${s.clientRatePerKg}-${idx}`} className="border-t hover:bg-gray-50">
                      <td className="py-2 px-4">{s.clientName}</td>
                      <td className="py-2 px-4">₱{Number(s.clientRatePerKg || 0).toFixed(2)}/kg</td>
                      <td className="py-2 px-4">{s.trips}</td>
                      <td className="py-2 px-4">{Number(s.totalWeightKg || 0).toLocaleString()}</td>
                      <td className="py-2 px-4 font-semibold text-green-700">
                        ₱{Number(s.subtotalPayable || 0).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="px-4 py-3 text-xs text-gray-500 border-t bg-gray-50">
              Subtotals are computed from the editable per-trip weights below (weight × that client&apos;s rate).
            </div>
          </div>

          {/* NOTE */}
          <div className="border rounded-xl p-5 space-y-4">
            <h4 className="text-sm font-semibold text-gray-800">Discrepancy Note</h4>

            {!row.payrollId && (
              <div className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg p-3">
                This is still PREVIEW. Click <b>Generate</b> first to create a payroll record before saving/approving/paying.
              </div>
            )}

            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full border rounded-lg px-4 py-3 min-h-[90px]"
              placeholder="Reason for manual adjustment..."
              disabled={!canSave}
            />
          </div>

          {/* PICKUPS */}
          <div className="border rounded-xl overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b flex justify-between">
              <h4 className="text-sm font-semibold text-gray-800">Pickups Included</h4>
              <span className="text-xs text-gray-500">{editTrips.length} pickups</span>
            </div>

            {tripsLoading && <div className="p-4 text-sm text-gray-500">Loading pickups...</div>}
            {tripsError && <div className="p-4 text-sm text-red-600">{tripsError}</div>}

            <div className="max-h-[360px] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-white sticky top-0 z-10">
                  <tr className="text-left uppercase text-xs tracking-wide text-gray-600">
                    <th className="py-3 px-4">Trip ID</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Rate</th>
                    <th className="py-3 px-4">Waste</th>
                    <th className="py-3 px-4">Time</th>
                    <th className="py-3 px-4">Weight (kg)</th>
                    <th className="py-3 px-4">Receipt</th>
                  </tr>
                </thead>

                <tbody>
                  {!tripsLoading && editTrips.length === 0 && (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-gray-400">
                        No pickups found
                      </td>
                    </tr>
                  )}

                  {editTrips.map((t) => (
                    <tr key={t.haulingTripId} className="border-t hover:bg-gray-50">
                      <td className="py-2 px-4">{t.haulingTripId}</td>
                      <td className="py-2 px-4">{t.clientName}</td>
                      <td className="py-2 px-4">₱{Number(t.clientRatePerKg || 0).toFixed(2)}/kg</td>
                      <td className="py-2 px-4">{t.wasteType}</td>
                      <td className="py-2 px-4">{t.timeDone}</td>

                      <td className="py-2 px-4">
                        <FieldNumberInline
                          value={t.effectiveWeightKg}
                          onChange={(v) => updateTripWeight(t.haulingTripId, v)}
                          disabled={!canSave}
                          decimals={2}
                        />
                      </td>

                      <td className="py-2 px-4">{t.receiptNumber ?? "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {canSave && (
              <div className="px-4 py-3 text-xs text-gray-500 border-t bg-gray-50">
                Editing weights here updates totals and payable using each trip&apos;s client rate (weight × clientRate).
              </div>
            )}
          </div>

          {/* PAYMENT */}
          <div className="border rounded-xl p-5 space-y-4">
            <h4 className="text-sm font-semibold text-gray-800">Payment</h4>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <FieldNumber
                label="Payment Amount"
                value={paymentAmount}
                onChange={setPaymentAmount}
                disabled={!canPay}
                prefix="₱"
                decimals={2}
              />

              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-gray-600 font-medium">Proof Image (required)</label>
                <input
                  type="file"
                  accept="image/*"
                  disabled={!canPay}
                  onChange={(e) => setProofFile(e.target.files?.[0] ?? null)}
                  className="border rounded-lg px-3 py-2"
                />
                {proofFile && (
                  <div className="text-xs text-gray-500">
                    Selected: {proofFile.name} ({Math.round(proofFile.size / 1024)} KB)
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-sm text-gray-600 font-medium">Reference No (optional)</label>
                <input
                  type="text"
                  value={referenceNo}
                  disabled={!canPay}
                  onChange={(e) => setReferenceNo(e.target.value)}
                  className="border rounded-lg px-4 py-2.5"
                  placeholder="e.g. GCash ref #"
                />
              </div>
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="px-6 py-4 border-t bg-white shrink-0 flex flex-wrap gap-3 justify-between items-center">
          <StatusPill status={row.status} />

          <div className="flex gap-3">
            <button
              onClick={save}
              disabled={!canSave}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              <Save size={18} />
              Save
            </button>

            <button
              onClick={approve}
              disabled={!canApprove}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              <CheckCircle2 size={18} />
              Approve
            </button>

            <button
              onClick={pay}
              disabled={!canPay || !proofFile || paymentAmount <= 0}
              className="px-4 py-2 bg-green-600 text-white rounded-lg disabled:opacity-50 flex items-center gap-2"
            >
              <Banknote size={18} />
              Pay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------
   COMPONENTS
--------------------------------------------- */
function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 border rounded-xl p-6 flex flex-col gap-2">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-3xl font-bold text-gray-900">{value}</span>
    </div>
  );
}

function MiniCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white border rounded-xl p-4 flex flex-col gap-1">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="text-lg font-bold text-gray-900">{value}</span>
    </div>
  );
}

function Input({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
    />
  );
}

function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-gray-600 font-medium">{label}</label>
      <input
        type="date"
        value={value}
        onChange={onChange}
        className="border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { label: string; value: string }[];
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-gray-600 font-medium">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border border-gray-300 rounded-lg px-4 py-2.5 bg-white focus:ring-2 focus:ring-blue-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function StatusPill({ status }: { status: PayrollStatus }) {
  const cls =
    status === "PAID"
      ? "bg-green-100 text-green-700"
      : status === "PARTIAL"
      ? "bg-purple-100 text-purple-700"
      : status === "APPROVED"
      ? "bg-blue-100 text-blue-700"
      : status === "PREVIEW"
      ? "bg-gray-100 text-gray-500"
      : "bg-gray-100 text-gray-700";

  return <span className={`px-2 py-1 rounded-full text-xs ${cls}`}>{status}</span>;
}

function FieldNumber({
  label,
  value,
  onChange,
  disabled,
  helper,
  prefix,
  suffix,
  decimals,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  disabled: boolean;
  helper?: string;
  prefix?: string;
  suffix?: string;
  decimals?: number;
}) {
  const [str, setStr] = useState<string>(() =>
    typeof value === "number" && !Number.isNaN(value)
      ? decimals != null
        ? value.toFixed(decimals)
        : String(value)
      : ""
  );

  useEffect(() => {
    setStr(
      typeof value === "number" && !Number.isNaN(value)
        ? decimals != null
          ? value.toFixed(decimals)
          : String(value)
        : ""
    );
  }, [value, decimals]);

  const handleChange = (v: string) => {
    setStr(v);
    if (v === "" || v === "-" || v === "." || v === "-.") return;
    const n = Number(v);
    if (!Number.isNaN(n)) onChange(n);
  };

  const handleBlur = () => {
    if (str === "" || str === "-" || str === "." || str === "-.") {
      onChange(0);
      setStr(decimals != null ? (0).toFixed(decimals) : "0");
      return;
    }
    const n = Number(str);
    if (Number.isNaN(n)) {
      onChange(0);
      setStr(decimals != null ? (0).toFixed(decimals) : "0");
    } else {
      onChange(n);
      if (decimals != null) setStr(n.toFixed(decimals));
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-gray-600 font-medium">{label}</label>
      <div className="flex items-center gap-2">
        {prefix && <span className="text-sm text-gray-500">{prefix}</span>}
        <input
          type="text"
          inputMode="decimal"
          value={str}
          onChange={(e) => handleChange(e.target.value)}
          onBlur={handleBlur}
          disabled={disabled}
          className={`w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 ${
            disabled ? "bg-gray-100 text-gray-500" : "bg-white"
          }`}
        />
        {suffix && <span className="text-sm text-gray-500">{suffix}</span>}
      </div>
      {helper && <div className="text-xs text-amber-700">{helper}</div>}
    </div>
  );
}

function FieldNumberInline({
  value,
  onChange,
  disabled,
  decimals,
}: {
  value: number;
  onChange: (v: number) => void;
  disabled: boolean;
  decimals?: number;
}) {
  const [str, setStr] = useState<string>(() =>
    typeof value === "number" && !Number.isNaN(value)
      ? decimals != null
        ? value.toFixed(decimals)
        : String(value)
      : ""
  );

  useEffect(() => {
    setStr(
      typeof value === "number" && !Number.isNaN(value)
        ? decimals != null
          ? value.toFixed(decimals)
          : String(value)
        : ""
    );
  }, [value, decimals]);

  const handleChange = (v: string) => {
    setStr(v);
    if (v === "" || v === "-" || v === "." || v === "-.") return;
    const n = Number(v);
    if (!Number.isNaN(n)) onChange(n);
  };

  const handleBlur = () => {
    if (str === "" || str === "-" || str === "." || str === "-.") {
      onChange(0);
      setStr(decimals != null ? (0).toFixed(decimals) : "0");
      return;
    }
    const n = Number(str);
    if (Number.isNaN(n)) {
      onChange(0);
      setStr(decimals != null ? (0).toFixed(decimals) : "0");
    } else {
      onChange(n);
      if (decimals != null) setStr(n.toFixed(decimals));
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      value={str}
      onChange={(e) => handleChange(e.target.value)}
      onBlur={handleBlur}
      disabled={disabled}
      className={`w-[140px] border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 ${
        disabled ? "bg-gray-100 text-gray-500" : "bg-white"
      }`}
    />
  );
}

/* ---------------------------------------------
   UTILS
--------------------------------------------- */
function round2(n: number) {
  return Math.round((Number(n) + Number.EPSILON) * 100) / 100;
}
