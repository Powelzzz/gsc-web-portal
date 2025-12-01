"use client";

import { useState } from "react";
import Sidebar from "@/components/layout/Sidebar";

export default function ProtectedLayout({ children }: any) {
  const [open, setOpen] = useState(true);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar open={open} setOpen={setOpen} />

      <main
        className={`
          flex-1 p-6 transition-all duration-300
          ${open ? "ml-64" : "ml-20"}
        `}
      >
        {children}
      </main>
    </div>
  );
}
