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

  const id = params?.id as string;

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [loading, setLoading] = useState(true);

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

  if (loading) return <div className="p-4 md:p-6 text-gray-500">Loading invoice...</div>;
  if (!invoice) return <div className="p-4 md:p-6 text-red-500">Invoice not found.</div>;

  const subtotal = parseFloat(invoice.grossAmount || "0");
  const withheld = parseFloat(invoice.withheldTaxAmount || "0");
  const total = parseFloat(invoice.netAmount || "0");
  const vat = subtotal * 0.12;

  return (
    <div className="p-4 md:p-6 space-y-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-800">
            Invoice #{invoice.invoiceNo}
          </h1>
          <p className="text-gray-500 text-sm">
            Issued: {invoice.generateDate?.substring(0, 10)}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 sm:items-center md:justify-end">
          <PrintableInvoice invoice={invoice} />

          <button
            onClick={() => window.print()}
            className="w-full sm:w-auto px-4 py-2 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 no-print text-center"
          >
            Print Invoice
          </button>
        </div>
      </div>

      {/* CLIENT INFO */}
      <section className="bg-white p-4 md:p-6 rounded-xl shadow border space-y-1">
        <h2 className="text-lg font-semibold text-gray-800 mb-3">
          Client Information
        </h2>

        <p className="break-words">
          <strong>Company Name:</strong> {invoice.client?.registeredCompanyName}
        </p>
        <p className="break-words">
          <strong>Code Name:</strong> {invoice.client?.codeName}
        </p>

        {invoice.client?.pickUpLocation && (
          <p className="break-words">
            <strong>Pickup Location:</strong> {invoice.client.pickUpLocation}
          </p>
        )}
      </section>

      {/* LINE ITEMS */}
      <section className="bg-white p-4 md:p-6 rounded-xl shadow border">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Line Items</h2>

        {/* MOBILE: Cards */}
        <div className="md:hidden space-y-3">
          {invoice.lines?.map((line) => (
            <div key={line.id} className="border rounded-lg p-4 bg-white">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900">
                    {line.trip?.receiptNumber ?? "–"}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {line.trip?.pickUpDate?.substring(0, 10)}
                  </div>
                  {line.trip?.wasteType && (
                    <div className="text-xs text-gray-600 mt-1">
                      Waste: {line.trip.wasteType}
                    </div>
                  )}
                </div>

                <div className="text-right shrink-0">
                  <div className="text-sm font-semibold">
                    ₱ {parseFloat(line.lineAmount).toFixed(2)}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {line.quantityWeight} kg
                  </div>
                </div>
              </div>

              <div className="mt-3 grid grid-cols-2 gap-y-2 text-sm">
                <div className="text-gray-500">Rate</div>
                <div className="text-right">
                  ₱ {parseFloat(line.rateApplied).toFixed(2)}
                </div>

                <div className="text-gray-500">Amount</div>
                <div className="text-right font-semibold">
                  ₱ {parseFloat(line.lineAmount).toFixed(2)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* DESKTOP: Table */}
        <div className="hidden md:block overflow-x-auto">
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
        </div>
      </section>

      {/* SUMMARY */}
      <section className="bg-white p-4 md:p-6 rounded-xl shadow border w-full md:w-1/2 md:ml-auto">
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
        className="w-full md:w-auto px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
      >
        Back to List
      </button>
    </div>
  );
}
