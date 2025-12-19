"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Menu,
  Home,
  Users,
  Truck,
  FolderPlus,
  FileBarChart,
  ClipboardList,
  Wrench,
  LogOut,
  DollarSign,
  X,
} from "lucide-react";

/* ────────────────────────────────────────────── */
/* MAIN LAYOUT WRAPPER (ADMIN)                     */
/* - Desktop: collapsible sidebar                  */
/* - Mobile: top navbar + drawer                   */
/* ────────────────────────────────────────────── */
export default function AdminLayout({ children }: { children: React.ReactNode }) {
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
        <AdminSidebar open={sidebarOpen} setOpen={setSidebarOpen} />
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

          {/* Center logo/title (match your accounting style) */}
          <div className="flex items-center gap-2">
            <Image
              src="/z2alogo.png"
              alt="Admin Logo"
              width={60}
              height={60}
              priority
            />
            <span className="sr-only">Admin Portal</span>
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
            <AdminSidebarContent
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
function AdminSidebar({
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

        <AdminSidebarContent open={open} variant="desktop" />
      </div>
    </aside>
  );
}

/* ============================================================= */
/*                   SIDEBAR CONTENT (REUSED)                     */
/* ============================================================= */
function AdminSidebarContent({
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
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setFirstName(localStorage.getItem("gc_user_firstname") ?? "");
    setLastName(localStorage.getItem("gc_user_lastname") ?? "");
    setHydrated(true);
  }, []);

  if (!hydrated) return null;

  const fullName = `${firstName} ${lastName}`.trim() || "User";

  const handleLogout = () => {
    localStorage.removeItem("gc_token");
    localStorage.removeItem("gc_user_role");
    localStorage.removeItem("gc_user_firstname");
    localStorage.removeItem("gc_user_lastname");
    document.cookie = "gc_token=; path=/; max-age=0";
    window.location.href = "/login";
  };

  /* ======================= */
  /* MOBILE ARRANGEMENT ONLY */
  /* ======================= */
  if (variant === "mobile") {
    return (
      <div className="h-full flex flex-col">
        {/* PROFILE HEADER */}
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
            href="/admin/dashboard"
            icon={<Home size={22} />}
            label="Dashboard"
            active={pathname.startsWith("/admin/dashboard")}
            onNavigate={onNavigate}
          />

          <SidebarSection open={true} title="Trips Overview" />
          <SidebarItem
            open={true}
            href="/admin/tripoverviewlist"
            icon={<ClipboardList size={22} />}
            label="All Trips Overview"
            active={pathname.startsWith("/admin/tripoverviewlist")}
            onNavigate={onNavigate}
          />

          <SidebarSection open={true} title="Clients" />
          <SidebarItem
            open={true}
            href="/admin/clients/create"
            icon={<Users size={22} />}
            label="Create New Client"
            active={pathname.startsWith("/admin/clients/create")}
            onNavigate={onNavigate}
          />
          <SidebarItem
            open={true}
            href="/admin/clients"
            icon={<ClipboardList size={22} />}
            label="List of Clients"
            active={
              pathname.startsWith("/admin/clients") &&
              !pathname.startsWith("/admin/clients/create")
            }
            onNavigate={onNavigate}
          />

          <SidebarSection open={true} title="Drivers" />
          <SidebarItem
            open={true}
            href="/admin/drivers/create"
            icon={<Truck size={22} />}
            label="Create New Driver"
            active={pathname.startsWith("/admin/drivers/create")}
            onNavigate={onNavigate}
          />
          <SidebarItem
            open={true}
            href="/admin/drivers"
            icon={<Truck size={22} />}
            label="List of Drivers"
            active={
              pathname.startsWith("/admin/drivers") &&
              !pathname.startsWith("/admin/drivers/create")
            }
            onNavigate={onNavigate}
          />

          <SidebarSection open={true} title="Accounting Staff" />
          <SidebarItem
            open={true}
            href="/admin/accounting/create"
            icon={<Users size={22} />}
            label="Create New Staff"
            active={pathname.startsWith("/admin/accounting/create")}
            onNavigate={onNavigate}
          />
          <SidebarItem
            open={true}
            href="/admin/accounting"
            icon={<ClipboardList size={22} />}
            label="List of Staff"
            active={
              pathname.startsWith("/admin/accounting") &&
              !pathname.startsWith("/admin/accounting/create")
            }
            onNavigate={onNavigate}
          />

          <SidebarSection open={true} title="Hauling" />
          <SidebarItem
            open={true}
            href="/admin/hauling/create"
            icon={<FolderPlus size={22} />}
            label="Create Hauling Trip"
            active={pathname.startsWith("/admin/hauling/create")}
            onNavigate={onNavigate}
          />
          <SidebarItem
            open={true}
            href="/admin/hauling"
            icon={<ClipboardList size={22} />}
            label="All Hauling Trips"
            active={
              pathname.startsWith("/admin/hauling") &&
              !pathname.startsWith("/admin/hauling/create")
            }
            onNavigate={onNavigate}
          />

          <SidebarSection open={true} title="Reports" />
          <SidebarItem
            open={true}
            href="/admin/reports/summary-status"
            icon={<FileBarChart size={22} />}
            label="Hauling Summary Status"
            active={pathname.startsWith("/admin/reports/summary-status")}
            onNavigate={onNavigate}
          />
          <SidebarItem
            open={true}
            href="/admin/reports/summary"
            icon={<FileBarChart size={22} />}
            label="Generate Hauling Summary"
            active={
              pathname.startsWith("/admin/reports/summary") &&
              !pathname.startsWith("/admin/reports/summary-status")
            }
            onNavigate={onNavigate}
          />
          <SidebarItem
            open={true}
            href="/admin/reports/payroll"
            icon={<DollarSign size={22} />}
            label="Drivers Payroll Reports"
            active={pathname.startsWith("/admin/reports/payroll")}
            onNavigate={onNavigate}
          />
          <SidebarItem
            open={true}
            href="/admin/reports/trucks"
            icon={<Wrench size={22} />}
            label="Truck Repairs & PMS"
            active={pathname.startsWith("/admin/reports/trucks")}
            onNavigate={onNavigate}
          />
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
  /* DESKTOP (old style, improved + active) */
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
          href="/admin/dashboard"
          icon={<Home size={20} />}
          label="Dashboard"
          active={pathname.startsWith("/admin/dashboard")}
          onNavigate={onNavigate}
        />

        <SidebarSection open={open} title="Trips Overview" />
        <SidebarItem
          open={open}
          href="/admin/tripoverviewlist"
          icon={<ClipboardList size={20} />}
          label="All Trips Overview"
          active={pathname.startsWith("/admin/tripoverviewlist")}
          onNavigate={onNavigate}
        />

        <SidebarSection open={open} title="Clients" />
        <SidebarItem
          open={open}
          href="/admin/clients/create"
          icon={<Users size={20} />}
          label="Create New Client"
          active={pathname.startsWith("/admin/clients/create")}
          onNavigate={onNavigate}
        />
        <SidebarItem
          open={open}
          href="/admin/clients"
          icon={<ClipboardList size={20} />}
          label="List of Clients"
          active={
            pathname.startsWith("/admin/clients") &&
            !pathname.startsWith("/admin/clients/create")
          }
          onNavigate={onNavigate}
        />

        <SidebarSection open={open} title="Drivers" />
        <SidebarItem
          open={open}
          href="/admin/drivers/create"
          icon={<Truck size={20} />}
          label="Create New Driver"
          active={pathname.startsWith("/admin/drivers/create")}
          onNavigate={onNavigate}
        />
        <SidebarItem
          open={open}
          href="/admin/drivers"
          icon={<Truck size={20} />}
          label="List of Drivers"
          active={
            pathname.startsWith("/admin/drivers") &&
            !pathname.startsWith("/admin/drivers/create")
          }
          onNavigate={onNavigate}
        />

        <SidebarSection open={open} title="Accounting Staff" />
        <SidebarItem
          open={open}
          href="/admin/accounting/create"
          icon={<Users size={20} />}
          label="Create New Staff"
          active={pathname.startsWith("/admin/accounting/create")}
          onNavigate={onNavigate}
        />
        <SidebarItem
          open={open}
          href="/admin/accounting"
          icon={<ClipboardList size={20} />}
          label="List of Staff"
          active={
            pathname.startsWith("/admin/accounting") &&
            !pathname.startsWith("/admin/accounting/create")
          }
          onNavigate={onNavigate}
        />

        <SidebarSection open={open} title="Hauling" />
        <SidebarItem
          open={open}
          href="/admin/hauling/create"
          icon={<FolderPlus size={20} />}
          label="Create Hauling Trip"
          active={pathname.startsWith("/admin/hauling/create")}
          onNavigate={onNavigate}
        />
        <SidebarItem
          open={open}
          href="/admin/hauling"
          icon={<ClipboardList size={20} />}
          label="All Hauling Trips"
          active={
            pathname.startsWith("/admin/hauling") &&
            !pathname.startsWith("/admin/hauling/create")
          }
          onNavigate={onNavigate}
        />

        <SidebarSection open={open} title="Reports" />
        <SidebarItem
          open={open}
          href="/admin/reports/summary-status"
          icon={<FileBarChart size={20} />}
          label="Hauling Summary Status"
          active={pathname.startsWith("/admin/reports/summary-status")}
          onNavigate={onNavigate}
        />
        <SidebarItem
          open={open}
          href="/admin/reports/summary"
          icon={<FileBarChart size={20} />}
          label="Generate Hauling Summary"
          active={
            pathname.startsWith("/admin/reports/summary") &&
            !pathname.startsWith("/admin/reports/summary-status")
          }
          onNavigate={onNavigate}
        />
        <SidebarItem
          open={open}
          href="/admin/reports/payroll"
          icon={<DollarSign size={20} />}
          label="Drivers Payroll Reports"
          active={pathname.startsWith("/admin/reports/payroll")}
          onNavigate={onNavigate}
        />
        <SidebarItem
          open={open}
          href="/admin/reports/trucks"
          icon={<Wrench size={20} />}
          label="Truck Repairs & PMS"
          active={pathname.startsWith("/admin/reports/trucks")}
          onNavigate={onNavigate}
        />
      </nav>
    </div>
  );
}

/* ============================================================= */
/*                SHARED COMPONENTS                               */
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
