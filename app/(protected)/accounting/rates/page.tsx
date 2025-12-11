"use client";

import { useState, useEffect, useMemo, ChangeEvent } from "react";
import api from "@/lib/api"; // your axios instance

interface ServiceRate {
  id: number;
  clientId: number;
  clientName: string;
  serviceType: string;
  ratePerKg: string;
  paymentTerms: string;
  createdAt: string;
}

interface ClientServiceRateSnapshot {
  serviceType: string;
  ratePerKg: string;
  paymentTerms: string;
}

interface ClientOption {
  id: number;
  name: string;
  serviceRate?: ClientServiceRateSnapshot;
}

export default function EncodeRatesPage() {
  // FORM
  const [clientId, setClientId] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [rate, setRate] = useState("");
  const [terms, setTerms] = useState("");

  // TABLE DATA
  const [rates, setRates] = useState<ServiceRate[]>([]);
  const [loading, setLoading] = useState(false);

  // CLIENT DROPDOWN
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);

  // FILTERS
  const [filterClientId, setFilterClientId] = useState("");
  const [filterType, setFilterType] = useState("");

  // PAGINATION
  const rowsPerPage = 10;
  const [page, setPage] = useState(1);

  /* ─────────────────────────────────────────────── */
  /* LOAD RATES FROM BACKEND                         */
  /* ─────────────────────────────────────────────── */
  async function loadRates() {
    setLoading(true);
    try {
      const res = await api.get("/Accounting/rates", {
        params: { activeOnly: true },
      });
      setRates(res.data);
    } catch (err) {
      console.error("Failed to load rates:", err);
    }
    setLoading(false);
  }

  /* ─────────────────────────────────────────────── */
  /* LOAD CLIENTS FOR DROPDOWN (FROM ADMIN CONTROLLER) */
  /* ─────────────────────────────────────────────── */
  async function loadClients() {
  setClientsLoading(true);
  try {
    const res = await api.get("/Admin/client");

    type RawClient = {
      id: number;
      registeredCompanyName?: string | null;
      serviceRate?: {
        serviceType?: string | null;
        ratePerKg?: string | null;
        paymentTerms?: string | null;
      } | null;
    };

    const data = res.data as RawClient[];

    const mapped: ClientOption[] = data.map((c) => ({
      id: c.id,
      name: c.registeredCompanyName || "(Unknown Client)",  // ✔ Registered company name only
      serviceRate: c.serviceRate
        ? {
            serviceType: c.serviceRate.serviceType ?? "",
            ratePerKg: c.serviceRate.ratePerKg ?? "",
            paymentTerms: c.serviceRate.paymentTerms ?? "",
          }
        : undefined,
    }));

    setClients(mapped);
  } catch (err) {
    console.error("Failed to load clients:", err);
  }
  setClientsLoading(false);
}


  useEffect(() => {
    loadRates();
    loadClients();
  }, []);

  /* ─────────────────────────────────────────────── */
  /* PREFILL FIELDS WHEN CLIENT CHANGES              */
  /* ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!clientId) {
      setServiceType("");
      setRate("");
      setTerms("");
      return;
    }

    const selectedId = Number(clientId);
    if (!selectedId) return;

    const selectedClient = clients.find((c) => c.id === selectedId);

    if (selectedClient?.serviceRate) {
      setServiceType(selectedClient.serviceRate.serviceType);
      setRate(selectedClient.serviceRate.ratePerKg);
      setTerms(selectedClient.serviceRate.paymentTerms);
    } else {
      // No active service rate snapshot from AdminController
      setServiceType("");
      setRate("");
      setTerms("");
    }
  }, [clientId, clients]);

  /* ─────────────────────────────────────────────── */
  /* FILTERING + PAGINATION                          */
  /* ─────────────────────────────────────────────── */
  const filteredRates = useMemo(() => {
    return rates.filter((r) => {
      return (
        (filterClientId === "" ||
          r.clientId.toString().includes(filterClientId)) &&
        (filterType === "" ||
          r.serviceType.toLowerCase().includes(filterType.toLowerCase()))
      );
    });
  }, [rates, filterClientId, filterType]);

  const totalPages = Math.max(1, Math.ceil(filteredRates.length / rowsPerPage));
  const paginatedData = filteredRates.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  /* ─────────────────────────────────────────────── */
  /* SAVE NEW RATE (POST to backend)                 */
  /* ─────────────────────────────────────────────── */
  async function handleSave() {
    if (!clientId || !serviceType || !rate) {
      alert("Client, Service Type, and Rate are required.");
      return;
    }

    try {
      const payload = {
        clientId: Number(clientId),
        serviceType: serviceType.trim(),
        ratePerKg: rate.trim(),
        paymentTerms: terms.trim(),
      };

      const res = await api.post("/Accounting/rates", payload);

      alert("Rate saved successfully!");

      // Prepend new record to table
      setRates((prev) => [res.data, ...prev]);

      // Reset form
      setClientId("");
      setServiceType("");
      setRate("");
      setTerms("");
      setPage(1);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data || "Failed to save rate.");
    }
  }

  /* ─────────────────────────────────────────────── */
  /* DELETE / DEACTIVATE RATE                        */
  /* ─────────────────────────────────────────────── */
  async function handleDelete(id: number) {
    if (!confirm("Deactivate this rate?")) return;

    try {
      await api.delete(`/Accounting/rates/${id}`);

      setRates((prev) => prev.filter((r) => r.id !== id));

      alert("Rate deactivated.");
    } catch (err) {
      console.error(err);
      alert("Failed to deactivate rate.");
    }
  }

  /* ─────────────────────────────────────────────── */
  /* UI RENDERING                                    */
  /* ─────────────────────────────────────────────── */
  return (
    <div className="p-6 space-y-10">
      {/* TITLE */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Encode Service Rates per Client
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage hauling service pricing and payment terms for each client.
        </p>
      </div>

      {/* FORM CARD */}
      <div className="bg-white p-6 rounded-xl shadow border">
        <h2 className="text-lg font-semibold mb-5">Add New Service Rate</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LabeledSelect
            label="Client"
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value);
              setPage(1);
            }}
            options={clients}
            loading={clientsLoading}
          />

          <LabeledInput
            label="Service Type"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
          />

          <LabeledInput
            label="Rate per KG"
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
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow font-medium"
        >
          Save Rate
        </button>
      </div>

      {/* TABLE CARD */}
      <div className="bg-white p-6 rounded-xl shadow border">
        <h2 className="text-lg font-semibold mb-5">Existing Service Rates</h2>

        {/* FILTERS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <LabeledInput
            label="Filter by Client ID"
            value={filterClientId}
            onChange={(e) => {
              setFilterClientId(e.target.value);
              setPage(1);
            }}
          />
          <LabeledInput
            label="Filter by Service Type"
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* LOADING */}
        {loading && <p className="text-gray-500">Loading...</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-100 text-gray-600 sticky top-0">
              <tr>
                <th className="py-2 px-3 text-left">Client</th>
                <th className="py-2 px-3 text-left">Service Type</th>
                <th className="py-2 px-3 text-left">Rate</th>
                <th className="py-2 px-3 text-left">Terms</th>
                <th className="py-2 px-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedData.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="py-3 px-3">{r.clientName}</td>
                  <td className="py-3 px-3">{r.serviceType}</td>
                  <td className="py-3 px-3">
                    ₱{parseFloat(r.ratePerKg).toFixed(2)}
                  </td>
                  <td className="py-3 px-3">{r.paymentTerms}</td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                    >
                      Deactivate
                    </button>
                  </td>
                </tr>
              ))}

              {!loading && paginatedData.length === 0 && (
                <tr>
                  <td
                    colSpan={5}
                    className="py-8 text-center text-gray-400"
                  >
                    No matching results.
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
            className={`px-4 py-2 rounded border ${
              page === 1
                ? "text-gray-400 bg-gray-100"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            Previous
          </button>

          <p className="text-gray-600">
            Page {page} of {totalPages}
          </p>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className={`px-4 py-2 rounded border ${
              page === totalPages
                ? "text-gray-400 bg-gray-100"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

/* REUSABLE INPUT COMPONENT */
function LabeledInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-gray-600 font-medium">{label}</label>
      <input
        value={value}
        onChange={onChange}
        className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

/* CLIENT DROPDOWN COMPONENT */
function LabeledSelect({
  label,
  value,
  onChange,
  options,
  loading,
}: {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  options: ClientOption[];
  loading?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-gray-600 font-medium">{label}</label>
      <select
        value={value}
        onChange={onChange}
        className="border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">
          {loading ? "Loading clients..." : "Select a client"}
        </option>
        {options.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
