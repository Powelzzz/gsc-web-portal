"use client";

import { useState } from "react";
import { UploadCloud, Image as ImageIcon } from "lucide-react";

export default function EncodePaymentsPage() {
  const [receiptImage, setReceiptImage] = useState<File | null>(null);

  const handleFileChange = (e: any) => {
    const file = e.target.files?.[0];
    if (file) setReceiptImage(file);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          Encode Received Payments
        </h1>
        <p className="text-gray-500">
          Record all payments received from clients with complete details.
        </p>
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-800">Search Filters</h2>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Input placeholder="Client Code" />
          <Input placeholder="Client Name" />
          <Input type="date" />
          <Input type="date" />
        </div>

        {/* FIXED: select uses .select and no `selected` attribute */}
        <select defaultValue="" className="select">
          <option value="" disabled>
            All Payment Types
          </option>
          <option value="Cash">Cash</option>
          <option value="Check">Check</option>
          <option value="Bank Transfer">Bank Transfer</option>
          <option value="GCash">GCash</option>
          <option value="Others">Others</option>
        </select>

        <button className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          Apply Filters
        </button>
      </div>

      {/* ENCODE FORM */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-8">
        <h2 className="text-lg font-semibold text-gray-800">Payment Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input type="date" placeholder="Date Received" />
          <Input placeholder="Receipt / OR Number" />
          <Input placeholder="Client Code" />
          <Input placeholder="Client Name" />
          <Input type="number" placeholder="Amount Paid" />

          {/* FIXED: select with .select */}
          <select defaultValue="" className="select">
            <option value="" disabled>
              Select Payment Type
            </option>
            <option>Cash</option>
            <option>Check</option>
            <option>Bank Transfer</option>
            <option>GCash</option>
            <option>Others</option>
          </select>

          <Input placeholder="Reference Number (if applicable)" />
        </div>

        <textarea
          placeholder="Notes (optional)"
          className="textarea"
          rows={3}
        />

        {/* UPLOAD PROOF */}
        <div className="p-10 bg-gray-50 rounded-xl flex flex-col items-center justify-center">
          <UploadCloud size={40} className="text-gray-500" />
          <p className="mt-3 text-gray-700 font-medium">
            Upload Proof of Payment (optional)
          </p>

          <label
            htmlFor="receiptUpload"
            className="mt-4 px-5 py-2.5 rounded-lg bg-blue-600 text-white cursor-pointer hover:bg-blue-700 transition"
          >
            Choose File
          </label>

          <input
            id="receiptUpload"
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />

          {receiptImage && (
            <div className="mt-4 flex items-center gap-2 text-sm text-green-700">
              <ImageIcon size={18} />
              <span>{receiptImage.name}</span>
            </div>
          )}
        </div>

        <button className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
          Save Payment
        </button>
      </div>

      {/* PAYMENT RECORDS TABLE */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-6">
          Received Payments
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-500">
              <tr className="text-left uppercase text-xs tracking-wide">
                <th className="pb-3">Date</th>
                <th className="pb-3">Client</th>
                <th className="pb-3">OR Number</th>
                <th className="pb-3">Amount</th>
                <th className="pb-3">Type</th>
                <th className="pb-3">Proof</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td colSpan={7} className="text-center py-10 text-gray-400">
                  No received payments recorded
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

/* REUSABLE INPUT */
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
