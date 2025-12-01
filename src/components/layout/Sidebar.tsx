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

export default function Sidebar({ open, setOpen }: any) {
  const [internalOpen, internalSetOpen] = useState(true);

  // user info
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");

  useEffect(() => {
    if (typeof window !== "undefined") {
      setFirstName(localStorage.getItem("gc_user_firstname") ?? "");
      setLastName(localStorage.getItem("gc_user_lastname") ?? "");
    }
  }, []);

  const isOpen = open !== undefined ? open : internalOpen;

  const toggle = () => {
    if (setOpen) setOpen(!open);
    else internalSetOpen(!internalOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem("gc_token");
    localStorage.removeItem("gc_user_role");
    localStorage.removeItem("gc_user_firstname");
    localStorage.removeItem("gc_user_lastname");
    window.location.href = "/login";
  };

  return (
    <aside
      className={`
        bg-white shadow-lg h-screen p-4 transition-all duration-300 border-r
        fixed top-0 left-0 overflow-y-auto
        ${isOpen ? "w-64" : "w-20"}
      `}
    >
      {/* Toggle */}
      <button onClick={toggle} className="mb-6 text-gray-600 hover:text-black transition">
        <Menu size={22} />
      </button>

      {/* PROFILE */}
      <div className="flex items-center gap-3 mb-8">
        <img
          src="/avatar.png"
          alt="Profile"
          className="w-10 h-10 rounded-full border"
        />

        {isOpen && (
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
          open={isOpen}
          href="/admin/dashboard"
          icon={<Home size={20} />}
          label="Dashboard"
        />

        <SidebarSection open={isOpen} title="Clients" />
        <SidebarItem
          open={isOpen}
          href="/admin/clients/create"
          icon={<Users size={20} />}
          label="Create New Client"
        />

        <SidebarItem
          open={isOpen}
          href="/admin/clients"
          icon={<ClipboardList size={20} />}
          label="List of Clients"
        />

        <SidebarSection open={isOpen} title="Drivers" />
        <SidebarItem
          open={isOpen}
          href="/admin/drivers/create"
          icon={<Truck size={20} />}
          label="Create New Driver"
        />
        <SidebarItem
          open={isOpen}
          href="/admin/drivers"
          icon={<Truck size={20} />}
          label="List of Drivers"
        />

        <SidebarSection open={isOpen} title="Hauling" />
        <SidebarItem
          open={isOpen}
          href="/admin/hauling/create"
          icon={<FolderPlus size={20} />}
          label="Create Hauling Trip"
        />
        <SidebarItem
          open={isOpen}
          href="/admin/reports/ongoing"
          icon={<ClipboardList size={20} />}
          label="Ongoing Hauling"
        />
        <SidebarItem
          open={isOpen}
          href="/admin/reports/success"
          icon={<ClipboardList size={20} />}
          label="Successful Hauling"
        />
        <SidebarItem
          open={isOpen}
          href="/admin/reports/failed"
          icon={<ClipboardList size={20} />}
          label="Failed Hauling"
        />

        <SidebarSection open={isOpen} title="Reports" />
        <SidebarItem
          open={isOpen}
          href="/admin/reports/summary-status"
          icon={<FileBarChart size={20} />}
          label="Hauling Summary Status"
        />
        <SidebarItem
          open={isOpen}
          href="/admin/reports/summary"
          icon={<FileBarChart size={20} />}
          label="Generate Hauling Summary"
        />
        <SidebarItem
          open={isOpen}
          href="/admin/reports/payroll"
          icon={<DollarSign size={20} />}
          label="Drivers Payroll Reports"
        />
        <SidebarItem
          open={isOpen}
          href="/admin/reports/trucks"
          icon={<Wrench size={20} />}
          label="Truck Repairs & PMS"
        />
      </nav>
    </aside>
  );
}

/* Sidebar Items */
function SidebarItem({ open, href, icon, label }: any) {
  return (
    <Link
      href={href}
      className="
        flex items-center gap-3 p-2 rounded-md 
        hover:bg-gray-100 transition text-gray-700
      "
    >
      <span>{icon}</span>
      {open && <span className="text-sm font-medium">{label}</span>}
    </Link>
  );
}

/* Section Title */
function SidebarSection({ open, title }: any) {
  if (!open) return <div className="my-2"></div>;
  return (
    <h2 className="text-xs font-semibold text-gray-400 uppercase mt-4 mb-1">
      {title}
    </h2>
  );
}
