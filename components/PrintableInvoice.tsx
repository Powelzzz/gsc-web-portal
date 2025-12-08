"use client";

import Image from "next/image";

export default function PrintableInvoice({ invoice }: { invoice: any }) {

  const subtotal = parseFloat(invoice.grossAmount || "0");
  const vat = subtotal * 0.12;
  const withheld = parseFloat(invoice.withheldTaxAmount || "0");
  const total = parseFloat(invoice.netAmount || "0");

  return (
    <div id="print-area" className="bg-white p-10 text-gray-800 max-w-[800px] mx-auto">

      {/* COMPANY HEADER */}
      <header className="flex items-center justify-between border-b pb-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Z2A Corporation</h1>
          <p className="text-sm">Official Billing Invoice</p>
        </div>

        {/* LOGO */}
        <Image
          src="/z2alogo.png"
          alt="Z2A Logo"
          width={90}
          height={90}
          className="object-contain"
        />
      </header>

      {/* INVOICE HEADER */}
      <section className="mb-6">
        <h2 className="text-xl font-bold">INVOICE #{invoice.invoiceNo}</h2>
        <p className="text-sm text-gray-500">
          Issue Date: {invoice.generateDate.substring(0, 10)}
        </p>
      </section>

      {/* CLIENT INFO */}
      <section className="border rounded-lg p-4 mb-6 text-sm">
        <h3 className="font-semibold mb-2">Bill To:</h3>

        <p><strong>{invoice.client?.registeredCompanyName}</strong></p>
        {invoice.client?.codeName && <p>Code: {invoice.client.codeName}</p>}
        {invoice.client?.pickUpLocation && (
          <p>Pickup Location: {invoice.client.pickUpLocation}</p>
        )}
      </section>

      {/* LINE ITEMS */}
      <section className="mb-6">
        <table className="w-full text-sm border">
          <thead className="bg-gray-100">
            <tr>
              <th className="border px-2 py-2 text-left">Pick-up Date</th>
              <th className="border px-2 py-2 text-left">WM No.</th>
              <th className="border px-2 py-2 text-right">Weight (kg)</th>
              <th className="border px-2 py-2 text-right">Rate</th>
              <th className="border px-2 py-2 text-right">Amount</th>
            </tr>
          </thead>

          <tbody>
            {invoice.lines?.map((line: any) => (
              <tr key={line.id} className="border">
                <td className="px-2 py-2">{line.trip?.pickUpDate.substring(0, 10)}</td>
                <td className="px-2 py-2">{line.trip?.receiptNumber ?? "–"}</td>
                <td className="px-2 py-2 text-right">{line.quantityWeight}</td>
                <td className="px-2 py-2 text-right">₱ {parseFloat(line.rateApplied).toFixed(2)}</td>
                <td className="px-2 py-2 text-right">₱ {parseFloat(line.lineAmount).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      {/* SUMMARY */}
      <section className="border rounded-lg p-4 mb-6 w-[350px] ml-auto text-sm">
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

        <div className="flex justify-between py-1 font-bold text-lg border-t pt-2">
          <span>Total Amount Due</span>
          <span>₱ {total.toFixed(2)}</span>
        </div>
      </section>

      {/* SIGNATURE BLOCK */}
      <section className="mt-10 text-sm">
        <div className="flex justify-between">
          <div>
            <p className="font-semibold">Prepared By:</p>
            <div className="h-12 border-b w-56"></div>
          </div>

          <div>
            <p className="font-semibold">Received By:</p>
            <div className="h-12 border-b w-56"></div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="text-center text-xs text-gray-500 mt-10">
        This document is system-generated and requires no physical signature.
      </footer>

    </div>
  );
}
