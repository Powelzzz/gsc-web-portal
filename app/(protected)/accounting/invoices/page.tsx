"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/lib/api";

type InvoiceListItem = {
  id: number;
  invoiceNo: string;
  generateDate: string;
  totalAmount: string | null;
  client?: {
    registeredCompanyName: string;
    codeName: string;
  };
};

export default function InvoiceListPage() {
  const [invoices, setInvoices] = useState<InvoiceListItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadInvoices() {
      try {
        const res = await api.get("/accounting/invoices");
        setInvoices(res.data);
      } catch (err) {
        console.error("Failed to load invoices", err);
      } finally {
        setLoading(false);
      }
    }

    loadInvoices();
  }, []);

  return (
    <div className="p-6 space-y-6">
      {/* Title */}
      <header className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Invoices</h1>

        <Link
          href="/accounting/billing/generate"
          className="px-5 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 shadow"
        >
          + Generate Invoice
        </Link>
      </header>

      {/* Loading state */}
      {loading ? (
        <p className="text-gray-500 italic">Loading invoices...</p>
      ) : invoices.length === 0 ? (
        <p className="text-gray-400 italic">No invoices found.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-3 py-2 text-left">Invoice No.</th>
                <th className="border px-3 py-2 text-left">Client</th>
                <th className="border px-3 py-2 text-left">Date</th>
                <th className="border px-3 py-2 text-right">Total</th>
                <th className="border px-3 py-2 text-center w-32"></th>
              </tr>
            </thead>

            <tbody>
              {invoices.map((inv) => (
                <tr key={inv.id} className="border-t hover:bg-gray-50">
                  {/* Invoice No */}
                  <td className="px-3 py-2 font-medium text-indigo-700">
                    {inv.invoiceNo}
                  </td>

                  {/* Client */}
                  <td className="px-3 py-2">
                    {inv.client?.codeName || inv.client?.registeredCompanyName}
                  </td>

                  {/* Date */}
                  <td className="px-3 py-2">
                    {inv.generateDate?.substring(0, 10)}
                  </td>

                  {/* Total */}
                  <td className="px-3 py-2 text-right">
                    ₱{" "}
                    {parseFloat(inv.totalAmount || "0").toLocaleString(
                      undefined,
                      { minimumFractionDigits: 2 }
                    )}
                  </td>

                  {/* ACTION BUTTON */}
                  <td className="px-3 py-2 text-center">
                    <Link
                      href={`/accounting/invoices/${inv.id}`}
                      className="text-indigo-600 hover:underline font-medium"
                    >
                      View
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
