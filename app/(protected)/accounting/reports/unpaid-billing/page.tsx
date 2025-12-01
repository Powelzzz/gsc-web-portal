"use client";

import { useState } from "react";
import { Search, Download } from "lucide-react";

export default function UnpaidBillingReports() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  return (
    <div className="max-w-7xl mx-auto space-y-10">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Unpaid Billing Reports
        </h1>
        <p className="text-gray-500">
          View all outstanding invoices, aging, and unpaid balances from clients.
        </p>
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-800">Search Filters</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input placeholder="Client Code" />
          <Input placeholder="Client Name" />

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Date To</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="input"
            />
          </div>
        </div>

        <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          <Search size={18} />
          Apply Filters
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard label="Total Unpaid Amount" value="₱0.00" />
        <SummaryCard label="Total Unpaid Invoices" value="0" />
        <SummaryCard label="Clients with Outstanding Balance" value="0" />
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Unpaid Invoices</h2>

          <button className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
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
                <th className="pb-3">Billing Period</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Date Sent</th>
                <th className="pb-3">Aging (Days)</th>
                <th className="pb-3">Status</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td colSpan={7} className="text-center py-10 text-gray-400">
                  No unpaid billing records found
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* AGING BREAKDOWN */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-800">Aging Breakdown</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <BreakdownCard label="0 - 30 Days" value="₱0.00" />
          <BreakdownCard label="31 - 60 Days" value="₱0.00" />
          <BreakdownCard label="61 - 90 Days" value="₱0.00" />
          <BreakdownCard label="Over 90 Days" value="₱0.00" />
        </div>
      </div>

    </div>
  );
}

/* INPUT COMPONENT */
function Input({ placeholder, type = "text" }: any) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      className="input"
    />
  );
}

/* SUMMARY CARD */
function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-white shadow-sm rounded-xl p-6 flex flex-col gap-1 text-center">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-2xl font-bold text-gray-800">{value}</span>
    </div>
  );
}

/* BREAKDOWN CARD */
function BreakdownCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-5 flex flex-col gap-1">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-xl font-semibold text-gray-800">{value}</span>
    </div>
  );
}
