"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import api from "@/lib/api";
import PrintableInvoice from "components/PrintableInvoice";

type Invoice = {
  id: number;
  invoiceNo: string;
  generateDate: string;

  grossAmount: string;
  withheldTaxAmount: string;
  netAmount: string;

  client?: {
    registeredCompanyName: string;
    codeName: string;
    pickUpLocation?: string;
  };

  lines?: InvoiceLine[];
};

type InvoiceLine = {
  id: number;
  quantityWeight: string;
  rateApplied: string;
  lineAmount: string;
  trip?: {
    pickUpDate: string;
    receiptNumber: string | null;
    wasteType: string | null;
  };
};

export default function InvoiceDetailsPage() {
  const router = useRouter();
  const params = useParams();

  // ⭐ Correct: useParams() returns an object, NOT a Promise.
  const id = params?.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

  // LOAD THE INVOICE
  useEffect(() => {
    async function loadInvoice() {
      try {
        const res = await api.get(`/accounting/invoices/${id}`);
        setInvoice(res.data);
      } catch (err) {
        console.error("Failed to load invoice", err);
      } finally {
        setLoading(false);
      }
    }

    if (id) loadInvoice();
  }, [id]);

  // LOADING / NOT FOUND
  if (loading) return <div className="p-6 text-gray-500">Loading invoice...</div>;
  if (!invoice) return <div className="p-6 text-red-500">Invoice not found.</div>;

  // COMPUTED VALUES (using actual DB fields)
  const subtotal = parseFloat(invoice.grossAmount || "0");
  const withheld = parseFloat(invoice.withheldTaxAmount || "0");
  const total = parseFloat(invoice.netAmount || "0");
  const vat = subtotal * 0.12;

  return (
    <div className="p-6 space-y-6">

      {/* HEADER */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">
            Invoice #{invoice.invoiceNo}
          </h1>
          <p className="text-gray-500 text-sm">
            Issued: {invoice.generateDate?.substring(0, 10)}
          </p>
        </div>

        <PrintableInvoice invoice={invoice} />
        
        <button
        onClick={() => window.print()}
        className="px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 no-print"
        >
        Print Invoice
        </button>
      </div>

      {/* CLIENT INFO */}
      <section className="bg-white p-6 rounded-xl shadow border space-y-1">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Client Information
        </h2>

        <p><strong>Company Name:</strong> {invoice.client?.registeredCompanyName}</p>
        <p><strong>Code Name:</strong> {invoice.client?.codeName}</p>

        {invoice.client?.pickUpLocation && (
          <p><strong>Pickup Location:</strong> {invoice.client.pickUpLocation}</p>
        )}
      </section>

      {/* LINE ITEMS */}
      <section className="bg-white p-6 rounded-xl shadow border">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Line Items</h2>

        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-2">Pick-up Date</th>
              <th className="border px-2 py-2">WM No</th>
              <th className="border px-2 py-2 text-right">Weight (kg)</th>
              <th className="border px-2 py-2 text-right">Rate</th>
              <th className="border px-2 py-2 text-right">Amount</th>
            </tr>
          </thead>

          <tbody>
            {invoice.lines?.map((line) => (
              <tr key={line.id} className="border-t">
                <td className="px-2 py-2">
                  {line.trip?.pickUpDate?.substring(0, 10)}
                </td>
                <td className="px-2 py-2">{line.trip?.receiptNumber ?? "–"}</td>
                <td className="px-2 py-2 text-right">{line.quantityWeight}</td>
                <td className="px-2 py-2 text-right">
                  ₱ {parseFloat(line.rateApplied).toFixed(2)}
                </td>
                <td className="px-2 py-2 text-right">
                  ₱ {parseFloat(line.lineAmount).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* SUMMARY */}
      <section className="bg-white p-6 rounded-xl shadow border w-full md:w-1/2 ml-auto">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Summary</h2>

        <div className="flex justify-between py-1">
          <span>Subtotal</span>
          <span>₱ {subtotal.toFixed(2)}</span>
        </div>

        <div className="flex justify-between py-1">
          <span>VAT (12%)</span>
          <span>₱ {vat.toFixed(2)}</span>
        </div>

        <div className="flex justify-between py-1">
          <span>Withholding Tax</span>
          <span>₱ {withheld.toFixed(2)}</span>
        </div>

        <div className="flex justify-between py-2 border-t text-lg font-semibold">
          <span>Total</span>
          <span>₱ {total.toFixed(2)}</span>
        </div>
      </section>

      {/* BACK */}
      <button
        onClick={() => router.back()}
        className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
      >
        Back to List
      </button>
    </div>
  );
}
