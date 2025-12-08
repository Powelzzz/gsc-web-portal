"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { UploadCloud, Image as ImageIcon, Search } from "lucide-react";
import toast from "react-hot-toast";

/* ---------------------------------------------
   TYPES
--------------------------------------------- */

interface PaymentHistoryItem {
  id: number;
  invoiceNo: string;
  clientName: string;
  collectionDate: string;
  collectionReceiptNo: string;
  receivedAmount: number;
  referenceNo: string | null;
  chequeNo: string | null;
}

interface InvoiceDto {
  id: number;
  invoiceNo: string;
  clientId: number;
  clientName: string; 
  totalAmount: number;
  totalPaid: number;
  remainingBalance: number;
  paymentHistory: PaymentHistoryItem[];
}

/* ---------------------------------------------
   MAIN COMPONENT
--------------------------------------------- */

export default function EncodePaymentsPage() {
  const [dto, setDto] = useState({
    invoiceId: "",
    clientId: "",
    collectionDate: "",
    collectionReceiptNo: "",
    referenceNo: "",
    chequeNo: "",
    chequeDate: "",
    chequeBank: "",
    withHeldTax: "0",
    receivedAmount: "",
    collectionReceiptImagePath: "",
  });

  const [receiptImage, setReceiptImage] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const [invoiceList, setInvoiceList] = useState<InvoiceDto[]>([]);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDto | null>(null);

  /* ---------------------------------------------
     PAYMENT HISTORY
  --------------------------------------------- */

  const [allPayments, setAllPayments] = useState<PaymentHistoryItem[]>([]);
  const [paymentSearch, setPaymentSearch] = useState("");
  const [paymentPage, setPaymentPage] = useState(1);
  const paymentsPerPage = 10;

  const loadAllPayments = async () => {
    try {
      const res = await api.get("/accounting/payments");
      setAllPayments(res.data);
    } catch (err) {
      console.error("Failed to load all payments", err);
    }
  };

  useEffect(() => {
    loadAllPayments();
  }, []);

  const filteredPayments = allPayments.filter((p) => {
    const s = paymentSearch.toLowerCase().trim();
    if (s === "") return true;

    return (
      (p.invoiceNo ?? "").toLowerCase().includes(s) ||
      (p.clientName ?? "").toLowerCase().includes(s) ||
      (p.collectionReceiptNo ?? "").toLowerCase().includes(s)
    );
  });

  const totalPages = Math.ceil(filteredPayments.length / paymentsPerPage);
  const paginatedPayments = filteredPayments.slice(
    (paymentPage - 1) * paymentsPerPage,
    paymentPage * paymentsPerPage
  );

  /* ---------------------------------------------
     AUTO-FILL TODAY
  --------------------------------------------- */

  useEffect(() => {
    const today = new Date().toISOString().substring(0, 10);
    setDto((p) => ({ ...p, collectionDate: today }));
  }, []);

  /* ---------------------------------------------
     LOAD INVOICES
  --------------------------------------------- */

  useEffect(() => {
    loadInvoices();
  }, []);

  const loadInvoices = async () => {
    try {
      const res = await api.get("/accounting/invoices");
      setInvoiceList(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  /* ---------------------------------------------
     LOAD INVOICE DETAILS
  --------------------------------------------- */

  const loadInvoiceDetails = async (id: number) => {
    try {
      const res = await api.get(`/accounting/invoices/${id}`);
      const inv = res.data;

      setSelectedInvoice({
        id: inv.id,
        invoiceNo: inv.invoiceNo,
        clientId: inv.clientId,
        clientName: inv.clientName, 
        totalAmount: Number(inv.netAmount),
        totalPaid: Number(inv.totalPaid ?? 0),
        remainingBalance:
          Number(inv.remainingBalance ?? inv.netAmount - (inv.totalPaid ?? 0)),
        paymentHistory: (inv.paymentHistory ?? []).map((p: any) => ({
          id: p.id,
          collectionDate: p.collectionDate,
          collectionReceiptNo: p.collectionReceiptNo,
          receivedAmount: Number(p.receivedAmount),
          referenceNo: p.referenceNo,
          chequeNo: p.chequeNo,
          invoiceNo: inv.invoiceNo,
          clientName: inv.clientName,
        })),
      });
    } catch (err) {
      console.error("Failed to load invoice", err);
    }
  };

  /* ---------------------------------------------
     HELPERS
  --------------------------------------------- */

  const handleChange = (key: string, value: any) =>
    setDto((p) => ({ ...p, [key]: value }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) setReceiptImage(file);
  };

  const selectInvoice = async (inv: InvoiceDto) => {
    handleChange("invoiceId", inv.id.toString());
    handleChange("clientId", inv.clientId.toString());
    setSearch(inv.invoiceNo);
    setShowDropdown(false);

    toast.success(`Invoice ${inv.invoiceNo} selected`);
    await loadInvoiceDetails(inv.id);
  };

  const filteredInvoices = invoiceList.filter((inv) => {
    const name = inv.clientName || "";
    return (inv.invoiceNo + " " + name)
      .toLowerCase()
      .includes(search.toLowerCase());
  });

  /* ---------------------------------------------
     SUBMIT PAYMENT
  --------------------------------------------- */

  const submitPayment = async () => {
    if (!dto.invoiceId || !dto.clientId || !dto.collectionDate || !dto.collectionReceiptNo || !dto.receivedAmount) {
      return toast.error("Please fill all required fields.");
    }

    if (selectedInvoice && Number(dto.receivedAmount) > Number(selectedInvoice.remainingBalance)) {
      return toast.error("Payment exceeds remaining balance.");
    }

    setLoading(true);

    try {
      await api.post("/accounting/payments", {
        InvoiceId: Number(dto.invoiceId),
        ClientId: Number(dto.clientId),
        CollectionDate: dto.collectionDate,
        CollectionReceiptNo: dto.collectionReceiptNo,
        ReferenceNo: dto.referenceNo,
        ChequeNo: dto.chequeNo,
        ChequeDate: dto.chequeDate || null,
        ChequeBank: dto.chequeBank,
        WithHeldTax: dto.withHeldTax,
        ReceivedAmount: dto.receivedAmount,
        CollectionReceiptImagePath: dto.collectionReceiptImagePath,
      });

      toast.success("Payment recorded!");
      await loadInvoiceDetails(Number(dto.invoiceId));
      await loadAllPayments();

      setDto((p) => ({
        ...p,
        collectionReceiptNo: "",
        referenceNo: "",
        chequeNo: "",
        chequeDate: "",
        chequeBank: "",
        receivedAmount: "",
        withHeldTax: "0",
      }));

      setReceiptImage(null);
    } catch (err) {
      toast.error("Failed to save payment.");
    }

    setLoading(false);
  };

  /* ---------------------------------------------
     RENDER
  --------------------------------------------- */

  return (
    <div className="max-w-6xl mx-auto space-y-10">
      <h1 className="text-3xl font-bold text-gray-900">Encode Received Payments</h1>

      <div className="bg-white rounded-xl shadow-sm p-6 space-y-8">
        
        {/* ------- INVOICE LOOKUP ------- */}
        <h2 className="text-lg font-semibold">Invoice Lookup</h2>

        <div className="relative">
          <div className="flex items-center bg-gray-50 border rounded-lg px-3 py-2">
            <Search className="text-gray-500" size={18} />
            <input
              type="text"
              className="w-full bg-transparent outline-none"
              placeholder="Search invoice or client"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setShowDropdown(true);
              }}
            />
          </div>

          {showDropdown && search.length > 0 && (
            <div className="absolute z-50 w-full bg-white border rounded-lg shadow mt-1 max-h-64 overflow-y-auto">
              {filteredInvoices.length === 0 ? (
                <div className="p-3 text-sm text-gray-500">No invoices found</div>
              ) : (
                filteredInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    onClick={() => selectInvoice(inv)}
                    className="p-3 hover:bg-gray-100 cursor-pointer"
                  >
                    <p className="font-medium">{inv.invoiceNo}</p>
                    <p className="text-xs text-gray-600">{inv.clientName}</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* ------- PAYMENT FORM ------- */}
        <h2 className="text-lg font-semibold">Payment Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="Date Received *" type="date" value={dto.collectionDate} onChange={(e) => handleChange("collectionDate", e.target.value)} />
          <Input label="OR Number *" value={dto.collectionReceiptNo} onChange={(e) => handleChange("collectionReceiptNo", e.target.value)} />
          <Input label="Amount Paid *" type="number" value={dto.receivedAmount} onChange={(e) => handleChange("receivedAmount", e.target.value)} />
          <Input label="Reference No" value={dto.referenceNo} onChange={(e) => handleChange("referenceNo", e.target.value)} />
          <Input label="Cheque No" value={dto.chequeNo} onChange={(e) => handleChange("chequeNo", e.target.value)} />
          <Input label="Cheque Date" type="date" value={dto.chequeDate} onChange={(e) => handleChange("chequeDate", e.target.value)} />
          <Input label="Cheque Bank" value={dto.chequeBank} onChange={(e) => handleChange("chequeBank", e.target.value)} />
          <Input label="Withheld Tax" type="number" value={dto.withHeldTax} onChange={(e) => handleChange("withHeldTax", e.target.value)} />
        </div>

        {/* ------- FILE UPLOAD ------- */}
        <div className="p-10 bg-gray-50 rounded-xl flex flex-col items-center">
          <UploadCloud className="text-gray-500" size={40} />
          <p className="mt-3 text-gray-700 font-medium">Upload Proof of Payment (optional)</p>

          <label htmlFor="receiptUpload" className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700">
            Choose File
          </label>

          <input id="receiptUpload" type="file" className="hidden" onChange={handleFileChange} />

          {receiptImage && (
            <div className="mt-4 flex items-center gap-2 text-green-700">
              <ImageIcon size={18} /> {receiptImage.name}
            </div>
          )}
        </div>

        {/* ------- SAVE BUTTON ------- */}
        <button
          onClick={submitPayment}
          disabled={loading}
          className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400"
        >
          {loading ? "Saving..." : "Save Payment"}
        </button>

        {/* ------- PAYMENT HISTORY ------- */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold mb-3">All Payments Overview</h2>

          <div className="mb-4">
            <input
              type="text"
              placeholder="Search invoice, client, or OR number..."
              value={paymentSearch}
              onChange={(e) => {
                setPaymentSearch(e.target.value);
                setPaymentPage(1);
              }}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="p-2 border">Invoice No</th>
                  <th className="p-2 border">Client</th>
                  <th className="p-2 border">Date</th>
                  <th className="p-2 border">OR No</th>
                  <th className="p-2 border">Amount</th>
                  <th className="p-2 border">Reference</th>
                  <th className="p-2 border">Cheque No</th>
                </tr>
              </thead>

              <tbody>
                {paginatedPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-4 text-center text-gray-500 italic">
                      No payments found
                    </td>
                  </tr>
                ) : (
                  paginatedPayments.map((p) => (
                    <tr key={p.id}>
                      <td className="p-2 border">{p.invoiceNo}</td>
                      <td className="p-2 border">{p.clientName}</td>
                      <td className="p-2 border">{p.collectionDate?.substring(0, 10)}</td>
                      <td className="p-2 border">{p.collectionReceiptNo}</td>
                      <td className="p-2 border">₱{p.receivedAmount}</td>
                      <td className="p-2 border">{p.referenceNo ?? "-"}</td>
                      <td className="p-2 border">{p.chequeNo ?? "-"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-center gap-3 mt-4">
            <button
              disabled={paymentPage === 1}
              onClick={() => setPaymentPage((p) => p - 1)}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              Prev
            </button>

            <span className="text-sm font-medium">
              Page {paymentPage} of {totalPages || 1}
            </span>

            <button
              disabled={paymentPage === totalPages}
              onClick={() => setPaymentPage((p) => p + 1)}
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ---------------------------------------------
   INPUT COMPONENT
--------------------------------------------- */

function Input({
  label,
  type = "text",
  value,
  onChange,
}: {
  label: string;
  type?: string;
  value?: any;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}) {
  return (
    <div className="flex flex-col">
      <label className="text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input className="input" type={type} value={value} onChange={onChange} />
    </div>
  );
}
