"use client";

import { useState, useEffect, useMemo } from "react";
import api from "@/lib/api"; // ← your axios instance

interface ServiceRate {
  id: number;
  clientId: number;
  serviceType: string;
  ratePerKg: string;      // Changed from number to string
  paymentTerms: string;
  createdAt: string;
}

export default function EncodeRatesPage() {
  // FORM STATE
  const [clientId, setClientId] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [rate, setRate] = useState("");
  const [terms, setTerms] = useState("");

  // TABLE STATE
  const [rates, setRates] = useState<ServiceRate[]>([]);
  const [loading, setLoading] = useState(false);

  // FILTERS
  const [filterClientId, setFilterClientId] = useState("");
  const [filterType, setFilterType] = useState("");

  // PAGINATION
  const rowsPerPage = 10;
  const [page, setPage] = useState(1);

  // LOAD DATA FROM BACKEND
  async function fetchRates() {
    setLoading(true);
    try {
      const res = await api.get("/accounting/rates", {  // Updated path
        params: {
          activeOnly: true,
        },
      });

      setRates(res.data);
    } catch (err) {
      console.error("Error loading rates:", err);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchRates();
  }, []);

  // FILTER LOGIC
  const filteredRates = useMemo(() => {
    return rates.filter((r) => {
      return (
        (filterClientId === "" || r.clientId.toString().includes(filterClientId)) &&
        (filterType === "" || r.serviceType.toLowerCase().includes(filterType.toLowerCase()))
      );
    });
  }, [rates, filterClientId, filterType]);

  const totalPages = Math.ceil(filteredRates.length / rowsPerPage);
  const paginatedData = filteredRates.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  // CREATE/SAVE NEW RATE
  async function handleSave() {
    if (!clientId || !serviceType || !rate) {
      alert("Client ID, Service Type, and Rate are required.");
      return;
    }

    try {
      await api.post("/accounting/rates", {
        clientId: Number(clientId),
        serviceType,
        ratePerKg: rate,           // Keep as string (don't convert to Number)
        paymentTerms: terms,
      });

      alert("Rate saved successfully!");
      setClientId("");
      setServiceType("");
      setRate("");
      setTerms("");
      fetchRates();
    } catch (err: any) {
      console.error("Error details:", err.response?.data);
      alert(`Failed to save rate: ${err.response?.data?.message || err.message}`);
    }
  }

  // DELETE RATE
  async function handleDelete(id: number) {
    if (!confirm("Are you sure you want to deactivate this rate?")) return;

    try {
      await api.delete(`/accounting/rates/${id}`);  // Updated path
      alert("Rate deactivated.");
      fetchRates();
    } catch (err) {
      console.error(err);
      alert("Failed to delete rate.");
    }
  }

  return (
    <div className="p-6 space-y-10">

      {/* TITLE */}
      <h1 className="text-2xl font-bold text-gray-800">Encode Rates Per Client</h1>

      {/* ADD RATE FORM */}
      <div className="bg-white p-6 rounded-xl shadow-md border">
        <h2 className="text-lg font-semibold mb-6">Add New Service Rate</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

          <LabeledInput
            label="Client ID"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
          />

          <LabeledInput
            label="Service Type"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
          />

          <LabeledInput
            label="Rate Per KG"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />

          <LabeledInput
            label="Payment Terms"
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
          />
        </div>

        <button
          onClick={handleSave}
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow"
        >
          Save Rate
        </button>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white p-6 rounded-xl shadow-md border">

        <h2 className="text-lg font-semibold mb-4">Existing Service Rates</h2>

        {/* FILTERS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <LabeledInput
            label="Filter by Client ID"
            value={filterClientId}
            onChange={(e) => setFilterClientId(e.target.value)}
          />
          <LabeledInput
            label="Filter by Service Type"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          />
        </div>

        {/* LOADING */}
        {loading && <p className="text-gray-500">Loading...</p>}

        {/* TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full mt-2 text-sm">
            <thead className="text-gray-500 uppercase text-xs">
              <tr>
                <th className="pb-3 text-left">Client ID</th>
                <th className="pb-3 text-left">Service Type</th>
                <th className="pb-3 text-left">Rate</th>
                <th className="pb-3 text-left">Terms</th>
                <th className="pb-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedData.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="py-3">{r.clientId}</td>
                  <td className="py-3">{r.serviceType}</td>
                  <td className="py-3">₱{parseFloat(r.ratePerKg).toFixed(2)}</td>
                  <td className="py-3">{r.paymentTerms}</td>
                  <td className="py-3">
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="px-3 py-1 bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      Deactivate
                    </button>
                  </td>
                </tr>
              ))}

              {paginatedData.length === 0 && !loading && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    No results found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className={`px-4 py-2 rounded border ${page === 1 ? "text-gray-400 bg-gray-100" : "bg-white hover:bg-gray-50"}`}
          >
            Previous
          </button>

          <p className="text-gray-600">Page {page} of {totalPages}</p>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className={`px-4 py-2 rounded border ${page === totalPages ? "text-gray-400 bg-gray-100" : "bg-white hover:bg-gray-50"}`}
          >
            Next
          </button>
        </div>

      </div>
    </div>
  );
}

/* REUSABLE COMPONENT */
function LabeledInput({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-gray-600">{label}</label>
      <input
        value={value}
        onChange={onChange}
        className="input"
      />
    </div>
  );
}
