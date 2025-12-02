"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

export default function TripOverviewList() {
  const trips = [
    {
      id: 301,
      driver: "Juan Dela Cruz",
      truck: "ABC-1234",
      client: "Jollibee MEPZ",
      status: "Completed",
      date: "2025-12-02",
    },
    {
      id: 302,
      driver: "Mark Santos",
      truck: "XYZ-5678",
      client: "Robinsons Galleria",
      status: "In Progress",
      date: "2025-12-05",
    },
    {
      id: 303,
      driver: "Aldrin Chua",
      truck: "GHI-9988",
      client: "Mandaue Foam",
      status: "On The Way",
      date: "2025-12-10",
    },
  ];

  // === TODAY ===
  const today = new Date().toISOString().split("T")[0]; // yyyy-mm-dd

  // === FILTERS ===
  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterDriver, setFilterDriver] = useState("All");

  const badge = (status: string) => {
    if (status === "Completed") return "bg-green-600";
    if (status === "In Progress") return "bg-blue-600";
    return "bg-yellow-600";
  };

  // === SORTING + FILTERING LOGIC ===
  const filteredTrips = useMemo(() => {
    let list = [...trips];

    // Filter by search
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

      const aDate = new Date(a.date);
      const bDate = new Date(b.date);

      return aDate.getTime() - bDate.getTime();
    });

    return list;
  }, [search, filterStatus, filterDriver, today]);

  const allDrivers = ["All", ...new Set(trips.map((t) => t.driver))];

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
