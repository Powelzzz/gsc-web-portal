"use client";

import { useState } from "react";
import { UploadCloud, Image as ImageIcon } from "lucide-react";

export default function UploadSentBillingPage() {
  const [billingImage, setBillingImage] = useState<File | null>(null);

  const handleFileChange = (e: any) => {
    const file = e.target.files?.[0];
    if (file) setBillingImage(file);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10">

      {/* HEADER */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900">
          Upload Sent Billing
        </h1>
        <p className="text-gray-500">
          Record billing invoices that have already been sent to clients.
        </p>
      </div>

      {/* SEARCH FILTERS */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-6">
        <h2 className="font-semibold text-gray-800">Search Filters</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input placeholder="Client Code" />
          <Input placeholder="Client Company Name" />
          <Input placeholder="Billing Period (optional)" />
        </div>

        <button className="px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition">
          Search
        </button>
      </div>

      {/* SENT BILLING FORM */}
      <div className="bg-white rounded-xl shadow-sm p-6 space-y-8">
        <h2 className="font-semibold text-gray-800">Sent Billing Details</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input type="date" placeholder="Date Sent" />
          <Input placeholder="Invoice No." />
          <Input placeholder="Receiver's Full Name" />
        </div>

        {/* UPLOAD BOX */}
        <div className="p-10 bg-gray-50 rounded-xl flex flex-col items-center justify-center text-gray-600">
          <UploadCloud size={44} />

          <p className="mt-3 text-gray-700 font-medium">
            Upload Sent Billing Image
          </p>

          <label
            htmlFor="billingUpload"
            className="mt-4 px-5 py-2.5 rounded-lg bg-blue-600 text-white cursor-pointer hover:bg-blue-700 transition"
          >
            Choose File
          </label>

          <input
            id="billingUpload"
            type="file"
            className="hidden"
            onChange={handleFileChange}
          />

          {billingImage && (
            <div className="mt-4 flex items-center gap-2 text-sm text-green-700">
              <ImageIcon size={18} />
              <span>{billingImage.name}</span>
            </div>
          )}
        </div>

        <button className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition">
          Save Sent Billing
        </button>
      </div>

      {/* RECORDS TABLE */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h2 className="font-semibold text-gray-800 mb-6">Sent Billing Records</h2>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-500">
              <tr className="text-left uppercase text-xs tracking-wide">
                <th className="pb-3">Date Sent</th>
                <th className="pb-3">Invoice No.</th>
                <th className="pb-3">Receiver</th>
                <th className="pb-3">Image</th>
                <th className="pb-3">Actions</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-10 text-gray-400"
                >
                  No records found
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}

/* REUSABLE INPUT COMPONENT */
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
