"use client";

import Link from "next/link";

export default function AdminDashboard() {
  const cards = [
    {
      title: "Create New Client",
      href: "/admin/clients/create",
      desc: "Encode new client information",
    },
    {
      title: "Create New Driver",
      href: "/admin/drivers/create",
      desc: "Register driver information",
    },
    {
      title: "Create Hauling Trip",
      href: "/admin/hauling/create",
      desc: "Assign driver & set hauling schedule",
    },
    {
      title: "List of Clients",
      href: "/admin/clients",
      desc: "View, edit, delete clients",
    },
    {
      title: "List of Drivers",
      href: "/admin/drivers",
      desc: "View, edit, delete drivers",
    },
    {
      title: "Ongoing Hauling",
      href: "/admin/reports/ongoing",
      desc: "Shows all hauling for today",
    },
    {
      title: "Successful Hauling",
      href: "/admin/reports/success",
      desc: "Completed hauling reports",
    },
    {
      title: "Failed Hauling",
      href: "/admin/reports/failed",
      desc: "View failed hauls and reasons",
    },
    {
      title: "Hauling Summary Status",
      href: "/admin/reports/summary-status",
      desc: "Overview of all hauling",
    },
    {
      title: "Generate Hauling Summary",
      href: "/admin/reports/summary",
      desc: "Generate summary reports",
    },
    {
      title: "Drivers Payroll Reports",
      href: "/admin/reports/payroll",
      desc: "View payroll reports & proof of payment",
    },
    {
      title: "Truck Repairs & PMS",
      href: "/admin/reports/trucks",
      desc: "View repair logs & schedules",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-3xl font-bold mb-8">Operations Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="bg-white rounded-lg shadow hover:shadow-lg transition p-6 border border-gray-200"
          >
            <h2 className="text-xl font-semibold mb-2">{card.title}</h2>
            <p className="text-gray-600 text-sm">{card.desc}</p>
          </Link>
        ))}
      </div>
    </div>
  );
}
