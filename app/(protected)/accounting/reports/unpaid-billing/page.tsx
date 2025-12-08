"use client";

import { useState, useEffect } from "react";
import { Search, Download } from "lucide-react";
import api from "@/lib/api";

export default function UnpaidBillingReports() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const [clientCode, setClientCode] = useState("");
  const [clientName, setClientName] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const loadData = async () => {
    setLoading(true);

    const res = await api.get("/accounting/reports/unpaid", {
      params: {
        from: dateFrom || null,
        to: dateTo || null,
        clientCode,
        clientName,
        invoiceNo
      }
    });

    setData(res.data);
    setLoading(false);
  };

  const exportCsv = () => {
    window.open(`/api/accounting/reports/unpaid/export?from=${dateFrom}&to=${dateTo}`);
  };

  // Summary computations
  const totalUnpaid = data.reduce((s, x) => s + x.remaining, 0);
  const totalInvoices = data.length;
  const totalClients = new Set(data.map(x => x.client)).size;

  // Aging
  const bucket = (min: number, max: number) =>
    data
      .filter(x => x.agingDays >= min && (max ? x.agingDays <= max : true))
      .reduce((s, x) => s + x.remaining, 0);

  const aging0to30 = bucket(0, 30);
  const aging31to60 = bucket(31, 60);
  const aging61to90 = bucket(61, 90);
  const agingOver90 = bucket(91, 9999);

  return (
    <div className="max-w-7xl mx-auto space-y-10">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Unpaid Billing Reports
        </h1>
        <p className="text-gray-500">
          View all outstanding invoices, aging, and unpaid balances.
        </p>
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
          />
          <input
            placeholder="Client Name"
            className="input"
            value={clientName}
            onChange={(e) => setClientName(e.target.value)}
          />
          <input
            placeholder="Invoice No."
            className="input"
            value={invoiceNo}
            onChange={(e) => setInvoiceNo(e.target.value)}
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
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
        >
          <Search size={18} />
          Apply Filters
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard label="Total Unpaid Amount" value={"₱" + totalUnpaid.toLocaleString()} />
        <SummaryCard label="Total Unpaid Invoices" value={totalInvoices} />
        <SummaryCard label="Clients with Outstanding Balance" value={totalClients} />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Unpaid Invoices</h2>

          <button
            onClick={exportCsv}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
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
                <th className="pb-3">Amount</th>
                <th className="pb-3">Paid</th>
                <th className="pb-3">Remaining</th>
                <th className="pb-3">Date Sent</th>
                <th className="pb-3">Aging (Days)</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">
                    Loading...
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-10 text-gray-400">
                    No unpaid billing records found
                  </td>
                </tr>
              ) : (
                data.map((row, idx) => (
                  <tr key={idx} className="border-t">
                    <td className="py-2">{row.invoiceNo}</td>
                    <td>{row.client}</td>
                    <td>₱{row.billedAmount.toLocaleString()}</td>
                    <td>₱{row.paidAmount.toLocaleString()}</td>
                    <td className="font-semibold text-red-600">
                      ₱{row.remaining.toLocaleString()}
                    </td>
                    <td>{row.dateSent ? row.dateSent.split("T")[0] : "-"}</td>
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
          <BreakdownCard label="0 - 30 Days" value={"₱" + aging0to30.toLocaleString()} />
          <BreakdownCard label="31 - 60 Days" value={"₱" + aging31to60.toLocaleString()} />
          <BreakdownCard label="61 - 90 Days" value={"₱" + aging61to90.toLocaleString()} />
          <BreakdownCard label="Over 90 Days" value={"₱" + agingOver90.toLocaleString()} />
        </div>
      </div>

    </div>
  );
}

function SummaryCard({ label, value }: any) {
  return (
    <div className="bg-white shadow-sm rounded-xl p-6 text-center">
      <span className="text-sm text-gray-500">{label}</span>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
    </div>
  );
}

function BreakdownCard({ label, value }: any) {
  return (
    <div className="bg-gray-50 rounded-xl p-5">
      <span className="text-sm text-gray-500">{label}</span>
      <div className="text-xl font-semibold text-gray-800">{value}</div>
    </div>
  );
}
