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
  date: string; // ISO string from API
}

export default function TripOverviewList() {
  const API_URL = "http://localhost:5001/api/Admin";

  // === STATE ===
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);

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
          client: t.client
  ? (t.client.registeredCompanyName || t.client.codeName)
  : "No Client",

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

  // === FILTER STATES ===
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDriver, setFilterDriver] = useState("All");

  // === BADGE COLORS ===
  const badge = (status: string) => {
    if (status === "Completed") return "bg-green-600";
    if (status === "In Progress") return "bg-blue-600";
    return "bg-yellow-600";
  };

  // === SORT + FILTER ===
  const filteredTrips = useMemo<Trip[]>(() => {
    let list = [...trips];

    // Search by client
    if (search.trim()) {
      list = list.filter((t) =>
        t.client.toLowerCase().includes(search.toLowerCase())
      );
    }

    // Filter by status
    if (filterStatus !== "All") {
      list = list.filter((t) => t.status === filterStatus);
    }

    // Filter by driver
    if (filterDriver !== "All") {
      list = list.filter((t) => t.driver === filterDriver);
    }

    // Sort: Today → Past → Future
    list.sort((a, b) => {
      const aIsToday = a.date === today;
      const bIsToday = b.date === today;

      if (aIsToday && !bIsToday) return -1;
      if (!aIsToday && bIsToday) return 1;

      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });

    return list;
  }, [trips, search, filterStatus, filterDriver, today]);

  const allDrivers = ["All", ...new Set(trips.map((t) => t.driver))];

  if (loading) return <p>Loading trips...</p>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Trip Overview</h1>

      {/* FILTERS */}
      <div className="bg-white p-4 shadow mb-6 rounded-lg flex flex-wrap gap-4">
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
            {filteredTrips.map((t) => {
              const isUpcoming = t.date > today;

              return (
                <tr key={t.id} className="border-b hover:bg-gray-50">
                  <td className="p-3 font-semibold">#{t.id}</td>
                  <td className="p-3">{t.driver}</td>
                  <td className="p-3">{t.truck}</td>
                  <td className="p-3">{t.client}</td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-1 rounded text-white text-xs ${badge(
                        t.status
                      )}`}
                    >
                      {t.status}
                    </span>
                  </td>
                  <td className="p-3">{t.date}</td>

                  <td className="p-3">
                    {!isUpcoming ? (
                      <Link
                        href={`/admin/tripoverviewlist/${t.id}`}
                        className="text-blue-600 hover:underline"
                      >
                        View Details
                      </Link>
                    ) : (
                      <span className="text-gray-400 cursor-not-allowed">
                        Upcoming Trip
                      </span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
