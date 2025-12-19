"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

type InvoiceListItem = {
  id: number;
  invoiceNo: string;
  generateDate: string;
  dueDate: string | null;
  paymentTerms: number;
  totalAmount: string | null;
  totalPaid: number;
  remainingBalance: number;
  clientName: string;
};

export default function InvoiceListPage() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadInvoices() {
      setError(null);
      try {
        const res = await api.get("/accounting/invoices");
        setInvoices(res.data);
      } catch (err) {
        console.error("Failed to load invoices", err);
        setError("Failed to load invoices. Please try again.");
      } finally {
        setLoading(false);
      }
    }

    loadInvoices();
  }, []);

  // ------------------------------
  // STATUS LOGIC
  // ------------------------------
  function getStatus(inv: InvoiceListItem) {
    const total = Number(inv.totalAmount ?? 0);
    const paid = inv.totalPaid;

    if (paid >= total) return "Paid";

    const due = inv.dueDate ? new Date(inv.dueDate) : null;
    const today = new Date();

    if (due && today > due) return "Overdue";
    if (paid > 0) return "Partial";

    return "Unpaid";
  }

  function getStatusClass(status: string) {
    switch (status) {
      case "Paid":
        return "bg-green-100 text-green-700";
      case "Partial":
        return "bg-yellow-100 text-yellow-700";
      case "Overdue":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-200 text-gray-700";
    }
  }

  const money = new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: "PHP",
    minimumFractionDigits: 2,
  });

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* Title */}
      <header className="flex flex-col md:flex-row md:justify-between md:items-center gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Invoices</h1>

        <Link
          href="/accounting/billing/generate"
          className="w-full md:w-auto text-center px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow"
        >
          + Generate Invoice
        </Link>
      </header>

      {/* Loading / Error / Empty state */}
      {loading ? (
        <p className="text-gray-500 italic">Loading invoices...</p>
      ) : error ? (
        <p className="text-red-500 italic">{error}</p>
      ) : invoices.length === 0 ? (
        <p className="text-gray-400 italic">No invoices found.</p>
      ) : (
        <>
          {/* ===================== */}
          {/* MOBILE: CARD LIST */}
          {/* ===================== */}
          <div className="md:hidden space-y-3">
            {invoices.map((inv) => {
              const status = getStatus(inv);

              return (
                <div
                  key={inv.id}
                  className="border rounded-lg p-4 bg-white shadow-sm"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-indigo-700 truncate">
                        {inv.invoiceNo}
                      </div>
                      <div className="text-sm text-gray-600 truncate">
                        {inv.clientName}
                      </div>
                    </div>

                    <span
                      className={`px-2 py-1 rounded text-xs font-medium shrink-0 ${getStatusClass(
                        status
                      )}`}
                    >
                      {status}
                    </span>
                  </div>

                  <div className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
                    <div className="text-gray-500">Date</div>
                    <div className="text-right">
                      {inv.generateDate?.substring(0, 10)}
                    </div>

                    <div className="text-gray-500">Due</div>
                    <div className="text-right">
                      {inv.dueDate ? inv.dueDate.substring(0, 10) : "-"}
                    </div>

                    <div className="text-gray-500 font-medium">Total</div>
                    <div className="text-right font-semibold">
                      {money.format(Number(inv.totalAmount ?? 0))}
                    </div>
                  </div>

                  <div className="mt-3 text-right">
                    <Link
                      href={`/accounting/invoices/${inv.id}`}
                      className="text-indigo-600 font-medium hover:underline"
                    >
                      View
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>

          {/* ===================== */}
          {/* DESKTOP: TABLE */}
          {/* ===================== */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-3 py-2 text-left">Invoice No.</th>
                  <th className="border px-3 py-2 text-left">Client</th>
                  <th className="border px-3 py-2 text-left">Date</th>
                  <th className="border px-3 py-2 text-left">Due Date</th>
                  <th className="border px-3 py-2 text-left">Status</th>
                  <th className="border px-3 py-2 text-right">Total</th>
                  <th className="border px-3 py-2 text-center w-32"></th>
                </tr>
              </thead>

              <tbody>
                {invoices.map((inv) => {
                  const status = getStatus(inv);

                  return (
                    <tr key={inv.id} className="border-t hover:bg-gray-50">
                      <td className="px-3 py-2 font-medium text-indigo-700">
                        {inv.invoiceNo}
                      </td>
                      <td className="px-3 py-2">{inv.clientName}</td>
                      <td className="px-3 py-2">
                        {inv.generateDate?.substring(0, 10)}
                      </td>
                      <td className="px-3 py-2">
                        {inv.dueDate ? inv.dueDate.substring(0, 10) : "-"}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusClass(
                            status
                          )}`}
                        >
                          {status}
                        </span>
                      </td>
                      <td className="px-3 py-2 text-right">
                        {money.format(Number(inv.totalAmount ?? 0))}
                      </td>
                      <td className="px-3 py-2 text-center">
                        <Link
                          href={`/accounting/invoices/${inv.id}`}
                          className="text-indigo-600 hover:underline font-medium"
                        >
                          View
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
