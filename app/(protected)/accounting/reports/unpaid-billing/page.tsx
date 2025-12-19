"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Download } from "lucide-react";
import api from "@/lib/api";
import axios from "axios";

type UnpaidInvoiceRow = {
  id: number;
  invoiceNo: string;
  client: string;
  generateDate: string;
  dateSent: string | null;
  billedAmount: number;
  paidAmount: number;
  remaining: number;
  agingDays: number;
};

type PagedResult<T> = {
  total: number;
  page: number;
  pageSize: number;
  items: T[];
};

function fmtDate(d?: string | null) {
  return d ? d.split("T")[0] : "-";
}

function fmtMoney(n: number) {
  return `₱${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

function getApiErrorMessage(err: unknown) {
  if (axios.isAxiosError(err)) {
    const status = err.response?.status;
    const data = err.response?.data;
    if (typeof data === "string") return `(${status}) ${data}`;
    if ((data as any)?.message) return `(${status}) ${(data as any).message}`;
    if ((data as any)?.title) return `(${status}) ${(data as any).title}`;
    return `(${status}) ${err.message}`;
  }
  return "Unknown error.";
}

export default function UnpaidBillingReports() {
  const [data, setData] = useState<UnpaidInvoiceRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");

  // filters
  const [clientCode, setClientCode] = useState("");
  const [clientName, setClientName] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // paging (NEW)
  const [page, setPage] = useState(1);
  const pageSize = 25;
  const [total, setTotal] = useState(0);

  // sorting (NEW, minimal)
  const [sortBy, setSortBy] = useState<"generateDate" | "remaining" | "agingDays">("generateDate");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  // 1) Build params
  const reportParams = useMemo(() => {
    const p: Record<string, any> = {};

    if (dateFrom) p.from = dateFrom;
    if (dateTo) p.to = dateTo;
    if (clientCode.trim()) p.clientCode = clientCode.trim();
    if (clientName.trim()) p.clientName = clientName.trim();
    if (invoiceNo.trim()) p.invoiceNo = invoiceNo.trim();

    // paging + sorting
    p.page = page;
    p.pageSize = pageSize;
    p.sortBy = sortBy;
    p.sortDir = sortDir;

    return p;
  }, [dateFrom, dateTo, clientCode, clientName, invoiceNo, page, sortBy, sortDir]);

  // 2) Load report data (UPDATED for paged response)
  const loadData = async () => {
    try {
      setError("");
      setLoading(true);

      const res = await api.get<PagedResult<UnpaidInvoiceRow>>("/accounting/reports/unpaid", {
        params: reportParams,
      });

      const items = Array.isArray(res.data?.items) ? res.data.items : [];
      setData(items);
      setTotal(Number(res.data?.total ?? 0));
    } catch (err) {
      setData([]);
      setTotal(0);
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // initial load
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // reload when page/sort changes (NEW)
  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, sortBy, sortDir]);

  // Apply filters: reset to page 1 (NEW)
  const applyFilters = () => {
    setPage(1);
    loadData();
  };

  // Enter key triggers Apply (NEW)
  const onEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") applyFilters();
  };

  // Clear filters (NEW)
  const clearFilters = () => {
    setClientCode("");
    setClientName("");
    setInvoiceNo("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
    // keep sort as-is
    loadData();
  };

  // 3) Export CSV (UPDATED: send same filters to backend)
  const exportCsv = async () => {
    try {
      setError("");
      setLoading(true);

      const params: Record<string, any> = {};
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;
      if (clientCode.trim()) params.clientCode = clientCode.trim();
      if (clientName.trim()) params.clientName = clientName.trim();
      if (invoiceNo.trim()) params.invoiceNo = invoiceNo.trim();

      const res = await api.get("/accounting/reports/unpaid/export", {
        params,
        responseType: "blob",
      });

      const blob = new Blob([res.data], { type: "text/csv;charset=utf-8;" });
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "unpaid_reports.csv";
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
    } catch (err) {
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  // 4) Summary computations (NOTE: summaries are per-page now)
  const totalUnpaid = useMemo(() => data.reduce((s, x) => s + (x.remaining ?? 0), 0), [data]);
  const totalInvoices = data.length;
  const totalClients = useMemo(() => new Set(data.map((x) => x.client)).size, [data]);

  const bucket = (min: number, max?: number) =>
    data
      .filter((x) => x.agingDays >= min && (max == null ? true : x.agingDays <= max))
      .reduce((s, x) => s + (x.remaining ?? 0), 0);

  const aging0to30 = useMemo(() => bucket(0, 30), [data]);
  const aging31to60 = useMemo(() => bucket(31, 60), [data]);
  const aging61to90 = useMemo(() => bucket(61, 90), [data]);
  const agingOver90 = useMemo(() => bucket(91), [data]);

  // paging helpers
  const showingFrom = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const showingTo = Math.min(page * pageSize, total);
  const canPrev = page > 1;
  const canNext = page * pageSize < total;

  // tiny sort toggles (NEW)
  const toggleSort = (col: typeof sortBy) => {
    if (sortBy !== col) {
      setSortBy(col);
      setSortDir("desc");
      setPage(1);
      return;
    }
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8 sm:space-y-10 p-4 sm:p-0">
      {/* HEADER */}
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
          Unpaid Billing Reports
        </h1>
        <p className="text-gray-500 break-words">
          View all outstanding invoices, aging, and unpaid balances.
        </p>
        {error && <p className="mt-2 text-sm text-red-600 break-words">{error}</p>}
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 space-y-5 sm:space-y-6">
        <h2 className="text-lg font-semibold text-gray-800">Search Filters</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <input
            placeholder="Client Code"
            className="input"
            value={clientCode}
            onChange={(e) => setClientCode(e.target.value)}
            onKeyDown={onEnter}
          />
          <input
            placeholder="Client Name"
            className="input"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
            onKeyDown={onEnter}
          />
          <input
            placeholder="Invoice No."
            className="input"
            value={invoiceNo}
            onChange={(e) => setInvoiceNo(e.target.value)}
            onKeyDown={onEnter}
          />

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Date From</label>
            <input
              type="date"
              className="input"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Date To</label>
            <input
              type="date"
              className="input"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={applyFilters}
            disabled={loading}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 text-white rounded-lg transition w-full sm:w-auto ${
              loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            <Search size={18} />
            {loading ? "Loading..." : "Apply Filters"}
          </button>

          <button
            onClick={clearFilters}
            disabled={loading}
            className="px-5 py-2.5 border rounded-lg hover:bg-gray-50 disabled:opacity-50 w-full sm:w-auto"
          >
            Clear
          </button>
        </div>
      </div>

      {/* SUMMARY CARDS (per-page) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        <SummaryCard label="Total Unpaid Amount (This Page)" value={fmtMoney(totalUnpaid)} />
        <SummaryCard label="Unpaid Invoices (This Page)" value={totalInvoices} />
        <SummaryCard label="Clients (This Page)" value={totalClients} />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-800">Unpaid Invoices</h2>

          <button
            onClick={exportCsv}
            disabled={loading}
            className={`flex items-center justify-center gap-2 px-5 py-2.5 text-white rounded-lg transition w-full sm:w-auto ${
              loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto -mx-4 sm:mx-0">
          <div className="min-w-[980px] px-4 sm:px-0">
            <table className="w-full text-sm">
              <thead className="text-gray-500">
                <tr className="text-left uppercase text-xs tracking-wide">
                  <th className="pb-3">Invoice No.</th>
                  <th className="pb-3">Client</th>
                  <th className="pb-3">Billed</th>
                  <th className="pb-3">Paid</th>

                  {/* minimal clickable sorts */}
                  <th
                    className="pb-3 cursor-pointer select-none whitespace-nowrap"
                    onClick={() => toggleSort("remaining")}
                  >
                    Remaining {sortBy === "remaining" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </th>

                  <th
                    className="pb-3 cursor-pointer select-none whitespace-nowrap"
                    onClick={() => toggleSort("generateDate")}
                  >
                    Generate Date {sortBy === "generateDate" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </th>

                  <th className="pb-3 whitespace-nowrap">Date Sent</th>

                  <th
                    className="pb-3 cursor-pointer select-none whitespace-nowrap"
                    onClick={() => toggleSort("agingDays")}
                  >
                    Aging (Days) {sortBy === "agingDays" ? (sortDir === "asc" ? "▲" : "▼") : ""}
                  </th>
                </tr>
              </thead>

              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-gray-400">
                      Loading...
                    </td>
                  </tr>
                ) : data.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-10 text-gray-400">
                      No unpaid billing records found
                    </td>
                  </tr>
                ) : (
                  data.map((row) => (
                    <tr key={row.id} className="border-t">
                      <td className="py-2 whitespace-nowrap">{row.invoiceNo}</td>
                      <td className="break-words">{row.client}</td>
                      <td className="whitespace-nowrap">{fmtMoney(row.billedAmount)}</td>
                      <td className="whitespace-nowrap">{fmtMoney(row.paidAmount)}</td>
                      <td className="font-semibold text-red-600 whitespace-nowrap">
                        {fmtMoney(row.remaining)}
                      </td>
                      <td className="whitespace-nowrap">{fmtDate(row.generateDate)}</td>
                      <td className="whitespace-nowrap">{fmtDate(row.dateSent)}</td>
                      <td className="whitespace-nowrap">{row.agingDays}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* PAGINATION FOOTER (NEW) */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-4">
          <div className="text-sm text-gray-500">
            Showing {showingFrom}–{showingTo} of {total}
          </div>

          <div className="flex gap-2">
            <button
              className="px-3 py-2 border rounded-lg disabled:opacity-50 w-full sm:w-auto"
              disabled={loading || !canPrev}
              onClick={() => setPage((p) => p - 1)}
            >
              Prev
            </button>
            <button
              className="px-3 py-2 border rounded-lg disabled:opacity-50 w-full sm:w-auto"
              disabled={loading || !canNext}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* AGING BREAKDOWN (per-page) */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 space-y-5 sm:space-y-6">
        <h2 className="text-lg font-semibold text-gray-800">Aging Breakdown (This Page)</h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <BreakdownCard label="0 - 30 Days" value={fmtMoney(aging0to30)} />
          <BreakdownCard label="31 - 60 Days" value={fmtMoney(aging31to60)} />
          <BreakdownCard label="61 - 90 Days" value={fmtMoney(aging61to90)} />
          <BreakdownCard label="Over 90 Days" value={fmtMoney(agingOver90)} />
        </div>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: any }) {
  return (
    <div className="bg-white shadow-sm rounded-xl p-4 sm:p-6 text-center">
      <span className="text-sm text-gray-500 break-words">{label}</span>
      <div className="text-xl sm:text-2xl font-bold text-gray-800 break-words">{value}</div>
    </div>
  );
}

function BreakdownCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-4 sm:p-5">
      <span className="text-sm text-gray-500 break-words">{label}</span>
      <div className="text-lg sm:text-xl font-semibold text-gray-800 break-words">{value}</div>
    </div>
  );
}
