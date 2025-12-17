"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";

// === TRIP TYPE ===
interface Trip {
  id: number;
  driver: string;
  truck: string;
  client: string;
  status: string;
  date: string; // yyyy-mm-dd
}

export default function TripOverviewList() {
  const API_URL = "http://localhost:5001/api/Admin";

  // === STATE ===
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

  // === FILTER STATES ===
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDriver, setFilterDriver] = useState("All");

  // ✅ DATE FILTER (RANGE)
  const [dateFrom, setDateFrom] = useState(""); // yyyy-mm-dd
  const [dateTo, setDateTo] = useState(""); // yyyy-mm-dd

  // === PAGINATION ===
  const PAGE_SIZE = 20;
  const [page, setPage] = useState(1);

  // === LOAD TRIPS FROM API ===
  useEffect(() => {
    async function loadTrips() {
      try {
        const token = document.cookie
          .split("; ")
          .find((row) => row.startsWith("gc_token="))
          ?.split("=")[1];

        const res = await fetch(`${API_URL}/haulingtrip`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!res.ok) throw new Error("Failed to load trips");

        const raw = await res.json();

        const mapped: Trip[] = raw.map((t: any) => ({
          id: t.id,
          driver: t.driver ? `${t.driver.firstName} ${t.driver.lastName}` : "No Driver",
          truck: t.truck ? t.truck.plateNumber : "No Truck",
          client: t.client ? (t.client.registeredCompanyName || t.client.codeName) : "No Client",
          status: t.status,
          date: t.pickUpDate ? t.pickUpDate.split("T")[0] : "",
        }));

        setTrips(mapped);
      } catch (err) {
        console.error("Error loading trips:", err);
      } finally {
        setLoading(false);
      }
    }

    loadTrips();
  }, [API_URL]);

  const today = new Date().toISOString().split("T")[0];

  // ✅ Reset to page 1 when filters change
  useEffect(() => {
    setPage(1);
  }, [search, filterStatus, filterDriver, dateFrom, dateTo]);

  // === BADGE COLORS ===
  const badge = (status: string) => {
    if (status === "Completed") return "bg-green-600";
    if (status === "In Progress") return "bg-blue-600";
    return "bg-yellow-600";
  };

  // === FILTER + SORT (Most Recent First) ===
  const filteredTrips = useMemo<Trip[]>(() => {
    let list = [...trips];

    // Search by client
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((t) => t.client.toLowerCase().includes(q));
    }

    // Filter by status
    if (filterStatus !== "All") {
      list = list.filter((t) => t.status === filterStatus);
    }

    // Filter by driver
    if (filterDriver !== "All") {
      list = list.filter((t) => t.driver === filterDriver);
    }

    // ✅ Filter by date range (inclusive)
    if (dateFrom) {
      list = list.filter((t) => t.date && t.date >= dateFrom);
    }
    if (dateTo) {
      list = list.filter((t) => t.date && t.date <= dateTo);
    }

    // Sort: Most recent date first (blank dates go last)
    list.sort((a, b) => {
      const aTime = a.date ? new Date(a.date).getTime() : -Infinity;
      const bTime = b.date ? new Date(b.date).getTime() : -Infinity;
      return bTime - aTime;
    });

    return list;
  }, [trips, search, filterStatus, filterDriver, dateFrom, dateTo]);

  // === PAGINATION DERIVED ===
  const total = filteredTrips.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const paginatedTrips = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredTrips.slice(start, start + PAGE_SIZE);
  }, [filteredTrips, page]);

  const allDrivers = useMemo(
    () => ["All", ...Array.from(new Set(trips.map((t) => t.driver)))],
    [trips]
  );

  if (loading) return <p>Loading trips...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Trip Overview</h1>

      {/* FILTERS */}
      <div className="bg-white p-4 shadow mb-6 rounded-lg flex flex-wrap gap-4 items-center">
        {/* Search */}
        <input
          type="text"
          placeholder="Search client..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border px-3 py-2 rounded w-60"
        />

        {/* Status Filter */}
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          <option>All</option>
          <option>Completed</option>
          <option>In Progress</option>
          <option>On The Way</option>
        </select>

        {/* Driver Filter */}
        <select
          value={filterDriver}
          onChange={(e) => setFilterDriver(e.target.value)}
          className="border px-3 py-2 rounded"
        >
          {allDrivers.map((d, i) => (
            <option key={i}>{d}</option>
          ))}
        </select>

        {/* ✅ Date From */}
        <input
          type="date"
          value={dateFrom}
          onChange={(e) => setDateFrom(e.target.value)}
          className="border px-3 py-2 rounded"
        />

        {/* ✅ Date To */}
        <input
          type="date"
          value={dateTo}
          onChange={(e) => setDateTo(e.target.value)}
          className="border px-3 py-2 rounded"
        />

        {/* ✅ Clear Dates */}
        <button
          type="button"
          onClick={() => {
            setDateFrom("");
            setDateTo("");
          }}
          className="border px-3 py-2 rounded"
        >
          Clear Dates
        </button>

        {/* Count */}
        <div className="ml-auto text-sm text-gray-600">
          Showing{" "}
          <span className="font-semibold">
            {total === 0 ? 0 : Math.min(PAGE_SIZE, total - (page - 1) * PAGE_SIZE)}
          </span>{" "}
          of <span className="font-semibold">{total}</span>
        </div>
      </div>

      {/* TABLE */}
      <div className="bg-white shadow rounded-lg overflow-hidden border">
        <table className="w-full text-left text-sm">
          <thead className="bg-gray-100 border-b text-gray-700 sticky top-0">
            <tr>
              <th className="p-3">Trip #</th>
              <th className="p-3">Driver</th>
              <th className="p-3">Truck</th>
              <th className="p-3">Client</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
              <th className="p-3">Actions</th>
            </tr>
          </thead>

          <tbody>
            {paginatedTrips.map((t) => {
              const isUpcoming = t.date > today;

              return (
                <tr key={t.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-semibold">#{t.id}</td>
                  <td className="p-3">{t.driver}</td>
                  <td className="p-3">{t.truck}</td>
                  <td className="p-3">{t.client}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-white text-xs ${badge(t.status)}`}>
                      {t.status}
                    </span>
                  </td>
                  <td className="p-3">{t.date || "-"}</td>

                  <td className="p-3">
                    {!isUpcoming ? (
                      <Link href={`/admin/tripoverviewlist/${t.id}`} className="text-blue-600 hover:underline">
                        View Details
                      </Link>
                    ) : (
                      <span className="text-gray-400 cursor-not-allowed">Upcoming Trip</span>
                    )}
                  </td>
                </tr>
              );
            })}

            {paginatedTrips.length === 0 && (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500">
                  No trips found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* PAGINATION CONTROLS */}
      <div className="flex items-center justify-between mt-4">
        <div className="text-sm text-gray-600">
          Page <span className="font-semibold">{page}</span> of{" "}
          <span className="font-semibold">{totalPages}</span>
        </div>

        <div className="flex gap-2">
          <button
            className="border px-3 py-2 rounded disabled:opacity-50"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Prev
          </button>

          <button
            className="border px-3 py-2 rounded disabled:opacity-50"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
