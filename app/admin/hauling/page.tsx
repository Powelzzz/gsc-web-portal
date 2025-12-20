"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";

const TZ = "Asia/Manila";

function formatPickUp(d: string | null | undefined) {
  if (!d) return { date: "—", time: "—" };

  const dt = new Date(d);
  if (isNaN(dt.getTime())) return { date: "—", time: "—" };

  const date = dt.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: TZ,
  });

  const time = dt.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: TZ,
  });

  return { date, time };
}

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

  /* -------------------------------------------
     FILTER TRIPS
  ------------------------------------------- */
  useEffect(() => {
    let data = [...trips];

    if (search.trim()) {
      const s = search.toLowerCase();
      data = data.filter((t) => JSON.stringify(t).toLowerCase().includes(s));
    }

    // still filter by date portion (YYYY-MM-DD)
    if (dateFilter.trim()) {
      data = data.filter((t) => t.pickUpDate?.slice(0, 10) === dateFilter);
    }

    if (statusFilter) {
      data = data.filter((t) => t.status === statusFilter);
    }

    setFilteredTrips(data);
    setPage(1);
  }, [search, dateFilter, statusFilter, trips]);

  const totalPages = Math.ceil(filteredTrips.length / perPage);
  const paginated = filteredTrips.slice((page - 1) * perPage, page * perPage);

  /* -------------------------------------------
     MAIN UI (MOBILE-FIRST)
  ------------------------------------------- */
  return (
    <div className="px-3 sm:px-4 md:px-0 py-3 sm:py-4">
      <div className="max-w-5xl mx-auto bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow border">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Hauling Trips
            </h1>
            <p className="text-gray-500 text-sm">View and manage hauling trips</p>
          </div>

          <Link
            href="/admin/hauling/create"
            className="
              w-full sm:w-auto inline-flex items-center justify-center
              bg-indigo-600 text-white px-5 py-3 sm:py-2.5 rounded-xl
              text-sm font-semibold hover:bg-indigo-700 shadow
              active:scale-[0.99] transition
            "
          >
            + Create Trip
          </Link>
        </div>

        {/* FILTERS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 mb-5 sm:mb-6">
          {/* SEARCH */}
          <input
            type="text"
            placeholder="Search trips..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
              w-full border border-gray-300 rounded-xl p-3 bg-gray-50
              focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
              outline-none text-sm text-gray-700 shadow-sm transition
            "
          />

          {/* DATE FILTER */}
          <input
            type="date"
            className="
              w-full border border-gray-300 rounded-xl p-3 bg-gray-50
              focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
              outline-none text-sm text-gray-700 shadow-sm transition
            "
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
          />

          {/* STATUS FILTER */}
          <select
            className="
              w-full border border-gray-300 rounded-xl p-3 bg-gray-50
              focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
              outline-none text-sm text-gray-700 shadow-sm transition
            "
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
          <div className="text-center py-10 text-gray-500 font-medium">
            Loading trips...
          </div>
        )}

        {/* EMPTY */}
        {!loading && filteredTrips.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-lg font-medium">
            No hauling trips found.
          </div>
        )}

        {/* TRIP CARDS */}
        <div className="space-y-4">
          {paginated.map((trip: any) => {
            const pu = formatPickUp(trip.pickUpDate);

            return (
              <div
                key={trip.id}
                className="
                  border rounded-xl p-4 sm:p-5 bg-gray-50 hover:bg-gray-100
                  transition shadow-sm
                "
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                    Trip #{trip.id}
                  </h2>

                  <span
                    className="
                      text-[11px] sm:text-xs px-2.5 py-1 rounded-full
                      bg-white border text-gray-700 font-semibold whitespace-nowrap
                    "
                  >
                    {trip.status}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Detail label="Client" value={getClientName(trip.client.id)} />
                  <Detail label="Pick-up Date" value={pu.date} />
                  <Detail label="Pick-up Time" value={pu.time} />
                  <Detail label="Status" value={trip.status} />
                </div>

                <Link
                  href={`/admin/hauling/${trip.id}`}
                  className="
                    mt-4 inline-flex w-full sm:w-auto items-center justify-center
                    border border-indigo-600 text-indigo-600 px-4 py-2.5 rounded-xl
                    font-semibold hover:bg-indigo-50 text-sm
                    active:scale-[0.99] transition
                  "
                >
                  View Hauling Trip Details
                </Link>
              </div>
            );
          })}
        </div>

        {/* PAGINATION */}
        {!loading && totalPages > 1 && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-6">
            <button
              disabled={page === 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="
                w-full sm:w-auto px-4 py-2.5 rounded-xl border text-sm font-medium
                disabled:opacity-50 disabled:cursor-not-allowed
                border-gray-300 text-gray-700 hover:bg-gray-50
                active:scale-[0.99] transition
              "
            >
              Previous
            </button>

            <p className="text-gray-600 text-sm text-center">
              Page <span className="font-semibold">{page}</span> of{" "}
              <span className="font-semibold">{totalPages}</span>
            </p>

            <button
              disabled={page === totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              className="
                w-full sm:w-auto px-4 py-2.5 rounded-xl border text-sm font-medium
                disabled:opacity-50 disabled:cursor-not-allowed
                border-gray-300 text-gray-700 hover:bg-gray-50
                active:scale-[0.99] transition
              "
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Detail({ label, value }: any) {
  return (
    <div className="flex flex-col min-w-0">
      <span className="text-xs font-medium text-gray-500">{label}</span>
      <span className="text-sm text-gray-700 font-semibold truncate">{value}</span>
    </div>
  );
}
