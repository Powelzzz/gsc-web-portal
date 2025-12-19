"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { hasPermission } from "@/lib/permissions";
import {
  Users,
  FileText,
  CreditCard,
  Banknote,
  ClipboardList,
  FileBarChart,
  ArrowRight,
} from "lucide-react";

type StatCard = {
  key: string;
  title: string;
  value: string;
  accent?: "neutral" | "red" | "green" | "blue";
  icon: React.ReactNode;
  show: boolean;
};

type QuickAction = {
  key: string;
  href: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
  show: boolean;
};

export default function AccountingDashboard() {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  const stats = useMemo<StatCard[]>(
    () => [
      {
        key: "clients",
        title: "Total Clients",
        value: "38",
        accent: "neutral",
        icon: <Users size={18} />,
        show: hasPermission("clients.view"),
      },
      {
        key: "unpaid",
        title: "Unpaid Invoices",
        value: "12",
        accent: "red",
        icon: <FileText size={18} />,
        show: hasPermission("invoices.generate_unpaid"),
      },
      {
        key: "payments",
        title: "Payments This Month",
        value: "₱185,500",
        accent: "green",
        icon: <CreditCard size={18} />,
        show: hasPermission("collections.upload_receipt"),
      },
      {
        key: "deposits",
        title: "Pending Deposits",
        value: "3",
        accent: "blue",
        icon: <Banknote size={18} />,
        show: hasPermission("collections.view_paid_report"),
      },
    ],
    []
  );

  const actions = useMemo<QuickAction[]>(
    () => [
      {
        key: "rates",
        href: "/accounting/rates",
        title: "Encode Rates per Client",
        desc: "Add or update client service rates.",
        icon: <ClipboardList size={18} />,
        show: hasPermission("clients.update_rates"),
      },
      {
        key: "gen",
        href: "/accounting/billing/generate",
        title: "Generate Billing / Invoice",
        desc: "Create client billing statements.",
        icon: <FileText size={18} />,
        show: hasPermission("invoices.create"),
      },
      {
        key: "sent",
        href: "/accounting/billing/sent",
        title: "Upload Sent Billing",
        desc: "Upload proof of sending billing to clients.",
        icon: <FileBarChart size={18} />,
        show: hasPermission("invoices.upload_sent"),
      },
      {
        key: "encode-payments",
        href: "/accounting/payments/encode",
        title: "Encode Received Payments",
        desc: "Record payments received.",
        icon: <CreditCard size={18} />,
        show: hasPermission("collections.upload_receipt"),
      },
      {
        key: "collected",
        href: "/accounting/payments/collected",
        title: "Payment Collection Report",
        desc: "View all client payments.",
        icon: <FileBarChart size={18} />,
        show: hasPermission("collections.view_paid_report"),
      },
      {
        key: "unpaid-report",
        href: "/accounting/reports/unpaid-billing",
        title: "Unpaid Billing Report",
        desc: "Monitor outstanding accounts.",
        icon: <FileBarChart size={18} />,
        show: hasPermission("reports.ar_unpaid_accounts"),
      },
      {
        key: "soa",
        href: "/accounting/reports/soa",
        title: "Statement of Accounts",
        desc: "Generate SOA per client.",
        icon: <FileBarChart size={18} />,
        show: hasPermission("reports.soa"),
      },
    ],
    []
  );

  const visibleStats = stats.filter((s) => s.show);
  const visibleActions = actions.filter((a) => a.show);

  if (!hydrated) {
    return (
      <div className="space-y-6 pt-3 sm:pt-4">
        <div className="space-y-2">
          <div className="h-8 w-56 bg-gray-200 rounded" />
          <div className="h-4 w-72 bg-gray-100 rounded" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="bg-white border rounded-2xl p-4 h-[92px]" />
          ))}
        </div>

        <div className="space-y-3">
          <div className="h-6 w-40 bg-gray-200 rounded" />
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="bg-white border rounded-2xl p-5 h-[110px]" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    // ✅ push content down a bit so it doesn’t feel stuck to the mobile navbar
    <div className="space-y-6 sm:space-y-8 pt-3 sm:pt-4">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Accounting Dashboard
          </h1>
          <p className="text-sm sm:text-base text-gray-500">
            Overview of accounting operations
          </p>
        </div>

        <div className="text-xs text-gray-400">
          {new Date().toLocaleDateString()}
        </div>
      </div>

      {/* STATS */}
      {visibleStats.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {visibleStats.map(({ key, show: _show, ...cardProps }) => (
            // ✅ key passed directly, not inside spread
            <StatCardView key={key} {...cardProps} />
          ))}
        </div>
      )}

      {/* QUICK ACTIONS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-lg sm:text-xl font-semibold text-gray-900">
            Quick Actions
          </h3>
          <span className="text-xs text-gray-400">
            {visibleActions.length} available
          </span>
        </div>

        {visibleActions.length === 0 ? (
          <div className="bg-white border rounded-2xl p-6 text-sm text-gray-500">
            No actions available for your role.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
            {visibleActions.map(({ key, show: _show, ...actionProps }) => (
              <ActionCard key={key} {...actionProps} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ============================ */
/*            UI                */
/* ============================ */

function StatCardView({
  title,
  value,
  accent = "neutral",
  icon,
}: {
  title: string;
  value: string;
  accent?: "neutral" | "red" | "green" | "blue";
  icon: React.ReactNode;
}) {
  const accentClasses =
    accent === "red"
      ? "bg-red-50 text-red-700 border-red-100"
      : accent === "green"
      ? "bg-green-50 text-green-700 border-green-100"
      : accent === "blue"
      ? "bg-blue-50 text-blue-700 border-blue-100"
      : "bg-gray-50 text-gray-700 border-gray-100";

  return (
    <div className="bg-white border rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow transition">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-xs sm:text-sm text-gray-500">{title}</p>

          {/* ✅ FIXED VALUE */}
          <h2
            className="
              mt-2 font-bold text-gray-900 tabular-nums
              text-lg sm:text-xl md:text-2xl
              break-all sm:break-normal
              leading-tight
            "
          >
            {value}
          </h2>
        </div>

        <div
          className={`shrink-0 inline-flex items-center justify-center h-9 w-9 rounded-xl border ${accentClasses}`}
        >
          {icon}
        </div>
      </div>
    </div>
  );
}

function ActionCard({
  href,
  title,
  desc,
  icon,
}: {
  href: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="
        group bg-white border rounded-2xl p-5
        shadow-sm hover:shadow-md transition
        active:scale-[0.99]
        focus:outline-none focus:ring-2 focus:ring-blue-500
      "
    >
      <div className="flex items-start gap-3">
        <div className="shrink-0 h-10 w-10 rounded-xl bg-gray-50 border flex items-center justify-center text-gray-700">
          {icon}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h4 className="text-sm sm:text-base font-semibold text-gray-900 leading-snug">
              {title}
            </h4>

            <span className="shrink-0 text-gray-400 group-hover:text-gray-700 transition">
              <ArrowRight size={16} />
            </span>
          </div>

          <p className="mt-1 text-xs sm:text-sm text-gray-500 leading-relaxed">
            {desc}
          </p>
        </div>
      </div>
    </Link>
  );
}
