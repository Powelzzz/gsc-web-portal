"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import { FaUpload, FaPlusCircle, FaHistory } from "react-icons/fa";

export default function GenerateBillingPage() {
  // ===============================
  // BILLING FORM
  // ===============================
  const [clientId, setClientId] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [quantity, setQuantity] = useState("");
  const [rate, setRate] = useState("");
  const [amount, setAmount] = useState("");
  const [receiptNo, setReceiptNo] = useState("");

  // ===============================
  // LISTS
  // ===============================
  const [clients, setClients] = useState<any[]>([]);
  const [serviceTypes, setServiceTypes] = useState<any[]>([]);
  const [haulingTrips, setHaulingTrips] = useState<any[]>([]);
  const [selectedTripIds, setSelectedTripIds] = useState<number[]>([]);
  const [invoiceHistory, setInvoiceHistory] = useState<any[]>([]);

  // ===============================
  // UPLOAD
  // ===============================
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [receiverName, setReceiverName] = useState("");
  const [invoiceNo, setInvoiceNo] = useState("");

  // ===============================
  // LOAD INITIAL DATA
  // ===============================
  useEffect(() => {
    loadClients();
    loadServiceRates();
    loadHaulingTrips();
    loadInvoiceHistory();
  }, []);

  const loadClients = async () => {
    const res = await api.get("/Admin/client");
    setClients(res.data);
  };

  const loadServiceRates = async () => {
    const res = await api.get("/Accounting/rates");
    setServiceTypes(res.data);
  };

  const loadHaulingTrips = async () => {
    const res = await api.get("/Admin/haulingtrip");
    setHaulingTrips(res.data);
  };

  const loadInvoiceHistory = async () => {
    const res = await api.get("/Accounting/invoices");
    setInvoiceHistory(res.data);
  };

  // ===============================
  // AUTO CALCULATE AMOUNT
  // ===============================
  useEffect(() => {
    if (!quantity || !rate) return setAmount("");
    const q = parseFloat(quantity);
    const r = parseFloat(rate);
    if (!isNaN(q) && !isNaN(r)) setAmount((q * r).toFixed(2));
  }, [quantity, rate]);

  // ===============================
  // GENERATE INVOICE
  // ===============================
  const generateInvoice = async () => {
    try {
      const dto = {
        clientId: parseInt(clientId),
        haulingTripIds: selectedTripIds,
        serviceType,
        invoiceNo: receiptNo,
        withheldTaxAmount: "0",
      };

      await api.post("/Accounting/invoices/generate", dto);
      alert("Invoice generated successfully!");
      loadInvoiceHistory();
    } catch {
      alert("Error generating invoice.");
    }
  };

  // ===============================
  // UPLOAD BILLING SENT INFO
  // ===============================
  const uploadBillingInfo = async () => {
    if (!file) return alert("Please select an image first.");

    const formData = new FormData();
    formData.append("file", file);

    const uploadRes = await api.post("/upload/invoice-image", formData, {
      headers: { "Content-Type": "multipart/form-data" },
      onUploadProgress: (p) => {
        const total = p.total || 1;
        setUploadProgress(Math.round((p.loaded * 100) / total));
      },
    });

    const dto = {
      receiverFullName: receiverName,
      sentInvoiceImagePath: uploadRes.data.filePath,
    };

    await api.post(`/Accounting/invoices/${invoiceNo}/sent`, dto);

    alert("Billing info uploaded!");

    setPreview(null);
    setUploadProgress(0);
    setFile(null);
    setReceiverName("");
    setInvoiceNo("");

    loadInvoiceHistory();
  };

  return (
    <div className="p-6 space-y-10">

      {/* HEADER */}
      <div className="bg-gradient-to-r from-blue-600 to-blue-800 text-white p-6 rounded-xl shadow-lg">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FaPlusCircle /> Billing & Invoice Module
        </h1>
        <p className="text-blue-100 mt-1">
          Create invoices, upload sent billing photos, and view full invoice history.
        </p>
      </div>

      {/* CREATE INVOICE */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Create New Invoice</h2>

        {/* CLIENT */}
        <label className="label">Client</label>
        <select
          className="input mb-3"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
        >
          <option value="">Select Client</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.CodeName}
            </option>
          ))}
        </select>

        {/* SERVICE TYPE */}
        <label className="label">Service Type</label>
        <select
          className="input mb-3"
          value={serviceType}
          onChange={(e) => setServiceType(e.target.value)}
        >
          <option value="">Select Service</option>
          {serviceTypes.map((s) => (
            <option key={s.id} value={s.serviceType}>
              {s.serviceType}
            </option>
          ))}
        </select>

        {/* HAULING TRIPS */}
        <label className="label">Hauling Trips</label>
        <select
          multiple
          className="input h-36 mb-3"
          onChange={(e) =>
            setSelectedTripIds(
              Array.from(e.target.selectedOptions, (o) => parseInt(o.value))
            )
          }
        >
          {haulingTrips
            .filter((t) => t.clientId === parseInt(clientId))
            .map((t) => (
              <option key={t.id} value={t.id}>
                Trip #{t.id} — {t.weightHauled} kg
              </option>
            ))}
        </select>

        {/* WEIGHT / RATE / AUTO AMOUNT */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <input
            className="input"
            placeholder="Weight (kg)"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />

          <input
            className="input"
            placeholder="Rate"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
          />

          <input
            className="input bg-gray-100 font-semibold"
            placeholder="Amount (auto)"
            value={amount}
            readOnly
          />
        </div>

        {/* RECEIPT NO */}
        <input
          className="input mt-4"
          placeholder="Receipt No"
          value={receiptNo}
          onChange={(e) => setReceiptNo(e.target.value)}
        />

        <button onClick={generateInvoice} className="btn-primary mt-6">
          <FaPlusCircle /> Generate Invoice
        </button>
      </div>

      {/* INVOICE HISTORY */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-700 mb-4 flex items-center gap-3">
          <FaHistory /> Invoice History
        </h2>

        <table className="w-full border rounded-lg overflow-hidden">
          <thead className="bg-gray-100 text-gray-700">
            <tr>
              <th className="p-3 border">Invoice No</th>
              <th className="p-3 border">Client</th>
              <th className="p-3 border">Amount</th>
              <th className="p-3 border">Status</th>
            </tr>
          </thead>

          <tbody>
            {invoiceHistory.map((inv, i) => (
              <tr
                key={inv.id}
                className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}
              >
                <td className="p-3 border">{inv.invoiceNo}</td>
                <td className="p-3 border">{inv.clientId}</td>
                <td className="p-3 border text-green-700 font-semibold">
                  {inv.netAmount}
                </td>
                <td className="p-3 border">
                  {inv.dateSent ? (
                    <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                      Sent
                    </span>
                  ) : (
                    <span className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                      Pending
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* UPLOAD BILLING INFO */}
      <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-700 mb-4">Upload Billing Information</h2>

        <input
          className="input mb-3"
          placeholder="Invoice No"
          value={invoiceNo}
          onChange={(e) => setInvoiceNo(e.target.value)}
        />

        <input
          className="input mb-3"
          placeholder="Receiver Name"
          value={receiverName}
          onChange={(e) => setReceiverName(e.target.value)}
        />

        <label className="label">Upload Image</label>
        <input
          type="file"
          className="input"
          onChange={(e) => {
            const f = e.target.files?.[0] || null;
            setFile(f);
            setPreview(f ? URL.createObjectURL(f) : null);
          }}
        />

        {preview && (
          <img
            src={preview}
            className="mt-4 h-48 rounded-xl border object-cover shadow"
          />
        )}

        {uploadProgress > 0 && (
          <div className="mt-4 bg-gray-200 h-3 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-3"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        )}

        <button
          onClick={uploadBillingInfo}
          disabled={!file}
          className={`btn-primary mt-6 flex items-center gap-2 ${
            !file ? "opacity-50 cursor-not-allowed" : ""
          }`}
        >
          <FaUpload /> Upload Billing Info
        </button>
      </div>
    </div>
  );
}
