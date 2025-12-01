"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
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

type AccountingSidebarProps = {
  open: boolean;
  setOpen: (val: boolean) => void;
};

export default function AccountingLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex">
      {/* USE AccountingSidebar instead of Sidebar */}
      <AccountingSidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      {/* MAIN CONTENT AREA */}
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

/* ACCOUNTING SIDEBAR */
function AccountingSidebar({ open, setOpen }: AccountingSidebarProps) {
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
    document.cookie = "gc_user_role=; path=/; max-age=0";
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
          href="/accounting"
          icon={<Home size={20} />}
          label="Dashboard"
        />

        <SidebarSection open={open} title="Rates" />
        <SidebarItem
          open={open}
          href="/accounting/rates"
          icon={<ClipboardList size={20} />}
          label="Encode Rates per Client"
        />

        <SidebarSection open={open} title="Billing" />
        <SidebarItem
          open={open}
          href="/accounting/billing/generate"
          icon={<FileText size={20} />}
          label="Generate Billing / Invoice"
        />
        <SidebarItem
          open={open}
          href="/accounting/billing/sent"
          icon={<FolderKanban size={20} />}
          label="Upload Sent Billing"
        />

        <SidebarSection open={open} title="Payments" />
        <SidebarItem
          open={open}
          href="/accounting/payments/encode"
          icon={<DollarSign size={20} />}
          label="Encode Received Payments"
        />
        <SidebarItem
          open={open}
          href="/accounting/payments/collected"
          icon={<BookOpen size={20} />}
          label="Collected Payments Report"
        />
        <SidebarItem
          open={open}
          href="/accounting/payments/deposits"
          icon={<FolderKanban size={20} />}
          label="Deposit Slips"
        />

        <SidebarSection open={open} title="Reports" />
        <SidebarItem
          open={open}
          href="/accounting/reports/payment-collections"
          icon={<FileBarChart size={20} />}
          label="Payment Collection Reports"
        />
        <SidebarItem
          open={open}
          href="/accounting/reports/unpaid-billing"
          icon={<FileBarChart size={20} />}
          label="Unpaid Billing Reports"
        />
        <SidebarItem
          open={open}
          href="/accounting/reports/soa"
          icon={<FileBarChart size={20} />}
          label="Statement of Accounts"
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
