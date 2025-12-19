"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
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
  X,
  Sun,
  Moon,
} from "lucide-react";

export default function AccountingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(true); // desktop collapse
  const [mobileOpen, setMobileOpen] = useState(false); // mobile drawer

  // lock body scroll when mobile drawer open
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  // close drawer on ESC
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* DESKTOP SIDEBAR ONLY */}
      <div className="hidden md:block">
        <AccountingSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
      </div>

      {/* MOBILE TOP NAVBAR */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur border-b">
        <div className="h-14 px-4 flex items-center justify-between">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg hover:bg-gray-100 active:scale-95 transition"
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>

          <div className="flex items-center gap-2">
              <Image
                src="/z2alogo.png"        // put your logo in /public
                alt="Accounting Logo"
                width={60}
                height={60}
                priority
              />
              <span className="sr-only">Accounting Portal</span>
            </div>
          <div className="w-10" />
        </div>
      </div>

      {/* MOBILE DRAWER + OVERLAY */}
      <div
        className={`md:hidden fixed inset-0 z-50 ${
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!mobileOpen}
      >
        {/* overlay */}
        <div
          className={`absolute inset-0 bg-black/40 transition-opacity duration-300 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
          onClick={() => setMobileOpen(false)}
        />

        {/* drawer */}
        <div
          className={`
            absolute inset-y-0 left-0 w-[88%] max-w-[340px] bg-white border-r shadow-2xl
            transform transition-transform duration-300 ease-out
            ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          `}
          role="dialog"
          aria-modal="true"
        >
          {/* top bar with close */}
          <div className="h-14 px-4 flex items-center justify-between border-b bg-white">
            <span className="text-sm font-semibold text-gray-800">Menu</span>
            <button
              onClick={() => setMobileOpen(false)}
              className="p-2 rounded-lg hover:bg-gray-100 active:scale-95 transition"
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* content */}
          <div className="h-[calc(100%-3.5rem)]">
            <AccountingSidebarContent
              open={true}
              variant="mobile"
              onNavigate={() => setMobileOpen(false)}
            />
          </div>
        </div>
      </div>

      {/* MAIN */}
      <main
        className={`
          min-h-screen w-full overflow-y-auto
          pt-14 md:pt-0
          p-4 md:p-6
          transition-[margin] duration-300
          ${sidebarOpen ? "md:ml-64" : "md:ml-20"}
        `}
      >
        {children}
      </main>
    </div>
  );
}

/* ============================================================= */
/*                   DESKTOP SIDEBAR WRAPPER                      */
/* ============================================================= */

function AccountingSidebar({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: (v: boolean) => void;
}) {
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => setHydrated(true), []);

  if (!hydrated) return <aside className="w-20 h-screen bg-white border-r" />;

  return (
    <aside
      className={`
        bg-white shadow-lg h-screen border-r
        fixed top-0 left-0 z-40
        overflow-hidden
        transition-[width] duration-300 ease-out
        ${open ? "w-64" : "w-20"}
      `}
    >
      <div className="h-full p-4 flex flex-col">
        <button
          onClick={() => setOpen(!open)}
          className="mb-4 p-2 w-fit rounded-lg text-gray-600 hover:text-black hover:bg-gray-100 active:scale-95 transition"
          aria-label="Toggle sidebar"
        >
          <Menu size={22} />
        </button>

        <AccountingSidebarContent open={open} variant="desktop" />
      </div>
    </aside>
  );
}

/* ============================================================= */
/*                   SIDEBAR CONTENT (REUSED)                     */
/* ============================================================= */

function AccountingSidebarContent({
  open,
  variant,
  onNavigate,
}: {
  open: boolean;
  variant: "desktop" | "mobile";
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [isMessenger, setIsMessenger] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setFirstName(localStorage.getItem("gc_user_firstname") ?? "");
    setLastName(localStorage.getItem("gc_user_lastname") ?? "");

    const messengerCheck =
      hasPermission("invoices.upload_sent") &&
      !hasPermission("clients.update_rates");

    setIsMessenger(messengerCheck);
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  const fullName = `${firstName} ${lastName}`.trim() || "User";

  const handleLogout = () => {
    localStorage.clear();
    document.cookie = "gc_token=; path=/; max-age=0";
    document.cookie = "gc_user_role=; path=/; max-age=0";
    window.location.href = "/login";
  };

  /* ======================= */
/* MOBILE ARRANGEMENT ONLY */
/* ======================= */
if (variant === "mobile") {
  return (
    <div className="h-full flex flex-col">
      {/* PROFILE HEADER (like screenshot) */}
      <div className="px-4 pt-4 pb-4 border-b">
        <div className="flex items-center gap-3">
          <img
            src="/avatar.png"
            alt="Profile"
            className="w-12 h-12 rounded-full border bg-white"
          />
          <div className="min-w-0">
            <div className="text-2xl font-semibold text-gray-900 leading-tight">
              Hello,
            </div>
            <div className="text-sm text-gray-600 truncate">{fullName}</div>
          </div>
        </div>
      </div>

      {/* MENU LIST */}
      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-1">
        <SidebarItem
          open={true}
          href="/accounting"
          icon={<Home size={22} />}
          label="Home"
          active={pathname === "/accounting"}
          onNavigate={onNavigate}
        />

        {/* messenger mode */}
        {isMessenger ? (
          <>
            <SidebarSection open={true} title="Messenger Tasks" />

            <SidebarItem
              open={true}
              href="/accounting/billing/sent"
              icon={<FolderKanban size={22} />}
              label="Upload Sent Billing"
              active={pathname.startsWith("/accounting/billing/sent")}
              onNavigate={onNavigate}
            />

            <SidebarItem
              open={true}
              href="/accounting/payments/encode"
              icon={<DollarSign size={22} />}
              label="Upload Proof of Payment"
              active={pathname.startsWith("/accounting/payments/encode")}
              onNavigate={onNavigate}
            />
          </>
        ) : (
          <>
            {/* RATES */}
            {hasPermission("clients.update_rates") && (
              <>
                <SidebarSection open={true} title="Rates Section" />
                <SidebarItem
                  open={true}
                  href="/accounting/rates"
                  icon={<ClipboardList size={22} />}
                  label="Encode Rates per Client"
                  active={pathname.startsWith("/accounting/rates")}
                  onNavigate={onNavigate}
                />
              </>
            )}

            {/* INVOICES */}
            {(hasPermission("invoices.create") ||
              hasPermission("invoices.upload_sent")) && (
              <>
                <SidebarSection open={true} title="Invoice Section" />

                {hasPermission("invoices.create") && (
                  <SidebarItem
                    open={true}
                    href="/accounting/billing/generate"
                    icon={<FileText size={22} />}
                    label="Generate Billing / Invoice"
                    active={pathname.startsWith("/accounting/billing/generate")}
                    onNavigate={onNavigate}
                  />
                )}

                <SidebarItem
                  open={true}
                  href="/accounting/invoices"
                  icon={<FileBarChart size={22} />}
                  label="Invoice List"
                  active={pathname.startsWith("/accounting/invoices")}
                  onNavigate={onNavigate}
                />
              </>
            )}

            {/* PAYMENTS */}
            {(hasPermission("collections.upload_receipt") ||
              hasPermission("collections.view_paid_report") ||
              hasPermission("collections.view_deposits")) && (
              <>
                <SidebarSection open={true} title="Payments Section" />

                {hasPermission("collections.upload_receipt") && (
                  <SidebarItem
                    open={true}
                    href="/accounting/payments/encode"
                    icon={<DollarSign size={22} />}
                    label="Encode Received Payments"
                    active={pathname.startsWith("/accounting/payments/encode")}
                    onNavigate={onNavigate}
                  />
                )}

                {hasPermission("collections.view_paid_report") && (
                  <SidebarItem
                    open={true}
                    href="/accounting/payments/collected"
                    icon={<BookOpen size={22} />}
                    label="Collected Payments Report"
                    active={pathname.startsWith("/accounting/payments/collected")}
                    onNavigate={onNavigate}
                  />
                )}

                {hasPermission("invoices.upload_sent") && (
                  <SidebarItem
                    open={true}
                    href="/accounting/billing/sent"
                    icon={<FolderKanban size={22} />}
                    label="Upload Sent Billing"
                    active={pathname.startsWith("/accounting/billing/sent")}
                    onNavigate={onNavigate}
                  />
                )}
              </>
            )}

            {/* PAYROLL */}
            {hasPermission("payroll.view_driver") && (
              <>
                <SidebarSection open={true} title="Payroll" />
                <SidebarItem
                  open={true}
                  href="/accounting/driverpayroll"
                  icon={<FileBarChart size={22} />}
                  label="Driver Payroll"
                  active={pathname.startsWith("/accounting/driverpayroll")}
                  onNavigate={onNavigate}
                />
              </>
            )}

            {/* REPORTS */}
            {(hasPermission("reports.ar_paid_accounts") ||
              hasPermission("reports.ar_unpaid_accounts") ||
              hasPermission("reports.soa")) && (
              <>
                <SidebarSection open={true} title="Reports" />

                {hasPermission("reports.ar_unpaid_accounts") && (
                  <SidebarItem
                    open={true}
                    href="/accounting/reports/unpaid-billing"
                    icon={<FileBarChart size={22} />}
                    label="Unpaid Billing Reports"
                    active={pathname.startsWith("/accounting/reports/unpaid-billing")}
                    onNavigate={onNavigate}
                  />
                )}

                {/* SOA */}
                {hasPermission("reports.soa") && (
                  <>
                    <SidebarSection open={true} title="Statement Of Accounts" />
                    <SidebarItem
                      open={true}
                      href="/accounting/reports/soa"
                      icon={<FileBarChart size={22} />}
                      label="Statement of Accounts"
                      active={pathname.startsWith("/accounting/reports/soa")}
                      onNavigate={onNavigate}
                    />
                  </>
                )}
              </>
            )}
          </>
        )}
      </nav>

      {/* LOGOUT pinned bottom */}
      <div className="border-t px-4 py-4">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-gray-900 hover:bg-gray-50 transition"
        >
          <LogOut size={22} className="shrink-0" />
          <span className="text-sm font-medium">Logout</span>
        </button>
      </div>
    </div>
  );
}

  /* ======================= */
  /* DESKTOP (your old style) */
  /* ======================= */
  return (
    <div className="h-full flex flex-col">
      {/* PROFILE */}
      <div className="flex items-center gap-3 px-1 pb-4 border-b">
        <img
          src="/avatar.png"
          alt="Profile"
          className="w-10 h-10 rounded-full border bg-white"
        />

        {open && (
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold text-gray-900 truncate">
              {fullName}
            </div>

            <button
              onClick={handleLogout}
              className="mt-1 inline-flex items-center gap-1 text-xs text-red-600 hover:underline"
            >
              <LogOut size={14} /> Logout
            </button>
          </div>
        )}
      </div>

      {/* MENU */}
      <nav className="mt-3 flex-1 overflow-y-auto pr-1 space-y-1">
        <SidebarItem
          open={open}
          href="/accounting"
          icon={<Home size={20} />}
          label="Dashboard"
          active={pathname === "/accounting"}
          onNavigate={onNavigate}
        />

        {isMessenger ? (
          <>
            <SidebarSection open={open} title="Messenger" />

            <SidebarItem
              open={open}
              href="/accounting/billing/sent"
              icon={<FolderKanban size={20} />}
              label="Upload Sent Billing"
              active={pathname.startsWith("/accounting/billing/sent")}
              onNavigate={onNavigate}
            />

            <SidebarItem
              open={open}
              href="/accounting/payments/encode"
              icon={<DollarSign size={20} />}
              label="Upload Proof of Payment"
              active={pathname.startsWith("/accounting/payments/encode")}
              onNavigate={onNavigate}
            />
          </>
        ) : (
          <>
            {hasPermission("clients.update_rates") && (
              <>
                <SidebarSection open={open} title="Rates" />
                <SidebarItem
                  open={open}
                  href="/accounting/rates"
                  icon={<ClipboardList size={20} />}
                  label="Encode Rates per Client"
                  active={pathname.startsWith("/accounting/rates")}
                  onNavigate={onNavigate}
                />
              </>
            )}

            {(hasPermission("invoices.create") ||
              hasPermission("invoices.upload_sent")) && (
              <>
                <SidebarSection open={open} title="Invoices" />

                {hasPermission("invoices.create") && (
                  <SidebarItem
                    open={open}
                    href="/accounting/billing/generate"
                    icon={<FileText size={20} />}
                    label="Generate Billing / Invoice"
                    active={pathname.startsWith("/accounting/billing/generate")}
                    onNavigate={onNavigate}
                  />
                )}

                <SidebarItem
                  open={open}
                  href="/accounting/invoices"
                  icon={<FileBarChart size={20} />}
                  label="Invoice List"
                  active={pathname.startsWith("/accounting/invoices")}
                  onNavigate={onNavigate}
                />
              </>
            )}

            {(hasPermission("collections.upload_receipt") ||
              hasPermission("collections.view_paid_report") ||
              hasPermission("collections.view_deposits")) && (
              <>
                <SidebarSection open={open} title="Payments" />

                {hasPermission("collections.upload_receipt") && (
                  <SidebarItem
                    open={open}
                    href="/accounting/payments/encode"
                    icon={<DollarSign size={20} />}
                    label="Encode Received Payments"
                    active={pathname.startsWith("/accounting/payments/encode")}
                    onNavigate={onNavigate}
                  />
                )}

                {hasPermission("collections.view_paid_report") && (
                  <SidebarItem
                    open={open}
                    href="/accounting/payments/collected"
                    icon={<BookOpen size={20} />}
                    label="Collected Payments Report"
                    active={pathname.startsWith("/accounting/payments/collected")}
                    onNavigate={onNavigate}
                  />
                )}

                {hasPermission("invoices.upload_sent") && (
                  <SidebarItem
                    open={open}
                    href="/accounting/billing/sent"
                    icon={<FolderKanban size={20} />}
                    label="Upload Sent Billing"
                    active={pathname.startsWith("/accounting/billing/sent")}
                    onNavigate={onNavigate}
                  />
                )}
              </>
            )}

            {hasPermission("payroll.view_driver") && (
              <>
                <SidebarSection open={open} title="Payroll" />
                <SidebarItem
                  open={open}
                  href="/accounting/driverpayroll"
                  icon={<FileBarChart size={20} />}
                  label="Driver Payroll"
                  active={pathname.startsWith("/accounting/driverpayroll")}
                  onNavigate={onNavigate}
                />
              </>
            )}

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
                    active={pathname.startsWith("/accounting/reports/unpaid-billing")}
                    onNavigate={onNavigate}
                  />
                )}

                <SidebarSection open={open} title="Statement of Accounts" />

                {hasPermission("reports.soa") && (
                  <SidebarItem
                    open={open}
                    href="/accounting/reports/soa"
                    icon={<FileBarChart size={20} />}
                    label="Statement of Accounts"
                    active={pathname.startsWith("/accounting/reports/soa")}
                    onNavigate={onNavigate}
                  />
                )}
              </>
            )}
          </>
        )}
      </nav>
    </div>
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
  active,
  onNavigate,
}: {
  open: boolean;
  href: string;
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={() => onNavigate?.()}
      className={`
        group relative flex items-center gap-3 rounded-xl px-3 py-3
        transition-all duration-200
        ${active ? "bg-gray-100 text-gray-900" : "text-gray-700 hover:bg-gray-50"}
      `}
    >
      {/* active left accent */}
      <span
        className={`
          absolute left-0 top-1/2 -translate-y-1/2 h-7 w-1 rounded-r
          transition-opacity duration-200
          ${active ? "opacity-100 bg-blue-600" : "opacity-0 bg-blue-600 group-hover:opacity-30"}
        `}
      />

      <span
        className={`
          transition-transform duration-200
          ${active ? "scale-105" : "group-hover:scale-105"}
        `}
      >
        {icon}
      </span>

      {!open ? (
        <span
          className="
            absolute left-14 top-1/2 -translate-y-1/2
            hidden group-hover:block
            whitespace-nowrap rounded-lg border bg-white px-2 py-1 text-xs text-gray-700 shadow
          "
        >
          {label}
        </span>
      ) : (
        <span className="text-sm font-medium truncate">{label}</span>
      )}

      {open && active && (
        <span className="ml-auto text-[10px] px-2 py-1 rounded-full bg-blue-50 text-blue-700 font-semibold">
          Active
        </span>
      )}
    </Link>
  );
}

function SidebarSection({ open, title }: { open: boolean; title: string }) {
  if (!open) return <div className="my-2" />;
  return (
    <h2 className="text-[10px] tracking-wider font-semibold text-gray-400 uppercase mt-4 mb-1 px-3">
      {title}
    </h2>
  );
}


