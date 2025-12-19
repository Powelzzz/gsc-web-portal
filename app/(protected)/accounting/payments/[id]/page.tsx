"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import { ArrowLeft, Receipt, Building2, FileText } from "lucide-react";

// ✅ Better: use env if available (optional)
const API_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN || "http://localhost:5001";

type PaymentDetails = {
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
  collectionReceiptImagePath: string | null; // "path1;path2"
};

const fmtDate = (d?: string | null) => (d ? d.split("T")[0] : "-");
const fmtMoney = (n: any) =>
  `₱${(Number(n) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`;

function Badge({ type }: { type: "Cash" | "Cheque" | "Bank Transfer" }) {
  const cls =
    type === "Cash"
      ? "bg-green-100 text-green-700 border-green-200"
      : type === "Cheque"
      ? "bg-blue-100 text-blue-700 border-blue-200"
      : "bg-purple-100 text-purple-700 border-purple-200";

  return (
    <span
      className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold border rounded-full ${cls}`}
    >
      {type}
    </span>
  );
}

export default function PaymentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [data, setData] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setError("");
        setLoading(true);
        const res = await api.get(`/accounting/payments/${id}`);
        setData(res.data);
      } catch (e: any) {
        setError(e?.response?.data || "Failed to load payment details.");
      } finally {
        setLoading(false);
      }
    }
    if (id) load();
  }, [id]);

  const paymentType = useMemo<"Cash" | "Cheque" | "Bank Transfer">(() => {
    if (!data) return "Cash";
    if (data.chequeNo) return "Cheque";
    if (data.referenceNo) return "Bank Transfer";
    return "Cash";
  }, [data]);

  const receiptImages = useMemo(() => {
    if (!data?.collectionReceiptImagePath) return [];
    return data.collectionReceiptImagePath
      .split(";")
      .map((x) => x.trim())
      .filter(Boolean);
  }, [data]);

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6 text-gray-500">
        Loading payment details...
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-4">
        <div className="bg-white border rounded-xl p-5">
          <p className="text-red-600 break-words">{error}</p>
        </div>
        <button
          onClick={() => router.back()}
          className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 rounded-lg border hover:bg-gray-50"
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-5 sm:space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold text-gray-900">Payment Details</h1>
          <p className="text-sm text-gray-500 break-words">Payment ID: {data.id}</p>
        </div>

        <button
          onClick={() => router.back()}
          className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
        >
          <ArrowLeft size={16} /> Back
        </button>
      </div>

      {/* TOP SUMMARY STRIP */}
      <div className="bg-white border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1 min-w-0">
          <div className="flex items-start gap-2 text-gray-900 font-semibold min-w-0">
            <FileText size={16} className="mt-0.5 shrink-0" />
            <span className="min-w-0 break-words">
              Invoice: {data.invoiceNo}
            </span>
          </div>
          <div className="flex items-start gap-2 text-gray-600 text-sm min-w-0">
            <Building2 size={16} className="mt-0.5 shrink-0" />
            <span className="min-w-0 break-words">{data.client}</span>
          </div>
        </div>

        <div className="flex flex-row sm:flex-col items-center sm:items-end justify-between sm:justify-start gap-3 sm:gap-2">
          <Badge type={paymentType} />
          <div className="text-xl sm:text-2xl font-bold text-gray-900">
            {fmtMoney(data.receivedAmount)}
          </div>
          <div className="text-xs sm:text-sm text-gray-500">
            Received: {fmtDate(data.collectionDate)}
          </div>
        </div>
      </div>

      {/* DETAILS GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
        {/* PAYMENT INFO */}
        <Card title="Payment Information" icon={<Receipt size={18} />}>
          <KeyValue label="OR Number" value={data.collectionReceiptNo ?? "-"} />
          <KeyValue label="Collection Date" value={fmtDate(data.collectionDate)} />
          <KeyValue label="Amount" value={fmtMoney(data.receivedAmount)} />
          <KeyValue
            label="Withheld Tax"
            value={data.withHeldTax ? fmtMoney(data.withHeldTax) : "-"}
          />
          <KeyValue label="Payment Type" value={<Badge type={paymentType} />} />
        </Card>

        {/* BANK / CHEQUE INFO */}
        <Card title="Reference / Cheque Details">
          <KeyValue label="Reference No." value={data.referenceNo ?? "-"} />
          <KeyValue label="Cheque No." value={data.chequeNo ?? "-"} />
          <KeyValue label="Cheque Date" value={fmtDate(data.chequeDate)} />
          <KeyValue label="Cheque Bank" value={data.chequeBank ?? "-"} />
        </Card>
      </div>

      {/* PROOF IMAGES */}
      <div className="bg-white border rounded-2xl p-4 sm:p-6 space-y-3">
        <div className="flex items-start sm:items-center justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900">Proof of Payment</h2>
          <span className="text-sm text-gray-500 whitespace-nowrap">
            {receiptImages.length} file(s)
          </span>
        </div>

        {receiptImages.length === 0 ? (
          <div className="border border-dashed rounded-xl p-6 sm:p-8 text-center text-gray-500">
            No proof images uploaded.
          </div>
        ) : (
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
            {receiptImages.map((path, idx) => (
              <a
                key={idx}
                href={path}
                target="_blank"
                rel="noreferrer"
                className="group block border rounded-xl overflow-hidden bg-gray-50 hover:bg-gray-100 transition"
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={path}
                    alt={`Receipt ${idx + 1}`}
                    className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform"
                    loading="lazy"
                  />
                </div>
                <div className="p-3 text-sm text-gray-700 break-words">
                  Receipt {idx + 1}
                  <span className="text-gray-400"> • click to open</span>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------- Small UI helpers (minimal) ---------- */

function Card({
  title,
  children,
  icon,
}: {
  title: string;
  children: React.ReactNode;
  icon?: React.ReactNode;
}) {
  return (
    <div className="bg-white border rounded-2xl p-4 sm:p-6">
      <div className="flex items-center gap-2 mb-4">
        {icon ? <span className="text-gray-600">{icon}</span> : null}
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function KeyValue({
  label,
  value,
}: {
  label: string;
  value: string | React.ReactNode;
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-1 sm:gap-6">
      <span className="text-xs sm:text-sm text-gray-500">{label}</span>
      <span className="text-sm font-medium text-gray-900 sm:text-right break-words">
        {value}
      </span>
    </div>
  );
}
