"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { hasPermission } from "@/lib/permissions";

import {
  Menu,
  Home,
  FileText,
  FolderKanban,
  DollarSign,
  BookOpen,
  ClipboardList,
  FileBarChart,
  LogOut,
} from "lucide-react";

export default function AccountingLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex">
      <AccountingSidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <main
        className={`
          min-h-screen w-full p-6 bg-gray-50 overflow-y-auto transition-all duration-300
          ${sidebarOpen ? "ml-64" : "ml-20"}
        `}
      >
        {children}
      </main>
    </div>
  );
}

/* ============================================================= */
/*                   ACCOUNTING SIDEBAR                          */
/* ============================================================= */

function AccountingSidebar({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  const [hydrated, setHydrated] = useState(false);
  const [isMessenger, setIsMessenger] = useState(false);

  /* ────────────────────────────────────────────── */
  /* HYDRATION FIX — LOAD AFTER CLIENT MOUNT        */
  /* ────────────────────────────────────────────── */
  useEffect(() => {
    setFirstName(localStorage.getItem("gc_user_firstname") ?? "");
    setLastName(localStorage.getItem("gc_user_lastname") ?? "");

    const messengerCheck =
      hasPermission("invoices.upload_sent") &&
      !hasPermission("clients.update_rates");

    setIsMessenger(messengerCheck);

    setHydrated(true);
  }, []);

  /* ────────────────────────────────────────────── */
  /* PREVENT SSR MISMATCH                          */
  /* ────────────────────────────────────────────── */
  if (!hydrated) {
    return <aside className="w-20 h-screen bg-white border-r" />;
  }

  const handleLogout = () => {
    localStorage.clear();
    document.cookie = "gc_token=; path=/; max-age=0";
    document.cookie = "gc_user_role=; path=/; max-age=0";
    window.location.href = "/login";
  };

  /* ============================================================= */
  /*                        MESSENGER SIDEBAR                      */
  /* ============================================================= */

  if (isMessenger) {
    return (
      <aside
        className={`
          bg-white shadow-lg h-screen p-4 transition-all duration-300 border-r
          fixed top-0 left-0 overflow-y-auto z-50
          ${open ? "w-64" : "w-20"}
        `}
      >
        <button
          onClick={() => setOpen(!open)}
          className="mb-6 text-gray-600 hover:text-black transition"
        >
          <Menu size={22} />
        </button>

        <div className="flex items-center gap-3 mb-8">
          <img src="/avatar.png" alt="Profile" className="w-10 h-10 rounded-full border" />
          {open && (
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-gray-800">
                {firstName} {lastName}
              </span>
              <button
                onClick={handleLogout}
                className="flex items-center gap-1 text-xs text-red-500 hover:underline"
              >
                <LogOut size={14} /> Logout
              </button>
            </div>
          )}
        </div>

        <nav className="space-y-1">
          <SidebarItem open={open} href="/accounting" icon={<Home size={20} />} label="Dashboard" />

          <SidebarSection open={open} title="Messenger Tasks" />

          <SidebarItem
            open={open}
            href="/accounting/billing/sent"
            icon={<FolderKanban size={20} />}
            label="Upload Sent Billing"
          />

          <SidebarItem
            open={open}
            href="/accounting/payments/encode"
            icon={<DollarSign size={20} />}
            label="Upload Proof of Payment"
          />
        </nav>
      </aside>
    );
  }

  /* ============================================================= */
  /*                FULL ACCOUNTING SIDEBAR (AR/AP/ADMIN)          */
  /* ============================================================= */

  return (
    <aside
      className={`
        bg-white shadow-lg h-screen p-4 transition-all duration-300 border-r
        fixed top-0 left-0 overflow-y-auto z-50
        ${open ? "w-64" : "w-20"}
      `}
    >
      <button
        onClick={() => setOpen(!open)}
        className="mb-6 text-gray-600 hover:text-black transition"
      >
        <Menu size={22} />
      </button>

      <div className="flex items-center gap-3 mb-8">
        <img src="/avatar.png" alt="Profile" className="w-10 h-10 rounded-full border" />
        {open && (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-800">
              {firstName} {lastName}
            </span>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1 text-xs text-red-500 hover:underline"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        )}
      </div>

      <nav className="space-y-1">
        <SidebarItem open={open} href="/accounting" icon={<Home size={20} />} label="Dashboard" />

        {/* RATES */}
        {hasPermission("clients.update_rates") && (
          <>
            <SidebarSection open={open} title="Rates Section" />
            <SidebarItem
              open={open}
              href="/accounting/rates"
              icon={<ClipboardList size={20} />}
              label="Encode Rates per Client"
            />
          </>
        )}

        {/* BILLING */}
        {(hasPermission("invoices.create") || hasPermission("invoices.upload_sent")) && (
          <>
            <SidebarSection open={open} title="Invoice Section" />

            {hasPermission("invoices.create") && (
              <SidebarItem
                open={open}
                href="/accounting/billing/generate"
                icon={<FileText size={20} />}
                label="Generate Billing / Invoice"
              />
            )}

            {/* NEW: Invoice List */}
            <SidebarItem
              open={open}
              href="/accounting/invoices"
              icon={<FileBarChart size={20} />}
              label="Invoice List"
            />

          </>
        )}

        {/* PAYMENTS */}
        {(hasPermission("collections.upload_receipt") ||
          hasPermission("collections.view_paid_report") ||
          hasPermission("collections.view_deposits")) && (
          <>
            <SidebarSection open={open} title="Payments Section" />

            {hasPermission("collections.upload_receipt") && (
              <SidebarItem
                open={open}
                href="/accounting/payments/encode"
                icon={<DollarSign size={20} />}
                label="Encode Received Payments"
              />
            )}

            {hasPermission("collections.view_paid_report") && (
              <SidebarItem
                open={open}
                href="/accounting/payments/collected"
                icon={<BookOpen size={20} />}
                label="Collected Payments Report"
              />
            )}

            {hasPermission("invoices.upload_sent") && (
              <SidebarItem
              open={open}
              href="/accounting/billing/sent"
              icon={<FolderKanban size={20} />}
              label="Upload Sent Billing"
            />
            )}
          </>
        )}

        {/* DRIVER PAYROLL */}
        {hasPermission("payroll.view_driver") && (
          <>
            <SidebarSection open={open} title="Payroll" />

            <SidebarItem
              open={open}
              href="/accounting/driverpayroll"
              icon={<FileBarChart size={20} />}
              label="Driver Payroll"
            />
          </>
        )}


        {/* REPORTS */}
        {(hasPermission("reports.ar_paid_accounts") ||
          hasPermission("reports.ar_unpaid_accounts") ||
          hasPermission("reports.soa")) && (
          <>
            <SidebarSection open={open} title="Reports" />

            {hasPermission("reports.ar_unpaid_accounts") && (
              <SidebarItem
                open={open}
                href="/accounting/reports/unpaid-billing"
                icon={<FileBarChart size={20} />}
                label="Unpaid Billing Reports"
              />
            )}

            <SidebarSection open={open} title="Statement Of Accounts" />

            {hasPermission("reports.soa") && (
              <SidebarItem
                open={open}
                href="/accounting/reports/soa"
                icon={<FileBarChart size={20} />}
                label="Statement of Accounts"
              />
            )}
          </>
        )}
      </nav>
    </aside>
  );
}

/* ============================================================= */
/*                SHARED COMPONENTS                              */
/* ============================================================= */

function SidebarItem({
  open,
  href,
  icon,
  label,
}: {
  open: boolean;
  href: string;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 p-2 rounded-md hover:bg-gray-100 transition text-gray-700"
    >
      <span>{icon}</span>
      {open && <span className="text-sm font-medium">{label}</span>}
    </Link>
  );
}

function SidebarSection({ open, title }: { open: boolean; title: string }) {
  if (!open) return <div className="my-2"></div>;
  return (
    <h2 className="text-xs font-semibold text-gray-400 uppercase mt-4 mb-1">
      {title}
    </h2>
  );
}
