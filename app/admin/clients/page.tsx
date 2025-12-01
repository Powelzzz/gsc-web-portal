"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ClientListPage() {
  const router = useRouter();

  const [clients, setClients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // PAGINATION
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  const totalPages = Math.ceil(clients.length / itemsPerPage);
  const paginatedClients = clients.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  const loadClients = async () => {
    try {
      const res = await api.get("/admin/client");

      // Sort newest → oldest
      const sorted = [...res.data].sort((a, b) => b.id - a.id);

      setClients(sorted);
    } catch (err) {
      setError("Failed to load clients.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow border">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Clients</h1>
          <p className="text-gray-500 text-sm">
            View and manage all registered clients
          </p>
        </div>

        <Link
          href="/admin/clients/create"
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow"
        >
          + Add New Client
        </Link>
      </div>

      {/* ERROR */}
      {error && (
        <div className="p-3 mb-4 text-sm bg-red-100 text-red-700 border border-red-300 rounded">
          {error}
        </div>
      )}

      {/* LOADING */}
      {loading && (
        <div className="text-center py-10 text-gray-500 font-medium">
          Loading clients...
        </div>
      )}

      {/* EMPTY */}
      {!loading && clients.length === 0 && (
        <div className="text-center py-10 text-gray-400 text-lg font-medium">
          No clients found.
        </div>
      )}

      {/* CLIENT LIST */}
      <div className="space-y-4">
        {paginatedClients.map((client: any) => (
          <div
            key={client.id}
            className="border rounded-xl p-5 bg-gray-50 hover:bg-gray-100 
              transition shadow-sm cursor-pointer"
            onClick={() => router.push(`/admin/clients/${client.id}`)}
          >
            <p className="text-xs text-gray-500 text-right -mt-1 mb-1">
              Click to view & manage
            </p>

            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              {client.registeredCompanyName}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

              <Detail label="Code Name" value={client.codeName} />

              <Detail
                label="Pick-up Location"
                value={client.pickUpLocation}
              />

              <Detail
                label="Preferred Schedule"
                value={client.preferredHaulingSchedule || "—"}
              />

              <Detail
                label="Rate/kg (Driver + Loader)"
                value={
                  client.driverAndLoaderPerKgFee
                    ? `₱${client.driverAndLoaderPerKgFee}`
                    : "—"
                }
              />

              {/* NEW FIELDS ↓↓↓ */}

              <Detail
                label="Client Service Rate"
                value={
                  client.clientServiceRate
                    ? `₱${client.clientServiceRate}`
                    : "—"
                }
              />

              <Detail
                label="Minimum Charging"
                value={
                  client.minimumCharging
                    ? `₱${client.minimumCharging}`
                    : "—"
                }
              />

              <Detail
                label="Service Type"
                value={client.serviceRate?.serviceType ?? "—"}
              />

              <Detail
                label="Payment Terms"
                value={client.serviceRate?.paymentTerms ?? "—"}
              />

            </div>
          </div>
        ))}
      </div>

      {/* PAGINATION */}
      {clients.length > 0 && (
        <div className="flex justify-center items-center gap-3 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`
              px-4 py-2 rounded-lg border text-sm font-medium
              ${
                page === 1
                  ? "text-gray-400 border-gray-200"
                  : "text-gray-700 border-gray-300 hover:bg-gray-100"
              }
            `}
          >
            Previous
          </button>

          <span className="text-sm text-gray-600 font-semibold">
            Page {page} of {totalPages}
          </span>

          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className={`
              px-4 py-2 rounded-lg border text-sm font-medium
              ${
                page === totalPages
                  ? "text-gray-400 border-gray-200"
                  : "text-gray-700 border-gray-300 hover:bg-gray-100"
              }
            `}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

/* DETAIL COMPONENT */
function Detail({ label, value }: any) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <span className="text-gray-700 font-semibold">{value}</span>
    </div>
  );
}
