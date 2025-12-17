"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import axios from "axios";
import { useRouter } from "next/navigation";

type TripItem = {
  id: number;
  pickUpDate: string;
  receiptNumber: string | null;
  weightHauled: number;
  wasteType: string | null;
};

type ServiceRate = {
  id: number;
  clientId: number;
  serviceType: string;
  ratePerKg: string; // backend returns string
  paymentTerms: string;
};

type Client = {
  id: number;
  codeName: string;
  registeredCompanyName: string;
};

type PagedTripsResponse = {
  items: TripItem[];
  total: number;
};

function getApiErrorMessage(err: unknown) {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data;

    if (typeof data === "string") return `(${status}) ${data}`;
    if (data?.message) return `(${status}) ${data.message}`;
    if (data?.error) return `(${status}) ${data.error}`;
    if (data?.title) return `(${status}) ${data.title}`;
    if (data?.errors)
      return `(${status}) Validation error: ${JSON.stringify(data.errors)}`;

    return `(${status}) ${err.message}`;
  }
  return "Unknown error.";
}

function useDebouncedValue<T>(value: T, delay = 350) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);

  return debounced;
}

const fmtMoney = (n: number) =>
  n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export default function BillingGeneratePage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("");

  // ✅ LOCKED to Hauling only
  const serviceType = "Hauling" as const;

  // trips / paging / filtering / sorting
  const PAGE_SIZE = 25;

  const [billableTrips, setBillableTrips] = useState<TripItem[]>([]);
  const [tripPage, setTripPage] = useState(1);
  const [tripTotal, setTripTotal] = useState(0);

  const [tripSearch, setTripSearch] = useState("");
  const [dateFrom, setDateFrom] = useState<string>(""); // yyyy-mm-dd
  const [dateTo, setDateTo] = useState<string>(""); // yyyy-mm-dd

  const [sortBy, setSortBy] = useState<
    "pickUpDate" | "receiptNumber" | "weightHauled"
  >("pickUpDate");
  const [sortDir, setSortDir] = useState<"desc" | "asc">("desc");

  // selection: store IDs (best-practice for paging)
  const [selectedTripIds, setSelectedTripIds] = useState<Set<number>>(
    () => new Set()
  );

  // cache trip objects so selected items across pages can be previewed
  const [tripCache, setTripCache] = useState<Record<number, TripItem>>({});

  const [activeRate, setActiveRate] = useState<ServiceRate | null>(null);

  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [loadingRate, setLoadingRate] = useState(false);

  const [withholding, setWithholding] = useState<number>(0);
  const vatRate = 0.12;

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceError, setInvoiceError] = useState("");
  const [savingInvoice, setSavingInvoice] = useState(false);

  // ✅ modal state
  const [showConfirm, setShowConfirm] = useState(false);

  const router = useRouter();

  const selectedClientId = useMemo(() => {
    const n = Number(selectedClient);
    return Number.isFinite(n) && n > 0 ? n : null;
  }, [selectedClient]);

  const debouncedTripSearch = useDebouncedValue(tripSearch, 350);

  const selectedClientObj = useMemo(() => {
    if (!selectedClientId) return null;
    return clients.find((c) => c.id === selectedClientId) || null;
  }, [clients, selectedClientId]);

  // Selection UX helpers
  const pageTripIds = useMemo(() => billableTrips.map((t) => t.id), [billableTrips]);

  const allOnPageSelected = useMemo(() => {
    if (pageTripIds.length === 0) return false;
    return pageTripIds.every((id) => selectedTripIds.has(id));
  }, [pageTripIds, selectedTripIds]);

  const [selectionKeptNotice, setSelectionKeptNotice] = useState(false);
  useEffect(() => {
    if (selectedTripIds.size > 0) setSelectionKeptNotice(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedTripSearch, dateFrom, dateTo, sortBy, sortDir]);

  // selected trips with placeholder support
  const selectedTripsForPreview = useMemo(() => {
    return Array.from(selectedTripIds).map((id) => ({
      id,
      trip: tripCache[id] as TripItem | undefined,
    }));
  }, [selectedTripIds, tripCache]);

  const selectedTrips = useMemo(() => {
    return selectedTripsForPreview.map((x) => x.trip).filter(Boolean) as TripItem[];
  }, [selectedTripsForPreview]);

  const selectedTotalWeight = useMemo(() => {
    return selectedTrips.reduce((sum, t) => sum + (t.weightHauled ?? 0), 0);
  }, [selectedTrips]);

  function clearSelection() {
    setSelectedTripIds(new Set());
    setSelectionKeptNotice(false);
  }

  function toggleSelectAllOnPage() {
    if (loadingTrips) return;
    setSelectedTripIds((prev) => {
      const next = new Set(prev);
      const shouldSelectAll = !pageTripIds.every((id) => next.has(id));

      if (shouldSelectAll) pageTripIds.forEach((id) => next.add(id));
      else pageTripIds.forEach((id) => next.delete(id));

      return next;
    });
  }

  function toggleTripId(id: number) {
    setSelectedTripIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  // LOAD ALL CLIENTS
  useEffect(() => {
    async function loadClients() {
      try {
        const res = await api.get("/admin/client");
        setClients(res.data);
      } catch (err) {
        console.error("Failed to load clients:", getApiErrorMessage(err));
      } finally {
        setLoadingClients(false);
      }
    }
    loadClients();
  }, []);

  // reset list controls when client changes
  useEffect(() => {
    setTripPage(1);
    setTripSearch("");
    setDateFrom("");
    setDateTo("");
    setSortBy("pickUpDate");
    setSortDir("desc");
    setSelectedTripIds(new Set());
    setTripCache({});
    setInvoiceError("");
    setSelectionKeptNotice(false);
    setShowConfirm(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedClientId]);

  // LOAD BILLABLE TRIPS + ACTIVE RATE
  useEffect(() => {
    if (!selectedClientId) {
      setBillableTrips([]);
      setTripTotal(0);
      setActiveRate(null);
      return;
    }

    async function loadTrips() {
      try {
        setLoadingTrips(true);

        const res = await api.get<PagedTripsResponse>("/accounting/billable-trips", {
          params: {
            clientId: selectedClientId,
            serviceType,
            page: tripPage,
            pageSize: PAGE_SIZE,
            sortBy,
            sortDir,
            q: debouncedTripSearch || undefined,
            dateFrom: dateFrom || undefined,
            dateTo: dateTo || undefined,
          },
        });

        setBillableTrips(res.data.items);
        setTripTotal(res.data.total);

        setTripCache((prev) => {
          const next = { ...prev };
          res.data.items.forEach((t) => (next[t.id] = t));
          return next;
        });
      } catch (err) {
        console.error("Failed to load billable trips:", getApiErrorMessage(err));
        setBillableTrips([]);
        setTripTotal(0);
      } finally {
        setLoadingTrips(false);
      }
    }

    async function loadActiveRate() {
      try {
        setLoadingRate(true);

        const res = await api.get("/accounting/rates", {
          params: {
            clientId: selectedClientId,
            serviceType,
            activeOnly: true,
          },
        });

        if (Array.isArray(res.data) && res.data.length > 0) setActiveRate(res.data[0]);
        else setActiveRate(null);
      } catch (err) {
        console.error("Failed to load active rate:", getApiErrorMessage(err));
        setActiveRate(null);
      } finally {
        setLoadingRate(false);
      }
    }

    loadTrips();
    loadActiveRate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    selectedClientId,
    tripPage,
    sortBy,
    sortDir,
    debouncedTripSearch,
    dateFrom,
    dateTo,
  ]);

  // COMPUTATIONS
  const ratePerKg = useMemo(() => {
    const r = Number(activeRate?.ratePerKg ?? 0);
    return Number.isFinite(r) ? r : 0;
  }, [activeRate]);

  const subtotal = useMemo(() => {
    if (!activeRate) return 0;
    return selectedTrips.reduce(
      (sum, t) => sum + (t.weightHauled ?? 0) * ratePerKg,
      0
    );
  }, [activeRate, selectedTrips, ratePerKg]);

  const vat = subtotal * vatRate;
  const total = subtotal + vat - (Number.isFinite(withholding) ? withholding : 0);

  const canGenerate = useMemo(() => {
    return (
      !!selectedClientId &&
      invoiceNumber.trim().length > 0 &&
      selectedTripIds.size > 0 &&
      !!activeRate &&
      !savingInvoice
    );
  }, [selectedClientId, invoiceNumber, selectedTripIds, activeRate, savingInvoice]);

  // ✅ open modal with validation
  function handleOpenConfirm() {
    setInvoiceError("");

    if (!selectedClientId) return setInvoiceError("Please select a client.");
    if (!invoiceNumber.trim()) return setInvoiceError("Invoice number is required.");
    if (selectedTripIds.size === 0)
      return setInvoiceError("Please select at least one hauling trip.");
    if (!activeRate) return setInvoiceError("No active rate found for this client.");

    setShowConfirm(true);
  }

  // ✅ actual submit
  async function handleConfirmGenerate() {
    if (!selectedClientId || !activeRate) return;

    const payload = {
      clientId: selectedClientId,
      haulingTripIds: Array.from(selectedTripIds),
      serviceType,
      invoiceNo: invoiceNumber.trim(),
      withheldTaxAmount: String(withholding ?? 0),
    };

    try {
      setSavingInvoice(true);

      const res = await api.post("/accounting/invoices/generate", payload);
      console.log("Invoice created:", res.data);

      alert("Invoice successfully generated!");

      // reset to avoid duplicates
      clearSelection();
      setInvoiceNumber("");
      setWithholding(0);
      setTripPage(1);
      setShowConfirm(false);

      router.refresh();
    } catch (err) {
      const msg = getApiErrorMessage(err);
      console.error("Failed to generate invoice:", msg);
      setInvoiceError(msg);
      alert(msg);
    } finally {
      setSavingInvoice(false);
    }
  }

  // pagination helpers
  const totalPages = Math.max(1, Math.ceil(tripTotal / PAGE_SIZE));

  const confirmClientName =
    selectedClientObj?.registeredCompanyName ||
    (selectedClientId ? `Client #${selectedClientId}` : "-");

  return (
    <div className="p-6 space-y-8">
      {/* ✅ Confirm Modal */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => !savingInvoice && setShowConfirm(false)}
          />
          <div className="relative w-full max-w-lg bg-white rounded-xl shadow-lg border p-6">
            <h3 className="text-lg font-semibold text-gray-800">
              Confirm Invoice Generation
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              Please double-check before generating.
            </p>

            <div className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Client</span>
                <span className="font-medium text-gray-800">{confirmClientName}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Invoice No.</span>
                <span className="font-medium text-gray-800">{invoiceNumber.trim()}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Selected trips</span>
                <span className="font-medium text-gray-800">
                  {selectedTripIds.size.toLocaleString()}
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Total weight</span>
                <span className="font-medium text-gray-800">
                  {selectedTotalWeight.toLocaleString()} kg
                </span>
              </div>

              <hr className="my-2" />

              <div className="flex justify-between">
                <span className="text-gray-500">Subtotal</span>
                <span className="font-semibold text-gray-800">₱ {fmtMoney(subtotal)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">VAT (12%)</span>
                <span className="font-semibold text-gray-800">₱ {fmtMoney(vat)}</span>
              </div>

              <div className="flex justify-between">
                <span className="text-gray-500">Withholding</span>
                <span className="font-semibold text-gray-800">₱ {fmtMoney(withholding)}</span>
              </div>

              <div className="flex justify-between border-t pt-2">
                <span className="text-gray-700 font-semibold">Total</span>
                <span className="font-bold text-gray-900">₱ {fmtMoney(total)}</span>
              </div>
            </div>

            <div className="mt-5 flex justify-end gap-2">
              <button
                type="button"
                disabled={savingInvoice}
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmGenerate}
                disabled={savingInvoice}
                className={`px-4 py-2 rounded-lg text-white font-medium ${
                  savingInvoice ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"
                }`}
              >
                {savingInvoice ? "Generating..." : "Confirm & Generate"}
              </button>
            </div>
          </div>
        </div>
      )}

      <header>
        <h1 className="text-2xl font-bold text-gray-800">
          Generate Billing / Invoice
        </h1>
        <p className="text-gray-500 text-sm">
          Select client and hauling trips to automatically generate a billing
          invoice.
        </p>
      </header>

      {/* CLIENT INFO */}
      <section className="bg-white p-6 rounded-xl shadow border">
        <h2 className="text-lg font-semibold mb-4">Client Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CLIENT SELECT */}
          <div>
            <label className="text-sm font-medium">Client</label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full mt-1 border rounded-lg px-3 py-2"
            >
              <option value="">Select Client</option>
              {loadingClients ? (
                <option>Loading...</option>
              ) : (
                clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.registeredCompanyName}
                  </option>
                ))
              )}
            </select>

            {/* ACTIVE RATE DISPLAY */}
            <div className="mt-3 text-sm text-gray-600">
              {loadingRate && selectedClientId && (
                <span className="italic text-gray-400">Loading active rate…</span>
              )}

              {!loadingRate && selectedClientId && activeRate && (
                <div className="space-y-1">
                  <p>
                    <strong>Active Rate:</strong> ₱ {fmtMoney(ratePerKg)} / kg
                  </p>
                  <p>
                    <strong>Payment Terms:</strong> {activeRate.paymentTerms}
                  </p>
                  <p>
                    <strong>Service Type:</strong> {serviceType}
                  </p>
                </div>
              )}

              {!loadingRate && selectedClientId && !activeRate && (
                <span className="text-red-500 text-xs">
                  No active service rate found for this client.
                </span>
              )}
            </div>
          </div>

          {/* SERVICE TYPE (LOCKED DISPLAY) */}
          <div>
            <label className="text-sm font-medium">Service Type</label>
            <input
              value={serviceType}
              readOnly
              className="w-full mt-1 border rounded-lg px-3 py-2 bg-gray-100"
            />
          </div>
        </div>
      </section>

      {/* BILLABLE TRIPS TABLE */}
      <section className="bg-white p-6 rounded-xl shadow border">
        <h2 className="text-lg font-semibold mb-4">Select Hauling Trips</h2>

        {/* FILTER / SORT CONTROLS */}
        <div className="flex flex-col md:flex-row gap-3 md:items-end md:justify-between mb-1">
          <div className="flex flex-col md:flex-row gap-3">
            <div>
              <label className="text-sm font-medium">Search (WM No.)</label>
              <input
                value={tripSearch}
                onChange={(e) => {
                  setTripSearch(e.target.value);
                  setTripPage(1);
                }}
                className="w-full mt-1 border rounded-lg px-3 py-2"
                placeholder="e.g. WM-2025-00123"
              />
            </div>

            <div>
              <label className="text-sm font-medium">From</label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setTripPage(1);
                }}
                className="w-full mt-1 border rounded-lg px-3 py-2"
              />
            </div>

            <div>
              <label className="text-sm font-medium">To</label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setTripPage(1);
                }}
                className="w-full mt-1 border rounded-lg px-3 py-2"
              />
            </div>
          </div>

          <div className="flex gap-2 items-end">
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value as any);
                setTripPage(1);
              }}
              className="border rounded-lg px-3 py-2"
            >
              <option value="pickUpDate">Sort: Date</option>
              <option value="receiptNumber">Sort: WM No.</option>
              <option value="weightHauled">Sort: Weight</option>
            </select>

            <button
              type="button"
              onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
              className="border rounded-lg px-3 py-2"
            >
              {sortDir === "desc" ? "↓" : "↑"}
            </button>

            <div className="text-xs text-gray-500 pb-2">
              {loadingTrips ? "Loading…" : ""}
            </div>
          </div>
        </div>

        {selectionKeptNotice && selectedTripIds.size > 0 && (
          <div className="text-xs text-gray-500 mb-3">
            Selection is kept across pages/filters.
          </div>
        )}

        {/* Selection UX row */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
          <div className="text-sm text-gray-700">
            Selected: <span className="font-semibold">{selectedTripIds.size}</span>
            {selectedTripIds.size > 0 && (
              <button
                type="button"
                onClick={clearSelection}
                className="ml-3 text-xs px-2 py-1 border rounded hover:bg-gray-50"
              >
                Clear selection
              </button>
            )}
          </div>

          <button
            type="button"
            onClick={toggleSelectAllOnPage}
            disabled={loadingTrips || billableTrips.length === 0}
            className="text-xs px-3 py-2 border rounded hover:bg-gray-50 disabled:opacity-50"
          >
            {allOnPageSelected ? "Select none on this page" : "Select all on this page"}
          </button>
        </div>

        {/* Sticky mini-summary */}
        {selectedTripIds.size > 0 && (
          <div className="sticky top-2 z-10 bg-white border rounded-lg px-4 py-3 shadow-sm mb-3">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2 text-sm">
              <div className="text-gray-700">
                <span className="font-semibold">{selectedTripIds.size}</span> trip(s) selected •{" "}
                <span className="font-semibold">{selectedTotalWeight.toLocaleString()}</span> kg
              </div>

              <div className="text-gray-700">
                Subtotal: <span className="font-semibold">₱ {fmtMoney(subtotal)}</span>
                <button
                  type="button"
                  onClick={clearSelection}
                  className="ml-3 text-xs px-2 py-1 border rounded hover:bg-gray-50"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        )}

        {loadingTrips ? (
          <div className="text-gray-500 italic">Loading trips...</div>
        ) : billableTrips.length === 0 ? (
          <div className="text-gray-400 italic">No billable trips available.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-2 text-center w-12">
                    <input
                      type="checkbox"
                      checked={allOnPageSelected}
                      onChange={toggleSelectAllOnPage}
                      disabled={loadingTrips || billableTrips.length === 0}
                      aria-label="Select all on this page"
                    />
                  </th>
                  <th className="border px-2 py-2">Pick-up Date</th>
                  <th className="border px-2 py-2">WM No.</th>
                  <th className="border px-2 py-2 text-right">Weight (kg)</th>
                  <th className="border px-2 py-2">Waste Type</th>
                </tr>
              </thead>

              <tbody>
                {billableTrips.map((trip) => {
                  const isSelected = selectedTripIds.has(trip.id);
                  return (
                    <tr
                      key={trip.id}
                      className={`border-t hover:bg-gray-50 ${
                        isSelected ? "bg-indigo-50" : ""
                      }`}
                    >
                      <td className="text-center border">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleTripId(trip.id)}
                        />
                      </td>

                      <td className="px-2 py-2">
                        {trip.pickUpDate?.substring(0, 10) ?? "–"}
                      </td>
                      <td className="px-2 py-2">{trip.receiptNumber || "–"}</td>
                      <td className="px-2 py-2 text-right">
                        {(trip.weightHauled ?? 0).toLocaleString()}
                      </td>
                      <td className="px-2 py-2">{trip.wasteType || "–"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* PAGINATION */}
            <div className="flex items-center justify-between mt-3 text-sm">
              <div className="text-gray-600">
                Showing page {tripPage} of {Math.max(1, Math.ceil(tripTotal / PAGE_SIZE))} • Total{" "}
                {tripTotal.toLocaleString()} trips
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  className="border rounded px-3 py-1 disabled:opacity-50"
                  disabled={tripPage <= 1}
                  onClick={() => setTripPage((p) => Math.max(1, p - 1))}
                >
                  Prev
                </button>

                <button
                  type="button"
                  className="border rounded px-3 py-1 disabled:opacity-50"
                  disabled={tripPage >= Math.max(1, Math.ceil(tripTotal / PAGE_SIZE))}
                  onClick={() =>
                    setTripPage((p) => Math.min(Math.max(1, Math.ceil(tripTotal / PAGE_SIZE)), p + 1))
                  }
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* INVOICE PREVIEW */}
      <section className="bg-white p-6 rounded-xl shadow border">
        <h2 className="text-lg font-semibold mb-4">Invoice Preview</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          <div>
            <label className="text-sm font-medium">Invoice Date</label>
            <input type="date" className="w-full mt-1 border rounded-lg px-3 py-2" />
          </div>

          <div>
            <label className="text-sm font-medium">Invoice Number</label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => {
                setInvoiceNumber(e.target.value);
                setInvoiceError("");
              }}
              placeholder="Enter Invoice Number"
              className={`w-full mt-1 border rounded-lg px-3 py-2 ${
                invoiceError ? "border-red-500" : ""
              }`}
            />
            {invoiceError && <p className="text-red-500 text-xs mt-1">{invoiceError}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Payment Terms</label>
            <input
              type="text"
              value={activeRate?.paymentTerms || ""}
              readOnly
              className="w-full mt-1 border rounded-lg px-3 py-2 bg-gray-100"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-2">Pick-up Date</th>
                <th className="border px-2 py-2 text-right">Weight (kg)</th>
                <th className="border px-2 py-2 text-right">Rate per KG</th>
                <th className="border px-2 py-2 text-right">Amount</th>
                <th className="border px-2 py-2 text-center">Action</th>
              </tr>
            </thead>

            <tbody>
              {selectedTripsForPreview.map(({ id, trip }) => {
                if (!trip) {
                  return (
                    <tr key={id} className="border-t">
                      <td className="px-2 py-2 text-gray-500 italic" colSpan={4}>
                        Trip #{id} (details not loaded)
                      </td>
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => toggleTripId(id)}
                          className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  );
                }

                const amount = (trip.weightHauled ?? 0) * ratePerKg;

                return (
                  <tr key={trip.id} className="border-t">
                    <td className="px-2 py-2">{trip.pickUpDate?.substring(0, 10) ?? "–"}</td>
                    <td className="px-2 py-2 text-right">
                      {(trip.weightHauled ?? 0).toLocaleString()}
                    </td>
                    <td className="px-2 py-2 text-right">₱ {fmtMoney(ratePerKg)}</td>
                    <td className="px-2 py-2 text-right">₱ {fmtMoney(amount)}</td>
                    <td className="px-2 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => toggleTripId(trip.id)}
                        className="text-xs px-2 py-1 border rounded hover:bg-gray-50"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}

              {selectedTripIds.size === 0 && (
                <tr>
                  <td colSpan={5} className="px-2 py-4 text-center text-gray-400 italic">
                    Select trips to preview invoice lines.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* SUMMARY */}
      <section className="bg-white p-6 rounded-xl shadow border w-full md:w-1/2 ml-auto">
        <h2 className="text-lg font-semibold mb-4">Summary</h2>

        <div className="flex justify-between py-1">
          <span>Subtotal</span>
          <span>₱ {fmtMoney(subtotal)}</span>
        </div>

        <div className="flex justify-between py-1">
          <span>VAT (12%)</span>
          <span>₱ {fmtMoney(vat)}</span>
        </div>

        <div className="flex justify-between items-center py-1">
          <span>Withholding Tax</span>
          <input
            type="number"
            min={0}
            value={withholding}
            onChange={(e) => setWithholding(Math.max(0, Number(e.target.value || 0)))}
            className="w-32 border rounded px-2 py-1 text-right"
          />
        </div>

        <div className="flex justify-between py-2 border-t font-semibold text-lg">
          <span>Total</span>
          <span>₱ {fmtMoney(total)}</span>
        </div>
      </section>

      {/* GENERATE BUTTON + inline error */}
      <div className="flex flex-col items-end gap-2">
        {invoiceError && <div className="text-red-600 text-sm">{invoiceError}</div>}

        <button
          onClick={handleOpenConfirm}
          disabled={!canGenerate}
          className={`px-6 py-3 rounded-lg shadow font-medium text-white 
            ${
              canGenerate
                ? "bg-indigo-600 hover:bg-indigo-700"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          title={
            canGenerate
              ? "Generate invoice"
              : "Select client, enter invoice number, select trips, and ensure an active rate exists."
          }
        >
          {savingInvoice ? "Generating..." : "Generate Invoice"}
        </button>
      </div>
    </div>
  );
}
