"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";

type TripItem = {
  id: number;
  pickUpDate: string;
  receiptNumber: string | null;
  weightHauled: number;
  wasteType: string | null;
};

type ServiceRate = {
  id: number;
  clientId: number;
  serviceType: string;
  ratePerKg: string;
  paymentTerms: string;
};

type Client = {
  id: number;
  codeName: string;
  registeredCompanyName: string;
};

export default function BillingGeneratePage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [selectedClient, setSelectedClient] = useState("");

  const [serviceType, setServiceType] = useState("Hauling");
  const [billableTrips, setBillableTrips] = useState<TripItem[]>([]);
  const [selectedTrips, setSelectedTrips] = useState<TripItem[]>([]);

  const [activeRate, setActiveRate] = useState<ServiceRate | null>(null);

  const [loadingClients, setLoadingClients] = useState(true);
  const [loadingTrips, setLoadingTrips] = useState(false);
  const [loadingRate, setLoadingRate] = useState(false);

  const [withholding, setWithholding] = useState(0);
  const vatRate = 0.12;

  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [invoiceError, setInvoiceError] = useState("");
  const [savingInvoice, setSavingInvoice] = useState(false);

  // LOAD ALL CLIENTS
  useEffect(() => {
    async function loadClients() {
      try {
        const res = await api.get("/admin/client");
        setClients(res.data);
      } catch (err) {
        console.error("Failed to load clients", err);
      } finally {
        setLoadingClients(false);
      }
    }
    loadClients();
  }, []);

  // LOAD BILLABLE TRIPS + ACTIVE RATE WHEN CLIENT CHANGES
  useEffect(() => {
    if (!selectedClient) {
      setBillableTrips([]);
      setSelectedTrips([]);
      setActiveRate(null);
      return;
    }

    async function loadTrips() {
      try {
        setLoadingTrips(true);
        const res = await api.get(`/accounting/billable-trips?clientId=${selectedClient}`);
        setBillableTrips(res.data);
        setSelectedTrips([]);
      } catch (err) {
        console.error("Failed to load billable trips", err);
        setBillableTrips([]);
      } finally {
        setLoadingTrips(false);
      }
    }

    async function loadActiveRate() {
      try {
        setLoadingRate(true);
        const res = await api.get("/accounting/rates", {
          params: { clientId: selectedClient, activeOnly: true },
        });

        if (Array.isArray(res.data) && res.data.length > 0) {
          setActiveRate(res.data[0]);
        } else {
          setActiveRate(null);
        }
      } catch (err) {
        console.error("Failed to load active rate", err);
        setActiveRate(null);
      } finally {
        setLoadingRate(false);
      }
    }

    loadTrips();
    loadActiveRate();
  }, [selectedClient]);

  // SELECT / UNSELECT TRIPS
  function toggleTrip(trip: TripItem) {
    const exists = selectedTrips.some((t) => t.id === trip.id);
    if (exists) {
      setSelectedTrips((prev) => prev.filter((t) => t.id !== trip.id));
    } else {
      setSelectedTrips((prev) => [...prev, trip]);
    }
  }

  // COMPUTATIONS
  function computeSubtotal() {
    if (!activeRate) return 0;
    const rate = parseFloat(activeRate.ratePerKg);
    return selectedTrips.reduce((sum, t) => sum + (t.weightHauled ?? 0) * rate, 0);
  }

  const subtotal = computeSubtotal();
  const vat = subtotal * vatRate;
  const total = subtotal + vat - withholding;

  // ------------------------------------------------------------
  // STEP 3: GENERATE INVOICE FUNCTION
  // ------------------------------------------------------------
  async function handleGenerateInvoice() {
    setInvoiceError("");

    // VALIDATIONS
    if (!selectedClient) return setInvoiceError("Please select a client.");
    if (!invoiceNumber.trim()) return setInvoiceError("Invoice number is required.");
    if (selectedTrips.length === 0)
      return setInvoiceError("Please select at least one hauling trip.");
    if (!activeRate)
      return setInvoiceError("No active rate found for this client.");

    const payload = {
      clientId: Number(selectedClient),
      haulingTripIds: selectedTrips.map((t) => t.id),
      serviceType,
      invoiceNo: invoiceNumber,
      withheldTaxAmount: withholding.toString(),
    };

    try {
      setSavingInvoice(true);
      console.log("Payload sending:", payload);
      const res = await api.post("/accounting/invoices/generate", payload);

      console.log("Invoice created:", res.data);
      alert("Invoice successfully generated!");

      // Reset UI
      setInvoiceNumber("");
      setSelectedTrips([]);
    } catch (err) {
      console.error("Failed to generate invoice", err);
      alert("Failed to generate invoice.");
    } finally {
      setSavingInvoice(false);
    }
  }

  // RENDER UI
  return (
    <div className="p-6 space-y-8">
      {/* TITLE */}
      <header>
        <h1 className="text-2xl font-bold text-gray-800">Generate Billing / Invoice</h1>
        <p className="text-gray-500 text-sm">
          Select client and hauling trips to automatically generate a billing invoice.
        </p>
      </header>

      {/* CLIENT INFO */}
      <section className="bg-white p-6 rounded-xl shadow border">
        <h2 className="text-lg font-semibold mb-4">Client Information</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* CLIENT SELECT */}
          <div>
            <label className="text-sm font-medium">Client</label>
            <select
              value={selectedClient}
              onChange={(e) => setSelectedClient(e.target.value)}
              className="w-full mt-1 border rounded-lg px-3 py-2"
            >
              <option value="">Select Client</option>
              {loadingClients ? (
                <option>Loading...</option>
              ) : (
                clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.codeName || c.registeredCompanyName}
                  </option>
                ))
              )}
            </select>

            {/* ACTIVE RATE DISPLAY */}
            <div className="mt-3 text-sm text-gray-600">
              {loadingRate && selectedClient && (
                <span className="italic text-gray-400">Loading active rate…</span>
              )}

              {!loadingRate && selectedClient && activeRate && (
                <div className="space-y-1">
                  <p>
                    <strong>Active Rate:</strong> ₱ {parseFloat(activeRate.ratePerKg).toFixed(2)} / kg
                  </p>
                  <p>
                    <strong>Service Type:</strong> {activeRate.serviceType}
                  </p>
                  <p>
                    <strong>Payment Terms:</strong> {activeRate.paymentTerms}
                  </p>
                </div>
              )}

              {!loadingRate && selectedClient && !activeRate && (
                <span className="text-red-500 text-xs">No active service rate found for this client.</span>
              )}
            </div>
          </div>

          {/* SERVICE TYPE UI ONLY */}
          <div>
            <label className="text-sm font-medium">Service Type (UI Only)</label>
            <select
              value={serviceType}
              onChange={(e) => setServiceType(e.target.value)}
              className="w-full mt-1 border rounded-lg px-3 py-2"
            >
              <option>Hauling</option>
              <option>Bulk Waste</option>
              <option>Recyclables Pickup</option>
            </select>
          </div>
        </div>
      </section>

      {/* BILLABLE TRIPS TABLE */}
      <section className="bg-white p-6 rounded-xl shadow border">
        <h2 className="text-lg font-semibold mb-4">Select Hauling Trips</h2>

        {loadingTrips ? (
          <div className="text-gray-500 italic">Loading trips...</div>
        ) : billableTrips.length === 0 ? (
          <div className="text-gray-400 italic">No billable trips available.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead className="bg-gray-100">
                <tr>
                  <th className="border px-2 py-2 text-center w-12">✔</th>
                  <th className="border px-2 py-2">Pick-up Date</th>
                  <th className="border px-2 py-2">WM No.</th>
                  <th className="border px-2 py-2 text-right">Weight (kg)</th>
                  <th className="border px-2 py-2">Waste Type</th>
                </tr>
              </thead>

              <tbody>
                {billableTrips.map((trip) => {
                  const isSelected = selectedTrips.some((t) => t.id === trip.id);
                  return (
                    <tr
                      key={trip.id}
                      className={`border-t hover:bg-gray-50 ${isSelected ? "bg-indigo-50" : ""}`}
                    >
                      <td className="text-center border">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleTrip(trip)}
                        />
                      </td>

                      <td className="px-2 py-2">{trip.pickUpDate.substring(0, 10)}</td>
                      <td className="px-2 py-2">{trip.receiptNumber || "–"}</td>
                      <td className="px-2 py-2 text-right">{trip.weightHauled}</td>
                      <td className="px-2 py-2">{trip.wasteType || "–"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* INVOICE PREVIEW */}
      <section className="bg-white p-6 rounded-xl shadow border">
        <h2 className="text-lg font-semibold mb-4">Invoice Preview</h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-4">
          {/* INVOICE DATE */}
          <div>
            <label className="text-sm font-medium">Invoice Date</label>
            <input type="date" className="w-full mt-1 border rounded-lg px-3 py-2" />
          </div>

          {/* INVOICE NUMBER */}
          <div>
            <label className="text-sm font-medium">Invoice Number</label>
            <input
              type="text"
              value={invoiceNumber}
              onChange={(e) => {
                setInvoiceNumber(e.target.value);
                setInvoiceError("");
              }}
              placeholder="Enter Invoice Number"
              className={`w-full mt-1 border rounded-lg px-3 py-2 ${
                invoiceError ? "border-red-500" : ""
              }`}
            />
            {invoiceError && (
              <p className="text-red-500 text-xs mt-1">{invoiceError}</p>
            )}
          </div>

          {/* PAYMENT TERMS */}
          <div>
            <label className="text-sm font-medium">Payment Terms</label>
            <input
              type="text"
              value={activeRate?.paymentTerms || ""}
              readOnly
              className="w-full mt-1 border rounded-lg px-3 py-2 bg-gray-100"
            />
          </div>
        </div>

        {/* PREVIEW TABLE */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm border">
            <thead className="bg-gray-100">
              <tr>
                <th className="border px-2 py-2">Pick-up Date</th>
                <th className="border px-2 py-2">Weight (kg)</th>
                <th className="border px-2 py-2">Rate per KG</th>
                <th className="border px-2 py-2">Amount</th>
              </tr>
            </thead>

            <tbody>
              {selectedTrips.map((trip) => {
                const rate = activeRate ? parseFloat(activeRate.ratePerKg) : 0;
                const amount = trip.weightHauled * rate;

                return (
                  <tr key={trip.id} className="border-t">
                    <td className="px-2 py-2">{trip.pickUpDate.substring(0, 10)}</td>
                    <td className="px-2 py-2 text-right">{trip.weightHauled}</td>
                    <td className="px-2 py-2 text-right">₱ {rate.toFixed(2)}</td>
                    <td className="px-2 py-2 text-right">₱ {amount.toFixed(2)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* SUMMARY */}
      <section className="bg-white p-6 rounded-xl shadow border w-full md:w-1/2 ml-auto">
        <h2 className="text-lg font-semibold mb-4">Summary</h2>

        <div className="flex justify-between py-1">
          <span>Subtotal</span>
          <span>₱ {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>

        <div className="flex justify-between py-1">
          <span>VAT (12%)</span>
          <span>₱ {vat.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>

        <div className="flex justify-between items-center py-1">
          <span>Withholding Tax</span>
          <input
            type="number"
            value={withholding}
            onChange={(e) => setWithholding(parseFloat(e.target.value || "0"))}
            className="w-32 border rounded px-2 py-1 text-right"
          />
        </div>

        <div className="flex justify-between py-2 border-t font-semibold text-lg">
          <span>Total</span>
          <span>₱ {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
        </div>
      </section>

      {/* GENERATE BUTTON */}
      <div className="flex justify-end">
        <button
          onClick={handleGenerateInvoice}
          disabled={savingInvoice}
          className={`px-6 py-3 rounded-lg shadow font-medium text-white 
            ${savingInvoice ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700"}`}
        >
          {savingInvoice ? "Generating..." : "Generate Invoice"}
        </button>
      </div>
    </div>
  );
}
