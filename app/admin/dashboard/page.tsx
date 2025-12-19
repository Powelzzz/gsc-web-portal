"use client";

import Link from "next/link";

const cards = [
  {
    title: "Clients",
    description: "View and manage registered clients",
    href: "/admin/clients",
  },
  {
    title: "Drivers",
    description: "Manage driver accounts",
    href: "/admin/drivers",
  },
  {
    title: "Accounting Staff",
    description: "Manage accounting users and roles",
    href: "/admin/accounting",
  },
  {
    title: "Hauling Trips",
    description: "Create, schedule, and track trips",
    href: "/admin/hauling",
  },
];

export default function AdminDashboard() {
  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-6xl mx-auto">
        {/* HEADER */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-6">
          Operations Admin Dashboard
        </h1>

        {/* CARDS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card) => (
            <Link
              key={card.title}
              href={card.href}
              className="
                group bg-white border rounded-xl p-6 shadow-sm
                hover:shadow-md hover:border-indigo-500
                transition cursor-pointer
              "
            >
              <h2 className="text-lg font-semibold text-gray-800 mb-2 group-hover:text-indigo-600">
                {card.title}
              </h2>
              <p className="text-sm text-gray-500">
                {card.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
