"use client";

import { useState, useEffect } from "react";
import { Download } from "lucide-react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

/* ---------------------------------------------
   TYPES
--------------------------------------------- */
interface Payment {
  id: number;
  invoiceNo: string;
  client: string;
  collectionDate: string;
  collectionReceiptNo: string | null;
  receivedAmount: number;
  referenceNo: string | null;
  chequeNo: string | null;
  chequeDate: string | null;
  chequeBank: string | null;
  withHeldTax: string | null;
}

interface Summary {
  totalCollected: number;
  totalClientsPaid: number;
  totalTransactions: number;
}

/* ---------------------------------------------
   MAIN PAGE
--------------------------------------------- */
export default function CollectedPaymentsReportPage() {
  const [invoiceSearch, setInvoiceSearch] = useState("");
  const [clientSearch, setClientSearch] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  /* LOAD PAYMENTS FROM API */
  const loadPayments = async () => {
    try {
      setLoading(true);

      const params: Record<string, any> = {};

      if (invoiceSearch.trim()) params.invoice = invoiceSearch.trim();
      if (clientSearch.trim() && !isNaN(Number(clientSearch))) {
        params.clientId = Number(clientSearch);
      }
      if (dateFrom) params.from = dateFrom;
      if (dateTo) params.to = dateTo;

      const data = (await api.get<Payment[]>("/accounting/payments", { params }))
        .data;

      setPayments(data);
    } catch (err) {
      console.error("Failed to load payments:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayments();
  }, []);

  /* SUMMARY (based on backend results) */
  const summary: Summary = {
    totalCollected: payments.reduce((sum, p) => sum + Number(p.receivedAmount), 0),
    totalClientsPaid: new Set(payments.map((p) => p.client)).size,
    totalTransactions: payments.length,
  };

  /* EXPORT CSV */
  const exportCSV = () => {
    if (payments.length === 0) {
      alert("No data to export");
      return;
    }

    const header = [
      "Date",
      "Client",
      "Invoice No",
      "OR Number",
      "Amount",
      "Payment Type",
      "Ref/Cheque No",
      "Bank",
      "WHT",
    ];

    const rows = payments.map((p) => {
      const paymentType = p.chequeNo
        ? "Cheque"
        : p.referenceNo
        ? "Bank Transfer"
        : "Cash";

      return [
        new Date(p.collectionDate).toLocaleDateString(),
        p.client,
        p.invoiceNo,
        p.collectionReceiptNo ?? "",
        p.receivedAmount.toString(),
        paymentType,
        p.chequeNo || p.referenceNo || "",
        p.chequeBank ?? "",
        p.withHeldTax ?? "",
      ];
    });

    const body = [header, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([body], { type: "text/csv" });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `collected-payments-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  /* CLEAR FILTERS */
  const clearFilters = () => {
    setInvoiceSearch("");
    setClientSearch("");
    setDateFrom("");
    setDateTo("");
    loadPayments();
  };

  const hasActiveFilters = invoiceSearch || clientSearch || dateFrom || dateTo;

  return (
    <div className="max-w-7xl mx-auto space-y-8 px-4 md:px-0 p-4 md:p-6 pt-10 md:pt-12">
      {/* TITLE */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
          Collected Payments Report
        </h1>
        <p className="text-gray-500 mt-1">Filter and download collected payments.</p>
      </div>

      {/* SUMMARY */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 space-y-6">
        <h2 className="text-lg font-semibold text-gray-800">Summary</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SummaryCard
            label="Total Collected"
            value={`₱${summary.totalCollected.toLocaleString()}`}
          />
          <SummaryCard
            label="Total Clients Paid"
            value={summary.totalClientsPaid.toString()}
          />
          <SummaryCard
            label="Total Transactions"
            value={summary.totalTransactions.toString()}
          />
        </div>
      </div>

      {/* FILTERS + TABLE */}
      <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 space-y-6">
        {/* TOP CONTROLS */}
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3">
          <h2 className="text-lg font-semibold text-gray-800">
            Payments{" "}
            {payments.length > 0 && (
              <span className="text-sm text-gray-500">
                ({payments.length} results)
              </span>
            )}
          </h2>

          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full lg:w-auto">
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="w-full sm:w-auto px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition"
              >
                Clear Filters
              </button>
            )}

            <button
              onClick={loadPayments}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              Search
            </button>

            <button
              onClick={exportCSV}
              disabled={payments.length === 0}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
            >
              <Download size={18} />
              Export CSV
            </button>
          </div>
        </div>

        {/* FILTER FIELDS */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Input
            placeholder="Invoice #"
            value={invoiceSearch}
            onChange={(e) => setInvoiceSearch(e.target.value)}
          />
          <Input
            placeholder="Client ID"
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
          />

          <DateInput
            label="From Date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
          />
          <DateInput
            label="To Date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
          />
        </div>

        {/* TABLE */}
        <>
          {/* MOBILE: cards */}
          <div className="md:hidden space-y-3">
            {loading ? (
              <div className="text-sm text-gray-500 italic">Loading payments...</div>
            ) : payments.length === 0 ? (
              <div className="text-sm text-gray-400 italic">No payments found.</div>
            ) : (
              payments.map((p) => (
                <div key={p.id} className="border rounded-lg p-4 bg-white shadow-sm">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-semibold text-gray-900 truncate">
                        {p.invoiceNo}
                      </div>
                      <div className="text-sm text-gray-600 truncate">{p.client}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {p.collectionDate.split("T")[0]}
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <div className="font-semibold">
                        ₱{p.receivedAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => router.push(`/accounting/payments/${p.id}`)}
                      className="text-blue-600 hover:underline text-sm font-medium"
                    >
                      View
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* DESKTOP: table */}
          <PaymentsTable
            payments={payments}
            loading={loading}
            onView={(id) => router.push(`/accounting/payments/${id}`)}
          />
        </>
      </div>
    </div>
  );
}

/* ---------------------------------------------
   TABLE COMPONENT
--------------------------------------------- */
function PaymentsTable({
  payments,
  loading,
  onView,
}: {
  payments: Payment[];
  loading: boolean;
  onView: (id: number) => void;
}) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full table-auto">
        <thead>
          <tr>
            <th className="py-3 px-4 text-left">Invoice</th>
            <th className="py-3 px-4 text-left">Client</th>
            <th className="py-3 px-4 text-left">Date</th>
            <th className="py-3 px-4 text-right">Amount</th>
            <th className="py-3 px-4">Action</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td className="py-4 px-4 text-gray-500 italic" colSpan={5}>
                Loading payments...
              </td>
            </tr>
          ) : payments.length === 0 ? (
            <tr>
              <td className="py-4 px-4 text-gray-400 italic" colSpan={5}>
                No payments found.
              </td>
            </tr>
          ) : (
            payments.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="py-3 px-4">{p.invoiceNo}</td>
                <td className="py-3 px-4">{p.client}</td>
                <td className="py-3 px-4">{p.collectionDate.split("T")[0]}</td>
                <td className="py-3 px-4 text-right">
                  ₱{p.receivedAmount.toLocaleString()}
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => onView(p.id)}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    View
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

/* ---------------------------------------------
   INPUT COMPONENTS
--------------------------------------------- */
function Input({
  placeholder,
  value,
  onChange,
}: {
  placeholder: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500"
    />
  );
}

function DateInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-gray-600 font-medium">{label}</label>
      <input
        type="date"
        value={value}
        onChange={onChange}
        className="w-full border border-gray-300 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-blue-500 h-11"
      />
    </div>
  );
}

/* ---------------------------------------------
   SUMMARY CARD
--------------------------------------------- */
function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gradient-to-br from-gray-50 to-gray-100 border rounded-xl p-6 flex flex-col gap-2">
      <span className="text-sm text-gray-600">{label}</span>
      <span className="text-3xl font-bold text-gray-900">{value}</span>
    </div>
  );
}
