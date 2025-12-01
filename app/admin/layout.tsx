"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

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
} from "lucide-react";

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex">
      {/* SIDEBAR */}
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* MAIN CONTENT */}
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

/* SIDEBAR COMPONENT */
function Sidebar({ open, setOpen }: { open: boolean; setOpen: (val: boolean) => void }) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setFirstName(localStorage.getItem("gc_user_firstname") ?? "");
      setLastName(localStorage.getItem("gc_user_lastname") ?? "");
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("gc_token");
    localStorage.removeItem("gc_user_role");
    localStorage.removeItem("gc_user_firstname");
    localStorage.removeItem("gc_user_lastname");
    document.cookie = "gc_token=; path=/; max-age=0";
    window.location.href = "/login";
  };

  return (
    <aside
      className={`
        bg-white shadow-lg h-screen p-4 transition-all duration-300 border-r
        fixed top-0 left-0 overflow-y-auto
        ${open ? "w-64" : "w-20"}
      `}
    >
      {/* Toggle */}
      <button
        onClick={() => setOpen(!open)}
        className="mb-6 text-gray-600 hover:text-black transition"
      >
        <Menu size={22} />
      </button>

      {/* PROFILE */}
      <div className="flex items-center gap-3 mb-8">
        <img
          src="/avatar.png"
          alt="Profile"
          className="w-10 h-10 rounded-full border"
        />

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

      {/* MENU */}
      <nav className="space-y-1">
        <SidebarItem
          open={open}
          href="/admin/dashboard"
          icon={<Home size={20} />}
          label="Dashboard"
        />

        <SidebarSection open={open} title="Clients" />
        <SidebarItem
          open={open}
          href="/admin/clients/create"
          icon={<Users size={20} />}
          label="Create New Client"
        />
        <SidebarItem
          open={open}
          href="/admin/clients"
          icon={<ClipboardList size={20} />}
          label="List of Clients"
        />

        <SidebarSection open={open} title="Drivers" />
        <SidebarItem
          open={open}
          href="/admin/drivers/create"
          icon={<Truck size={20} />}
          label="Create New Driver"
        />
        <SidebarItem
          open={open}
          href="/admin/drivers"
          icon={<Truck size={20} />}
          label="List of Drivers"
        />

        {/* ACCOUNTING STAFF — ⭐ NEW SECTION ⭐ */}
        <SidebarSection open={open} title="Accounting Staff" />
        <SidebarItem
            open={open}
            href="/admin/accounting/create"
            icon={<Users size={20} />}
            label="Create New Staff"
        />
        <SidebarItem
            open={open}
            href="/admin/accounting"
            icon={<ClipboardList size={20} />}
            label="List of Staff"
        />

        <SidebarSection open={open} title="Hauling" />
        <SidebarItem
          open={open}
          href="/admin/hauling/create"
          icon={<FolderPlus size={20} />}
          label="Create Hauling Trip"
        />
        <SidebarItem
          open={open}
          href="/admin/hauling"
          icon={<ClipboardList size={20} />}
          label="All Hauling Trips"
        />

        <SidebarSection open={open} title="Reports" />
        <SidebarItem
          open={open}
          href="/admin/reports/summary-status"
          icon={<FileBarChart size={20} />}
          label="Hauling Summary Status"
        />
        <SidebarItem
          open={open}
          href="/admin/reports/summary"
          icon={<FileBarChart size={20} />}
          label="Generate Hauling Summary"
        />
        <SidebarItem
          open={open}
          href="/admin/reports/payroll"
          icon={<DollarSign size={20} />}
          label="Drivers Payroll Reports"
        />
        <SidebarItem
          open={open}
          href="/admin/reports/trucks"
          icon={<Wrench size={20} />}
          label="Truck Repairs & PMS"
        />
      </nav>
    </aside>
  );
}

/* Sidebar Item */
function SidebarItem({ open, href, icon, label }: { open: boolean; href: string; icon: React.ReactNode; label: string }) {
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

/* Section Title */
function SidebarSection({ open, title }: { open: boolean; title: string }) {
  if (!open) return <div className="my-2"></div>;
  return (
    <h2 className="text-xs font-semibold text-gray-400 uppercase mt-4 mb-1">
      {title}
    </h2>
  );
}
