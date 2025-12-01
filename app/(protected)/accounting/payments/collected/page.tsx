"use client";

import { useState } from "react";
import { Download, Search } from "lucide-react";

export default function CollectedPaymentsReportPage() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  return (
    <div className="max-w-6xl mx-auto space-y-10">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Collected Payments Report
        </h1>
        <p className="text-gray-500">
          View, filter, and download reports of all collected payments.
        </p>
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-800">Search Filters</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input placeholder="Client Code" />
          <Input placeholder="Client Name" />

          {/* DATE FROM */}
          <div className="flex flex-col gap-1">
            <label className="text-sm text-gray-600">Date From</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="input"
            />
          </div>

          {/* DATE TO */}
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

      {/* SUMMARY */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-800">Summary</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard label="Total Collected" value="₱0.00" />
          <SummaryCard label="Total Clients Paid" value="0" />
          <SummaryCard label="Total Transactions" value="0" />
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Payments</h2>

          <button className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
            <Download size={18} />
            Export CSV
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-500">
              <tr className="text-left uppercase text-xs tracking-wide">
                <th className="pb-3">Date</th>
                <th className="pb-3">Client</th>
                <th className="pb-3">OR Number</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Payment Type</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td colSpan={5} className="text-center py-10 text-gray-400">
                  No collected payments found
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

/* INPUT COMPONENT */
function Input({ placeholder, type = "text", ...props }: any) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      className="input"
      {...props}
    />
  );
}

/* SUMMARY CARD */
function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-xl p-5 flex flex-col gap-1">
      <span className="text-sm text-gray-500">{label}</span>
      <span className="text-2xl font-bold text-gray-800">{value}</span>
    </div>
  );
}
