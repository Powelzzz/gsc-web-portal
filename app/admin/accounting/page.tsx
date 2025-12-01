"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import Link from "next/link";

export default function AccountingStaffList() {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Pagination
  const pageSize = 5;
  const [page, setPage] = useState(1);

  const loadStaff = async () => {
    try {
      const res = await api.get("/admin/accounting");
      setStaff(res.data);
    } catch (err) {
      console.error("Failed to load staff");
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const totalPages = Math.ceil(staff.length / pageSize);
  const paginated = staff.slice((page - 1) * pageSize, page * pageSize);

  return (
    <div className="max-w-4xl mx-auto bg-white p-8 rounded-xl shadow border">

      {/* HEADER */}
      <div className="flex justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Accounting Staff</h1>
          <p className="text-gray-500 text-sm">Manage accounting user accounts</p>
        </div>

        <Link
          href="/admin/accounting/create"
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow"
        >
          + Add Staff
        </Link>
      </div>

      {/* LOADING */}
      {loading && (
        <p className="text-center py-10 text-gray-500">Loading...</p>
      )}

      {/* EMPTY */}
      {!loading && staff.length === 0 && (
        <p className="text-center py-10 text-gray-400">No staff found.</p>
      )}

      {/* LIST */}
      <div className="space-y-4">
        {paginated.map((s) => (
          <div key={s.id} className="p-5 border bg-gray-50 rounded-xl shadow-sm">
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              {s.firstName} {s.lastName}
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Detail label="Username" value={s.username} />
              <Detail label="Email" value={s.email || "N/A"} />
              <Detail label="Role" value={s.role} />
            </div>
          </div>
        ))}
      </div>

      {/* PAGINATION */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-6">
          <button
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            disabled={page === 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </button>

          <span className="text-gray-600 text-sm">
            Page {page} of {totalPages}
          </span>

          <button
            className="px-4 py-2 bg-gray-200 rounded disabled:opacity-50"
            disabled={page === totalPages}
            onClick={() => setPage(page + 1)}
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
      <span className="text-xs text-gray-500">{label}</span>
      <span className="font-semibold text-gray-800">{value}</span>
    </div>
  );
}
