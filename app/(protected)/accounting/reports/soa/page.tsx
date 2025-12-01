"use client";

import { useState } from "react";
import { Download, FileText, Search } from "lucide-react";

export default function StatementOfAccountsPage() {
  const [clientCode, setClientCode] = useState("");
  const [clientName, setClientName] = useState("");

  return (
    <div className="max-w-7xl mx-auto space-y-10">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Statement of Accounts (SOA)
        </h1>
        <p className="text-gray-500">
          Generate and review client statements, including balances, payments, and outstanding invoices.
        </p>
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-800">Search Client</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input
            placeholder="Client Code"
            value={clientCode}
            onChange={(e: any) => setClientCode(e.target.value)}
          />

          <Input
            placeholder="Client Name"
            value={clientName}
            onChange={(e: any) => setClientName(e.target.value)}
          />
        </div>

        <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          <Search size={18} />
          Generate SOA
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <SummaryCard label="Total Amount Billed" value="₱0.00" />
        <SummaryCard label="Total Payments Received" value="₱0.00" />
        <SummaryCard label="Outstanding Balance" value="₱0.00" highlight />
      </div>

      {/* SOA TABLE */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">

        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">SOA Details</h2>

          <div className="flex gap-2">
            <button className="flex items-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
              <Download size={18} />
              Export CSV
            </button>

            <button className="flex items-center gap-2 px-5 py-2.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition">
              <FileText size={18} />
              Export PDF
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-500">
              <tr className="text-left uppercase text-xs tracking-wide">
                <th className="pb-3">Date</th>
                <th className="pb-3">Invoice No.</th>
                <th className="pb-3">Description</th>
                <th className="pb-3">Billed Amount</th>
                <th className="pb-3">Payment</th>
                <th className="pb-3">Running Balance</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-400">
                  No SOA data generated
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* OUTSTANDING INVOICES */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-800">Outstanding Invoices</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <BreakdownCard label="Current (0–30 days)" value="₱0.00" />
          <BreakdownCard label="31–60 days" value="₱0.00" />
          <BreakdownCard label="61–90 days" value="₱0.00" />
          <BreakdownCard label="Over 90 days" value="₱0.00" highlight />
        </div>
      </div>

    </div>
  );
}

/* INPUT COMPONENT */
function Input({ placeholder, value, onChange, type = "text" }: any) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="input"
    />
  );
}

/* SUMMARY CARD */
function SummaryCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-6 flex flex-col text-center ${
        highlight ? "bg-red-50 border border-red-200" : "bg-white shadow-sm"
      }`}
    >
      <span className="text-sm text-gray-500">{label}</span>

      <span
        className={`text-2xl font-bold ${
          highlight ? "text-red-600" : "text-gray-800"
        }`}
      >
        {value}
      </span>
    </div>
  );
}

/* BREAKDOWN CARD */
function BreakdownCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-5 flex flex-col gap-1 ${
        highlight ? "bg-red-50 border border-red-200" : "bg-gray-50"
      }`}
    >
      <span className="text-sm text-gray-500">{label}</span>
      <span
        className={`text-xl font-semibold ${
          highlight ? "text-red-600" : "text-gray-800"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
