"use client";

import { useState, useEffect } from "react";
import api from "@/lib/api";
import Link from "next/link";

export default function CreateHaulingTripPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [clientId, setClientId] = useState<number | null>(null);
  const [pickupDate, setPickupDate] = useState("");

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
    if (!clientId || !pickupDate) {
      alert("Client and pick-up date are required.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/admin/haulingtrip", {
        clientId: clientId,
        pickUpDate: pickupDate,
        driverId: null,
        status: "Pending"
      });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 1500);

      setClientId(null);
      setPickupDate("");
    } catch (err) {
      console.log(err);
      alert("Failed to create hauling trip.");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-8 rounded-xl shadow border">

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Create Hauling Trip</h1>
          <p className="text-gray-500 text-sm">Record an unassigned trip</p>
        </div>

        <Link
          href="/admin/hauling"
          className="text-indigo-600 hover:underline font-medium text-sm"
        >
          ← Back
        </Link>
      </div>

      {/* CLIENT SELECT */}
      <div className="mb-5">
        <label className="text-sm font-semibold text-gray-700 mb-1 block">
          Select Client
        </label>

        {clientsLoading ? (
          <div className="text-gray-500 text-sm">Loading clients...</div>
        ) : (
          <select
            value={clientId ?? ""}
            onChange={(e) => setClientId(Number(e.target.value))}
            className="
              w-full border rounded-lg p-3 text-gray-700 
              focus:ring-2 focus:ring-indigo-500
            "
          >
            <option value="">Choose Client</option>
            {clients.map((c) => (
              <option key={c.id} value={c.id}>
                {c.registeredCompanyName}
              </option>
            ))}
          </select>
        )}
      </div>

      {/* PICKUP DATE */}
      <div className="mb-5">
        <label className="text-sm font-semibold text-gray-700 mb-1 block">
          Pick-up Date
        </label>

        <input
          type="date"
          value={pickupDate}
          onChange={(e) => setPickupDate(e.target.value)}
          className="
            w-full border rounded-lg p-3 
            text-gray-700 focus:ring-2 focus:ring-indigo-500
          "
        />
      </div>

      {/* SUBMIT BUTTON */}
      <button
        onClick={handleSave}
        disabled={loading}
        className="
          w-full bg-indigo-600 text-white py-3 rounded-lg
          font-semibold hover:bg-indigo-700 disabled:opacity-50
        "
      >
        {loading ? "Saving..." : "Save Hauling Trip"}
      </button>

      {/* SUCCESS POPUP */}
      {success && (
        <div className="
          fixed inset-0 flex items-center justify-center 
          bg-black bg-opacity-40
        ">
          <div className="bg-white p-8 rounded-xl shadow-lg text-center w-72">
            <div className="text-5xl text-green-500 mb-3">✔️</div>
            <p className="text-lg font-semibold text-green-600">
              Trip Created!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
