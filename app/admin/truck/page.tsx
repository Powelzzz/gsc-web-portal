"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";

export default function TruckListPage() {
  const [trucks, setTrucks] = useState<any[]>([]);
  const [filteredTrucks, setFilteredTrucks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(""); // "", "active", "inactive"

  const [page, setPage] = useState(1);
  const perPage = 5;

  /* -------------------------------------------
     LOAD TRUCKS
  ------------------------------------------- */
  const loadTrucks = async () => {
    try {
      // endpoint you provided
      const res = await api.get("/admin/trucks");
      const sorted = (res.data || []).sort((a: any, b: any) => b.id - a.id);

      setTrucks(sorted);
      setFilteredTrucks(sorted);
    } catch (err) {
      console.log("Error loading trucks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrucks();
  }, []);

  const isActiveTruck = (t: any) =>
    t?.isActive === "true" || t?.isActive === "1" || t?.isActive === true;

  /* -------------------------------------------
     FILTER TRUCKS
  ------------------------------------------- */
  useEffect(() => {
    let data = [...trucks];

    if (search.trim()) {
      const s = search.toLowerCase();
      data = data.filter((t) => JSON.stringify(t).toLowerCase().includes(s));
    }

    if (statusFilter === "active") {
      data = data.filter((t) => isActiveTruck(t));
    } else if (statusFilter === "inactive") {
      data = data.filter((t) => !isActiveTruck(t));
    }

    setFilteredTrucks(data);
    setPage(1);
  }, [search, statusFilter, trucks]);

  const totalPages = Math.ceil(filteredTrucks.length / perPage);
  const paginated = filteredTrucks.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="px-3 sm:px-4 md:px-0 py-3 sm:py-4">
      <div className="max-w-5xl mx-auto bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow border">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Trucks
            </h1>
            <p className="text-gray-500 text-sm">View and manage trucks</p>
          </div>

          <Link
            href="/admin/truck/addtruck"
            className="
              w-full sm:w-auto inline-flex items-center justify-center
              bg-indigo-600 text-white px-5 py-3 sm:py-2.5 rounded-xl
              text-sm font-semibold hover:bg-indigo-700 shadow
              active:scale-[0.99] transition
            "
          >
            + Add Truck
          </Link>
        </div>

        {/* FILTERS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4 mb-5 sm:mb-6">
          {/* SEARCH */}
          <input
            type="text"
            placeholder="Search trucks..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="
              w-full border border-gray-300 rounded-xl p-3 bg-gray-50
              focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
              outline-none text-sm text-gray-700 shadow-sm transition
            "
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
            <option value="">All Trucks</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        {/* LOADING */}
        {loading && (
          <div className="text-center py-10 text-gray-500 font-medium">
            Loading trucks...
          </div>
        )}

        {/* EMPTY */}
        {!loading && filteredTrucks.length === 0 && (
          <div className="text-center py-10 text-gray-400 text-lg font-medium">
            No trucks found.
          </div>
        )}

        {/* TRUCK CARDS */}
        <div className="space-y-4">
          {paginated.map((truck: any) => {
            const active = isActiveTruck(truck);

            return (
              <div
                key={truck.id}
                className="
                  border rounded-xl p-4 sm:p-5 bg-gray-50 hover:bg-gray-100
                  transition shadow-sm
                "
              >
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800">
                    {truck.plateNumber || `Truck #${truck.id}`}
                  </h2>

                  <span
                    className="
                      text-[11px] sm:text-xs px-2.5 py-1 rounded-full
                      bg-white border text-gray-700 font-semibold whitespace-nowrap
                    "
                  >
                    {active ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Detail label="Plate Number" value={truck.plateNumber || "—"} />
                  <Detail label="Make" value={truck.make || "—"} />
                  <Detail label="Model" value={truck.model || "—"} />
                  <Detail label="Year" value={truck.year ?? "—"} />
                </div>

                <Link
                  href={`/admin/truck/${truck.id}`}
                  className="
                    mt-4 inline-flex w-full sm:w-auto items-center justify-center
                    border border-indigo-600 text-indigo-600 px-4 py-2.5 rounded-xl
                    font-semibold hover:bg-indigo-50 text-sm
                    active:scale-[0.99] transition
                  "
                >
                  View Truck Details
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
