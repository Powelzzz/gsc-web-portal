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
        params: { s: search },
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
    <div className="px-3 sm:px-4 md:px-0 py-3 sm:py-4">
      <div className="max-w-4xl mx-auto bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow border">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Accounting Staff
            </h1>
            <p className="text-gray-500 text-sm">
              Manage accounting user accounts
            </p>
          </div>

          <Link
            href="/admin/accounting/create"
            className="
              w-full sm:w-auto inline-flex items-center justify-center gap-2
              bg-indigo-600 text-white px-5 py-3 sm:py-2.5
              rounded-xl text-sm font-semibold hover:bg-indigo-700
              shadow active:scale-[0.99] transition
            "
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
            className="
              w-full p-3 border border-gray-300 rounded-xl bg-gray-50
              focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
              outline-none text-sm text-gray-700 shadow-sm transition
            "
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* LOADING */}
        {loading && (
          <div className="text-center py-10 text-gray-500 font-medium">
            Loading...
          </div>
        )}

        {/* EMPTY */}
        {!loading && staff.length === 0 && (
          <div className="text-center py-10 text-gray-400 font-medium">
            No staff found.
          </div>
        )}

        {/* LIST */}
        <div className="space-y-4">
          {paginated.map((s) => (
            <div
              key={s.id}
              className="
                border rounded-xl p-4 sm:p-5 bg-gray-50 hover:bg-gray-100
                transition shadow-sm cursor-pointer
              "
              onClick={() => router.push(`/admin/accounting/${s.id}`)}
            >
              <p className="text-xs text-gray-500 text-right -mt-1 mb-1">
                Click to view &amp; manage
              </p>

              <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-3">
                {s.firstName} <span className="text-gray-500">({s.username})</span>
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
        {staff.length > 0 && totalPages > 1 && (
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
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col min-w-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className="font-semibold text-gray-800 text-sm truncate">
        {value}
      </span>
    </div>
  );
}
