"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import Link from "next/link";
import toast from "react-hot-toast";

export default function CreateHaulingTripPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [clientId, setClientId] = useState<number | null>(null);
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("");

  const [loading, setLoading] = useState(false);
  const [clientsLoading, setClientsLoading] = useState(true);

  const [success, setSuccess] = useState(false);

  const loadClients = async () => {
    try {
      const res = await api.get("/admin/client");
      setClients(res.data);
    } catch (err) {
      console.log("Error loading clients:", err);
    } finally {
      setClientsLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, []);

  const handleSave = async () => {
    if (!clientId || !pickupDate || !pickupTime) {
      toast.error("Client, pick-up date, and pick-up time are required.");
      return;
    }

    // ✅ Combine date + time into one ISO datetime string for PickUpDate
    const pickUpDateTime = `${pickupDate}T${pickupTime}:00`;

    setLoading(true);

    try {
      await api.post("/admin/haulingtrip", {
        clientId: clientId,
        pickUpDate: pickUpDateTime, // ✅ date+time stored here
        driverId: null,
        status: "Pending",
      });

      toast.success("Hauling trip created successfully!");

      // Reset fields
      setClientId(null);
      setPickupDate("");
      setPickupTime("");
    } catch (err) {
      console.log(err);
      toast.error("Failed to create hauling trip.");
    }

    setLoading(false);
  };

  return (
    <div className="px-3 sm:px-4 md:px-0 py-3 sm:py-4">
      <div className="max-w-xl mx-auto bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow border">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Create Hauling Trip
            </h1>
            <p className="text-gray-500 text-sm">Record an unassigned trip</p>
          </div>

          <Link
            href="/admin/hauling"
            className="
              w-full sm:w-auto inline-flex items-center justify-center
              rounded-xl border border-gray-300 px-4 py-2.5
              text-sm font-semibold text-gray-700 hover:bg-gray-50
              active:scale-[0.99] transition
            "
          >
            ← Back
          </Link>
        </div>

        {/* FORM */}
        <div className="space-y-5">
          {/* CLIENT SELECT */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">
              Select Client
            </label>

            {clientsLoading ? (
              <div className="text-gray-500 text-sm">Loading clients...</div>
            ) : (
              <select
                value={clientId ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setClientId(val ? Number(val) : null);
                }}
                className="
                  w-full border border-gray-300 rounded-xl p-3 text-gray-700 bg-white
                  focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                  outline-none shadow-sm transition
                "
              >
                <option value="">Choose Client</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.registeredCompanyName || c.codeName}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* PICKUP DATE */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">
              Pick-up Date
            </label>

            <input
              type="date"
              value={pickupDate}
              onChange={(e) => setPickupDate(e.target.value)}
              className="
                w-full border border-gray-300 rounded-xl p-3
                text-gray-700 bg-white
                focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                outline-none shadow-sm transition
              "
            />
          </div>

          {/* PICKUP TIME */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">
              Pick-up Time
            </label>

            <input
              type="time"
              value={pickupTime}
              onChange={(e) => setPickupTime(e.target.value)}
              step="300"
              className="
                w-full border border-gray-300 rounded-xl p-3
                bg-white text-gray-700
                focus:ring-2 focus:ring-indigo-500
                focus:border-indigo-500
                outline-none shadow-sm
              "
            />
          </div>

          {/* SUBMIT BUTTON */}
          <button
            onClick={handleSave}
            disabled={loading}
            className="
              w-full bg-indigo-600 text-white py-3 rounded-xl
              font-semibold shadow hover:bg-indigo-700
              active:scale-[0.99] transition disabled:opacity-50 disabled:cursor-not-allowed
            "
          >
            {loading ? "Saving..." : "Save Hauling Trip"}
          </button>
        </div>

        {/* SUCCESS POPUP */}
        {success && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40 px-4">
            <div className="bg-white p-6 rounded-2xl shadow-lg text-center w-full max-w-xs">
              <div className="text-5xl text-green-500 mb-3">✔️</div>
              <p className="text-lg font-semibold text-green-600">
                Trip Created!
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
