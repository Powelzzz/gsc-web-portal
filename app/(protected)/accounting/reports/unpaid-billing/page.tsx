"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Download } from "lucide-react";
import api from "@/lib/api";
import axios from "axios";

type UnpaidInvoiceRow = {
  id: number;
  invoiceNo: string;
  client: string; // backend is Client.CodeName
  generateDate: string; // serialized date
  dateSent: string | null;
  billedAmount: number;
  paidAmount: number;
  remaining: number;
  agingDays: number;
};

function fmtDate(d?: string | null) {
  return d ? d.split("T")[0] : "-";
}

function fmtMoney(n: number) {
  return `₱${(n ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
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

  const [clientCode, setClientCode] = useState("");
  const [clientName, setClientName] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  // 1) Build params (only include if value exists)
  const reportParams = useMemo(() => {
    const p: Record<string, any> = {};
    if (dateFrom) p.from = dateFrom;
    if (dateTo) p.to = dateTo;
    if (clientCode.trim()) p.clientCode = clientCode.trim();
    if (clientName.trim()) p.clientName = clientName.trim();
    if (invoiceNo.trim()) p.invoiceNo = invoiceNo.trim();
    return p;
  }, [dateFrom, dateTo, clientCode, clientName, invoiceNo]);

  // 2) Load report data
  const loadData = async () => {
    try {
      setError("");
      setLoading(true);

      const res = await api.get("/accounting/reports/unpaid", { params: reportParams });
      setData(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setData([]);
      setError(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // handle Enter key on inputs to trigger search
  const onEnter = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") loadData();
  };

  // 3) Export CSV (backend only uses from/to)
  const exportCsv = async () => {
    try {
      setError("");
      setLoading(true);

      const params: Record<string, any> = {};
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;

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

  // 4) Summary computations
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

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Unpaid Billing Reports
        </h1>
        <p className="text-gray-500">View all outstanding invoices, aging, and unpaid balances.</p>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-800">Search Filters</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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

        <button
          onClick={loadData}
          disabled={loading}
          className={`flex items-center gap-2 px-5 py-2.5 text-white rounded-lg transition ${
            loading ? "bg-gray-400" : "bg-blue-600 hover:bg-blue-700"
          }`}
        >
          <Search size={18} />
          {loading ? "Loading..." : "Apply Filters"}
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard label="Total Unpaid Amount" value={fmtMoney(totalUnpaid)} />
        <SummaryCard label="Total Unpaid Invoices" value={totalInvoices} />
        <SummaryCard label="Clients with Outstanding Balance" value={totalClients} />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Unpaid Invoices</h2>

          <button
            onClick={exportCsv}
            disabled={loading}
            className={`flex items-center gap-2 px-5 py-2.5 text-white rounded-lg transition ${
              loading ? "bg-gray-400" : "bg-green-600 hover:bg-green-700"
            }`}
          >
            <Download size={18} />
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-500">
              <tr className="text-left uppercase text-xs tracking-wide">
                <th className="pb-3">Invoice No.</th>
                <th className="pb-3">Client</th>
                <th className="pb-3">Billed</th>
                <th className="pb-3">Paid</th>
                <th className="pb-3">Remaining</th>
                <th className="pb-3">Generate Date</th>
                <th className="pb-3">Date Sent</th>
                <th className="pb-3">Aging (Days)</th>
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
                    <td className="py-2">{row.invoiceNo}</td>
                    <td>{row.client}</td>
                    <td>{fmtMoney(row.billedAmount)}</td>
                    <td>{fmtMoney(row.paidAmount)}</td>
                    <td className="font-semibold text-red-600">{fmtMoney(row.remaining)}</td>
                    <td>{fmtDate(row.generateDate)}</td>
                    <td>{fmtDate(row.dateSent)}</td>
                    <td>{row.agingDays}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* AGING BREAKDOWN */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-800">Aging Breakdown</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
    <div className="bg-white shadow-sm rounded-xl p-6 text-center">
      <span className="text-sm text-gray-500">{label}</span>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
    </div>
  );
}

function BreakdownCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-5">
      <span className="text-sm text-gray-500">{label}</span>
      <div className="text-xl font-semibold text-gray-800">{value}</div>
    </div>
  );
}
