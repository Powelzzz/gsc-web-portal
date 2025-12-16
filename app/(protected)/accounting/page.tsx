"use client";

import { useEffect, useState } from "react";
import { hasPermission } from "@/lib/permissions";
import Link from "next/link";

export default function AccountingDashboard() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setHydrated(true);
  }, []);

  // ✅ Prevent hydration mismatch: render a stable skeleton first
  if (!hydrated) {
    return (
      <div className="space-y-8">
        <div>
          <div className="h-8 w-72 bg-gray-200 rounded" />
          <div className="h-4 w-80 bg-gray-100 rounded mt-2" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-6 shadow rounded-xl h-24" />
          <div className="bg-white p-6 shadow rounded-xl h-24" />
          <div className="bg-white p-6 shadow rounded-xl h-24" />
          <div className="bg-white p-6 shadow rounded-xl h-24" />
        </div>

        <div>
          <div className="h-6 w-40 bg-gray-200 rounded mb-3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 shadow rounded-xl h-24" />
            <div className="bg-white p-6 shadow rounded-xl h-24" />
            <div className="bg-white p-6 shadow rounded-xl h-24" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* PAGE TITLE */}
      <div>
        <h1 className="text-3xl font-bold text-gray-800">Accounting Dashboard</h1>
        <p className="text-gray-500">Overview of accounting operations</p>
      </div>

      {/* STATS CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {hasPermission("clients.view") && (
          <div className="bg-white p-6 shadow rounded-xl">
            <p className="text-sm text-gray-500">Total Clients</p>
            <h2 className="text-3xl font-bold mt-2">38</h2>
          </div>
        )}

        {hasPermission("invoices.generate_unpaid") && (
          <div className="bg-white p-6 shadow rounded-xl">
            <p className="text-sm text-gray-500">Unpaid Invoices</p>
            <h2 className="text-3xl font-bold mt-2 text-red-600">12</h2>
          </div>
        )}

        {hasPermission("collections.upload_receipt") && (
          <div className="bg-white p-6 shadow rounded-xl">
            <p className="text-sm text-gray-500">Payments This Month</p>
            <h2 className="text-3xl font-bold mt-2">₱185,500</h2>
          </div>
        )}

        {hasPermission("collections.view_paid_report") && (
          <div className="bg-white p-6 shadow rounded-xl">
            <p className="text-sm text-gray-500">Pending Deposits</p>
            <h2 className="text-3xl font-bold mt-2">3</h2>
          </div>
        )}
      </div>

      {/* QUICK ACTIONS */}
      <div>
        <h3 className="text-xl font-semibold mb-3">Quick Actions</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {hasPermission("clients.update_rates") && (
            <Link
              href="/accounting/rates"
              className="bg-white p-6 shadow rounded-xl hover:bg-gray-50 transition"
            >
              <h4 className="text-lg font-semibold">Encode Rates per Client</h4>
              <p className="text-gray-500 text-sm">Add or update client service rates.</p>
            </Link>
          )}

          {hasPermission("invoices.create") && (
            <Link
              href="/accounting/billing/generate"
              className="bg-white p-6 shadow rounded-xl hover:bg-gray-50 transition"
            >
              <h4 className="text-lg font-semibold">Generate Billing / Invoice</h4>
              <p className="text-gray-500 text-sm">Create client billing statements.</p>
            </Link>
          )}

          {hasPermission("invoices.upload_sent") && (
            <Link
              href="/accounting/billing/sent"
              className="bg-white p-6 shadow rounded-xl hover:bg-gray-50 transition"
            >
              <h4 className="text-lg font-semibold">Upload Sent Billing</h4>
              <p className="text-gray-500 text-sm">Upload proof of sending billing to clients.</p>
            </Link>
          )}

          {hasPermission("collections.upload_receipt") && (
            <Link
              href="/accounting/payments/encode"
              className="bg-white p-6 shadow rounded-xl hover:bg-gray-50 transition"
            >
              <h4 className="text-lg font-semibold">Encode Received Payments</h4>
              <p className="text-gray-500 text-sm">Record payments received.</p>
            </Link>
          )}

          {hasPermission("collections.view_paid_report") && (
            <Link
              href="/accounting/payments/collected"
              className="bg-white p-6 shadow rounded-xl hover:bg-gray-50 transition"
            >
              <h4 className="text-lg font-semibold">Payment Collection Report</h4>
              <p className="text-gray-500 text-sm">View all client payments.</p>
            </Link>
          )}

          {hasPermission("reports.ar_unpaid_accounts") && (
            <Link
              href="/accounting/reports/unpaid-billing"
              className="bg-white p-6 shadow rounded-xl hover:bg-gray-50 transition"
            >
              <h4 className="text-lg font-semibold">Unpaid Billing Report</h4>
              <p className="text-gray-500 text-sm">Monitor outstanding accounts.</p>
            </Link>
          )}

          {hasPermission("reports.soa") && (
            <Link
              href="/accounting/reports/soa"
              className="bg-white p-6 shadow rounded-xl hover:bg-gray-50 transition"
            >
              <h4 className="text-lg font-semibold">Statement of Accounts</h4>
              <p className="text-gray-500 text-sm">Generate SOA per client.</p>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
