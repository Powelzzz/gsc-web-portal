"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

/* -----------------------------------------------
   FORMAT CONTACT NUMBER →  +63 9123456789
------------------------------------------------ */
function formatContact(num: string) {
  if (!num) return "";

  // remove all non-digits
  let digits = num.replace(/\D/g, "");

  // remove existing prefix "63"
  if (digits.startsWith("63")) {
    digits = digits.substring(2);
  }

  return `+63 ${digits}`;
}

export default function DriverListPage() {
  const router = useRouter();

  const [drivers, setDrivers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  // ⭐ Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 5;

  // Fetch drivers
  const loadDrivers = async () => {
    try {
      const res = await api.get("/admin/drivers"); // correct endpoint
      const sorted = res.data.sort((a: any, b: any) => b.id - a.id);
      setDrivers(sorted);
    } catch (err) {
      setError("Failed to load drivers.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, []);

  // Filtering
  const filteredDrivers = drivers.filter((d) =>
    `${d.firstName} ${d.lastName} ${d.username}`
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredDrivers.length / itemsPerPage);
  const paginatedDrivers = filteredDrivers.slice(
    (page - 1) * itemsPerPage,
    page * itemsPerPage
  );

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow border">

      {/* HEADER */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Drivers</h1>
          <p className="text-gray-500 text-sm">Manage your driver accounts</p>
        </div>

        <Link
          href="/admin/drivers/create"
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow"
        >
          + Add New Driver
        </Link>
      </div>

      {/* ERROR */}
      {error && (
        <div className="p-3 mb-4 text-sm bg-red-100 text-red-700 border border-red-300 rounded">
          {error}
        </div>
      )}

      {/* SEARCH */}
      <input
        type="text"
        placeholder="Search by name or username..."
        className="
          w-full border border-gray-300 rounded-lg p-3 mb-6 
          focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
          text-gray-700 shadow-sm transition
        "
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />

      {/* LOADING */}
      {loading && (
        <div className="text-center py-10 text-gray-500 font-medium">
          Loading drivers...
        </div>
      )}

      {/* EMPTY */}
      {!loading && filteredDrivers.length === 0 && (
        <div className="text-center py-10 text-gray-400 text-lg font-medium">
          No drivers found.
        </div>
      )}

      {/* DRIVER LIST */}
      <div className="space-y-4">
        {paginatedDrivers.map((driver: any) => (
          <div
            key={driver.id}
            className="border rounded-xl p-5 bg-gray-50 hover:bg-gray-100 
                       transition shadow-sm cursor-pointer"
            onClick={() => router.push(`/admin/drivers/${driver.id}`)}
          >
            <p className="text-xs text-gray-500 text-right -mt-1 mb-1">
              Click to view & manage
            </p>

            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              {driver.firstName} {driver.lastName}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Detail label="Username" value={driver.username} />

              {driver.email && <Detail label="Email" value={driver.email} />}

              {driver.contactNumber && (
                <Detail
                  label="Contact"
                  value={formatContact(driver.contactNumber)}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* PAGINATION */}
      {filteredDrivers.length > 0 && (
        <div className="flex justify-center items-center gap-3 mt-8">

          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className={`
              px-4 py-2 rounded-lg border text-sm font-medium
              ${page === 1
                ? "text-gray-400 border-gray-200"
                : "text-gray-700 border-gray-300 hover:bg-gray-100"}
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
              ${page === totalPages
                ? "text-gray-400 border-gray-200"
                : "text-gray-700 border-gray-300 hover:bg-gray-100"}
            `}
          >
            Next
          </button>

        </div>
      )}
    </div>
  );
}

// Reusable field display
function Detail({ label, value }: any) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500 font-medium">{label}</span>
      <span className="text-gray-700 font-semibold">{value}</span>
    </div>
  );
}
