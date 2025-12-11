"use client";

import { useState, useEffect, useRef } from "react";
import api from "@/lib/api";
import { UploadCloud, Search } from "lucide-react";
import toast from "react-hot-toast";

/* ---------------------------------------------
   TYPES
--------------------------------------------- */

interface InvoiceDto {
  id: number;
  invoiceNo: string;
  clientId: number;
  clientName: string;
  totalAmount: number;
  totalPaid: number;
  remainingBalance: number;
}

type PaymentDto = {
  invoiceId: string;
  clientId: string;
  collectionDate: string;
  collectionReceiptNo: string;
  referenceNo: string;
  chequeNo: string;
  chequeDate: string;
  chequeBank: string;
  withHeldTax: string;
  receivedAmount: string;
  // will store multiple paths as "path1;path2;path3"
  collectionReceiptImagePath: string;
};

/* ---------------------------------------------
   HELPERS
--------------------------------------------- */

const createInitialDto = (): PaymentDto => ({
  invoiceId: "",
  clientId: "",
  collectionDate: new Date().toISOString().substring(0, 10),
  collectionReceiptNo: "",
  referenceNo: "",
  chequeNo: "",
  chequeDate: "",
  chequeBank: "",
  withHeldTax: "0",
  receivedAmount: "",
  collectionReceiptImagePath: "",
});

/* ---------------------------------------------
   MAIN COMPONENT
--------------------------------------------- */

export default function EncodePaymentsPage() {
  const [dto, setDto] = useState<PaymentDto>(createInitialDto);

  const [receiptImages, setReceiptImages] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState(false);

  const [invoiceList, setInvoiceList] = useState<InvoiceDto[]>([]);
  const [search, setSearch] = useState("");
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceDto | null>(null);

  /* ---------------------------------------------
     LOAD INVOICES (ONCE)
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
      });
    } catch (err) {
      console.error("Failed to load invoice", err);
    }
  };

  /* ---------------------------------------------
     HELPERS
  --------------------------------------------- */

  const handleChange = (key: keyof PaymentDto, value: any) =>
    setDto((p) => ({ ...p, [key]: value }));

  // NO upload here anymore — only local state + previews
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setReceiptImages((prev) => [...prev, ...files]);

    const newPreviewUrls = files.map((file) => URL.createObjectURL(file));
    setPreviewUrls((prev) => [...prev, ...newPreviewUrls]);

    // allow re-selecting the same files again later if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveImage = (index: number) => {
    // remove from local arrays
    setReceiptImages((prev) => prev.filter((_, i) => i !== index));
    setPreviewUrls((prev) => {
      const url = prev[index];
      if (url) URL.revokeObjectURL(url);
      return prev.filter((_, i) => i !== index);
    });
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

  const resetAll = () => {
    // reset dto
    setDto(createInitialDto());
    // clear invoice lookup
    setSelectedInvoice(null);
    setSearch("");
    setShowDropdown(false);
    // clear images + previews
    receiptImages.forEach((_, i) => {
      const url = previewUrls[i];
      if (url) URL.revokeObjectURL(url);
    });
    setReceiptImages([]);
    setPreviewUrls([]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  /* ---------------------------------------------
     SUBMIT PAYMENT
  --------------------------------------------- */

  const submitPayment = async () => {
    if (
      !dto.invoiceId ||
      !dto.clientId ||
      !dto.collectionDate ||
      !dto.collectionReceiptNo ||
      !dto.receivedAmount
    ) {
      return toast.error("Please fill all required fields.");
    }

    if (
      selectedInvoice &&
      Number(dto.receivedAmount) > Number(selectedInvoice.remainingBalance)
    ) {
      return toast.error("Payment exceeds remaining balance.");
    }

    setLoading(true);

    try {
      // 1) Upload images NOW (only when saving)
      let imagePathString = "";

      if (receiptImages.length > 0) {
        const uploadedPaths: string[] = [];

        for (const file of receiptImages) {
          const formData = new FormData();
          formData.append("file", file);

          // baseURL likely includes /api, so this hits POST /api/upload
          const res = await api.post("/upload", formData, {
            headers: { "Content-Type": "multipart/form-data" },
          });

          uploadedPaths.push(res.data.path);
        }

        imagePathString = uploadedPaths.join(";");
      }

      // 2) Save payment with imagePathString (or empty string if no images)
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
        CollectionReceiptImagePath: imagePathString,
      });

      toast.success("Payment recorded!");

      // 3) "Refresh" page: reset everything
      resetAll();
    } catch (err) {
      console.error(err);
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

        {/* ------- SELECTED INVOICE SUMMARY ------- */}
        {selectedInvoice && (
          <div className="mt-4 p-4 border rounded-lg bg-gray-50 text-sm space-y-1">
            <p>
              <span className="font-medium">Invoice:</span> {selectedInvoice.invoiceNo}
            </p>
            <p>
              <span className="font-medium">Client:</span> {selectedInvoice.clientName}
            </p>
            <p>
              <span className="font-medium">Total:</span> ₱
              {selectedInvoice.totalAmount.toLocaleString()}
            </p>
            <p>
              <span className="font-medium">Paid:</span> ₱
              {selectedInvoice.totalPaid.toLocaleString()}
            </p>
            <p>
              <span className="font-medium">Remaining:</span>{" "}
              <span
                className={
                  selectedInvoice.remainingBalance <= 0
                    ? "text-green-600 font-semibold"
                    : "text-red-600 font-semibold"
                }
              >
                ₱{selectedInvoice.remainingBalance.toLocaleString()}
              </span>
            </p>
          </div>
        )}

        {/* ------- PAYMENT FORM ------- */}
        <h2 className="text-lg font-semibold">Payment Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            label="Date Received *"
            type="date"
            value={dto.collectionDate}
            onChange={(e) => handleChange("collectionDate", e.target.value)}
          />
          <Input
            label="OR Number *"
            value={dto.collectionReceiptNo}
            onChange={(e) => handleChange("collectionReceiptNo", e.target.value)}
          />
          <Input
            label="Amount Paid *"
            type="number"
            value={dto.receivedAmount}
            onChange={(e) => handleChange("receivedAmount", e.target.value)}
          />
          <Input
            label="Reference No"
            value={dto.referenceNo}
            onChange={(e) => handleChange("referenceNo", e.target.value)}
          />
          <Input
            label="Cheque No"
            value={dto.chequeNo}
            onChange={(e) => handleChange("chequeNo", e.target.value)}
          />
          <Input
            label="Cheque Date"
            type="date"
            value={dto.chequeDate}
            onChange={(e) => handleChange("chequeDate", e.target.value)}
          />
          <Input
            label="Cheque Bank"
            value={dto.chequeBank}
            onChange={(e) => handleChange("chequeBank", e.target.value)}
          />
          <Input
            label="Withheld Tax"
            type="number"
            value={dto.withHeldTax}
            onChange={(e) => handleChange("withHeldTax", e.target.value)}
          />
        </div>

        {/* ------- FILE UPLOAD (MULTIPLE) ------- */}
        <div className="p-10 bg-gray-50 rounded-xl flex flex-col items-center">
          <UploadCloud className="text-gray-500" size={40} />
          <p className="mt-3 text-gray-700 font-medium">
            Upload Proof of Payment (optional)
          </p>

          <label
            htmlFor="receiptUpload"
            className="mt-4 px-5 py-2.5 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700"
          >
            Choose File(s)
          </label>

          <input
            id="receiptUpload"
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/*"
            multiple
            onChange={handleFileChange}
          />

          {previewUrls.length > 0 && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4 w-full">
              {previewUrls.map((url, index) => (
                <div key={index} className="flex flex-col items-center gap-2">
                  <img
                    src={url}
                    alt={`Receipt ${index + 1}`}
                    className="max-h-40 rounded border bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => handleRemoveImage(index)}
                    className="text-xs text-red-600 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
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
