"use client";

import { useState } from "react";
import { UploadCloud, Image as ImageIcon, Search, Download } from "lucide-react";

export default function DepositSlipsPage() {
  const [depositImage, setDepositImage] = useState<File | null>(null);

  const handleFileChange = (e: any) => {
    const file = e.target.files?.[0];
    if (file) setDepositImage(file);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Deposit Slips
        </h1>
        <p className="text-gray-500">
          Upload and track payment deposits for auditing and verification.
        </p>
      </div>

      {/* SEARCH FILTERS */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-800">Search Filters</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input placeholder="Client Code" />
          <Input placeholder="Client Name" />
          <Input type="date" placeholder="Date From" />
          <Input type="date" placeholder="Date To" />
        </div>

        <button className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          <Search size={18} />
          Apply Filters
        </button>
      </div>

      {/* UPLOAD SECTION */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-8">
        <h2 className="text-lg font-semibold text-gray-800">Upload Deposit Slip</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input type="date" placeholder="Date Deposited" />
          <Input type="number" placeholder="Amount Deposited" />
          <Input placeholder="Bank Name" />
          <Input placeholder="Account Number / Reference" />
        </div>

        <textarea
          placeholder="Notes (optional)"
          className="w-full rounded-lg px-3 py-2.5 bg-gray-50 text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />

        {/* UPLOAD BOX */}
        <div className="p-10 bg-gray-50 rounded-xl flex flex-col items-center justify-center text-gray-600">
          <UploadCloud size={42} />
          <p className="mt-3 text-gray-700 font-medium">
            Upload Deposit Slip Image
          </p>

          <label
            htmlFor="depositUpload"
            className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition"
          >
            Choose File
          </label>

          <input
            id="depositUpload"
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />

          {depositImage && (
            <div className="mt-4 flex items-center gap-2 text-sm text-green-700">
              <ImageIcon size={18} />
              <span>{depositImage.name}</span>
            </div>
          )}
        </div>

        <button className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
          Save Deposit Slip
        </button>
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Deposit Records</h2>

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
                <th className="pb-3">Amount</th>
                <th className="pb-3">Bank</th>
                <th className="pb-3">Reference</th>
                <th className="pb-3">Slip</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td colSpan={6} className="text-center py-10 text-gray-400">
                  No deposit slips recorded
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

/* INPUT */
function Input({ placeholder, type = "text" }: any) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      className="input"
    />
  );
}
