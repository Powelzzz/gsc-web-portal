"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";

export default function HaulingTripListPage() {
  const [trips, setTrips] = useState<any[]>([]);
  const [filteredTrips, setFilteredTrips] = useState<any[]>([]);
  const [clients, setClients] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const [page, setPage] = useState(1);
  const perPage = 5;

  /* -------------------------------------------
     LOAD TRIPS + CLIENT INFORMATION
  ------------------------------------------- */
  const loadTrips = async () => {
    try {
      const t = await api.get("/admin/haulingtrip");
      const c = await api.get("/admin/client");

      const sorted = t.data.sort((a: any, b: any) => b.id - a.id);

      setTrips(sorted);
      setFilteredTrips(sorted);
      setClients(c.data);
    } catch (err) {
      console.log("Error loading trips:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrips();
  }, []);

  /* -------------------------------------------
     FIND CLIENT NAME
  ------------------------------------------- */
  const getClientName = (id: number) => {
    const c = clients.find((x) => x.id === id);
    return c ? `[${c.codeName}] ${c.registeredCompanyName}` : id;
  };

  const formatDate = (d: string) => {
    try {
      return new Date(d).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
        timeZone: "Asia/Manila",
      });
    } catch {
      return d;
    }
  };

  /* -------------------------------------------
     FILTER TRIPS
  ------------------------------------------- */
  useEffect(() => {
    let data = [...trips];

    if (search.trim()) {
      const s = search.toLowerCase();
      data = data.filter((t) => JSON.stringify(t).toLowerCase().includes(s));
    }

    if (dateFilter.trim()) {
      data = data.filter(
        (t) => t.pickUpDate?.slice(0, 10) === dateFilter
      );
    }

    if (statusFilter) {
      data = data.filter((t) => t.status === statusFilter);
    }

    setFilteredTrips(data);
    setPage(1);
  }, [search, dateFilter, statusFilter, trips]);

  const getClientDisplay = (client: any) => {
  if (!client) return "Unknown Client";
  return `[${client.codeName}] ${client.registeredCompanyName}`;
};


  const totalPages = Math.ceil(filteredTrips.length / perPage);
  const paginated = filteredTrips.slice((page - 1) * perPage, page * perPage);

  /* -------------------------------------------
     MAIN UI
  ------------------------------------------- */
  return (
    <div className="max-w-5xl mx-auto bg-white p-8 rounded-xl shadow border">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Hauling Trips</h1>

        <Link
          href="/admin/hauling/create"
          className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700"
        >
          + Create Trip
        </Link>
      </div>

      {/* FILTERS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">

        {/* SEARCH */}
        <input
          type="text"
          placeholder="Search trips..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-3 rounded-lg w-full"
        />

        {/* DATE FILTER */}
        <input
          type="date"
          className="border p-3 rounded-lg w-full"
          value={dateFilter}
          onChange={(e) => setDateFilter(e.target.value)}
        />

        {/* STATUS FILTER */}
        <select
          className="border p-3 rounded-lg w-full"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="Pending">Pending</option>
          <option value="Scheduled">Scheduled</option>
          <option value="Completed">Completed</option>
          <option value="Failed">Failed</option>
        </select>
      </div>

      {/* LOADING */}
      {loading && (
        <p className="text-center py-10 text-gray-500">Loading trips...</p>
      )}

      {/* EMPTY */}
      {!loading && filteredTrips.length === 0 && (
        <p className="text-center py-10 text-gray-400 text-lg">
          No hauling trips found.
        </p>
      )}

      {/* TRIP CARDS */}
      <div className="space-y-4">
        {paginated.map((trip: any) => (
          <div
            key={trip.id}
            className="border rounded-xl p-5 bg-gray-50 hover:bg-gray-100 transition shadow-sm"
          >
            <h2 className="text-xl font-bold text-gray-800 mb-3">
              Trip #{trip.id}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Detail label="Client" value={getClientName(trip.client.id)} />
              <Detail label="Pick-up Date" value={formatDate(trip.pickUpDate)} />
              <Detail label="Status" value={trip.status} />
            </div>

            <Link
              href={`/admin/hauling/${trip.id}`}
              className="mt-4 inline-block border border-indigo-600 text-indigo-600 px-4 py-2 rounded-lg font-medium hover:bg-indigo-50 text-sm"
            >
              View Hauling Trip Details
            </Link>
          </div>
        ))}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-8">
          <button
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
            className="px-4 py-2 bg-gray-200 disabled:opacity-50 rounded-lg"
          >
            Previous
          </button>

          <p className="text-gray-700 font-medium">
            Page {page} of {totalPages}
          </p>

          <button
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
            className="px-4 py-2 bg-gray-200 disabled:opacity-50 rounded-lg"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}

function Detail({ label, value }: any) {
  return (
    <div className="flex flex-col">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className="text-gray-700 font-semibold">{value}</span>
    </div>
  );
}
