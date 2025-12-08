"use client";

import { useState, useEffect } from "react";
import adminApi from "@/lib/adminApi";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface StaffUser {
  id: number;
  username: string;
  firstName: string;
  email: string | null;
  roleName: string;
}

export default function AccountingStaffList() {
  const router = useRouter();

  const [staff, setStaff] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Pagination
  const pageSize = 5;
  const [page, setPage] = useState(1);

  /* -----------------------------------------
     Load staff from backend
     GET /admin/accounting/users?s=keyword
  ----------------------------------------- */
  const loadStaff = async () => {
    try {
      const res = await adminApi.get("/admin/accounting/users", {
        params: { s: search }
      });

      setStaff(res.data);
    } catch (err) {
      console.error("Failed to load staff", err);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadStaff();
  }, [search]);

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
          className="inline-flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-indigo-700 shadow"
        >
          <span className="text-base leading-none">+</span>
          <span>Add New Staff</span>
        </Link>
      </div>

      {/* SEARCH */}
      <div className="mb-5">
        <input
          type="text"
          placeholder="Search staff..."
          className="w-full p-3 border rounded-lg bg-gray-50 focus:ring-2 focus:ring-indigo-500 outline-none"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* LOADING */}
      {loading && <p className="text-center py-10 text-gray-500">Loading...</p>}

      {/* EMPTY */}
      {!loading && staff.length === 0 && (
        <p className="text-center py-10 text-gray-400">No staff found.</p>
      )}

      {/* LIST */}
      <div className="space-y-4">
        {paginated.map((s) => (
          <div
            key={s.id}
            className="border rounded-xl p-5 bg-gray-50 hover:bg-gray-100 transition shadow-sm cursor-pointer"
            onClick={() => router.push(`/admin/accounting/${s.id}`)}
          >
            <p className="text-xs text-gray-500 text-right -mt-1 mb-1">
              Click to view & manage
            </p>

            <h2 className="text-xl font-semibold text-gray-800 mb-3">
              {s.firstName} ({s.username})
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Detail label="Username" value={s.username} />
              <Detail label="Email" value={s.email ?? "N/A"} />
              <Detail label="Role" value={s.roleName} />
            </div>
          </div>
        ))}
      </div>

      {/* PAGINATION */}
      {!loading && totalPages > 1 && (
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

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="font-semibold text-gray-800">{value}</span>
    </div>
  );
}
