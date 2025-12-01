"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useRouter, useParams } from "next/navigation";

export default function HaulingTripDetailsPage() {
  const router = useRouter();
  const { id } = useParams();
  const tripId = Number(id);

  const [trip, setTrip] = useState<any>(null);
  const [clients, setClients] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [deleteMsg, setDeleteMsg] = useState("");

  // Editable fields
  const [clientId, setClientId] = useState<number | null>(null);
  const [pickUpDate, setPickUpDate] = useState("");

  /* ------------------------------------
        LOAD TRIP + CLIENTS
  ------------------------------------ */
  const loadData = async () => {
    try {
      const t = await api.get(`/admin/haulingtrip/${tripId}`);
      const c = await api.get("/admin/client");

      setTrip(t.data);
      setClients(c.data);

      setClientId(t.data.clientId ?? null);
      setPickUpDate(t.data.pickUpDate?.slice(0, 10));
    } catch {
      setErrorMsg("Failed to load hauling trip details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tripId]);

  /* ------------------------------
        DETECT CHANGES
  ------------------------------ */
  const hasChanges = () => {
    if (!trip) return false;

    return (
      clientId !== trip.clientId ||
      pickUpDate !== trip.pickUpDate?.slice(0, 10)
    );
  };

  /* ------------------------------
        SAVE CHANGES
  ------------------------------ */
  const handleSave = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (!hasChanges()) {
      return setErrorMsg("No changes detected.");
    }

    if (!clientId || !pickUpDate) {
      return setErrorMsg("Client and pick-up date are required.");
    }

    setSaving(true);

    try {
      await api.put(`/admin/haulingtrip/${tripId}`, {
        ClientId: clientId,
        PickUpDate: pickUpDate,
      });

      setSuccessMsg("Hauling trip updated successfully!");

      setTimeout(() => {
        router.push("/admin/hauling");
      }, 1200);
    } catch {
      setErrorMsg("Failed to update hauling trip.");
    }

    setSaving(false);
  };

  /* ------------------------------
        DELETE TRIP
  ------------------------------ */
  const handleDelete = async () => {
    const confirmed = confirm("Are you sure you want to delete this hauling trip?");
    if (!confirmed) return;

    try {
      await api.delete(`/admin/haulingtrip/${tripId}`);
      setDeleteMsg("Trip successfully deleted!");

      setTimeout(() => {
        router.push("/admin/hauling");
      }, 1200);
    } catch {
      setErrorMsg("Failed to delete hauling trip.");
    }
  };

  /* ------------------------------
        LOADING + NOT FOUND
  ------------------------------ */
  if (loading) {
    return <div className="text-center py-10 text-gray-500">Loading trip details...</div>;
  }

  if (!trip) {
    return <div className="text-center py-10 text-red-500">Trip not found.</div>;
  }

  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow border">

      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        Hauling Trip #{tripId}
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Update hauling trip details or delete this record.
      </p>

      {/* SUCCESS / ERROR MESSAGES */}
      {successMsg && (
        <div className="p-3 mb-4 bg-green-100 text-green-700 border border-green-300 rounded">
          {successMsg}
        </div>
      )}
      {deleteMsg && (
        <div className="p-3 mb-4 bg-red-100 text-red-700 border border-red-300 rounded">
          {deleteMsg}
        </div>
      )}
      {errorMsg && (
        <div className="p-3 mb-4 bg-red-100 text-red-700 border border-red-300 rounded">
          {errorMsg}
        </div>
      )}

      <div className="space-y-6">
        {/* CLIENT */}
        <FormGroupSelect
          label="Client"
          value={clientId ?? ""}
          onChange={setClientId}
          options={clients.map((c: any) => ({
            value: c.id,
            label: `[${c.codeName}] ${c.registeredCompanyName}`,
          }))}
        />

        {/* PICKUP DATE */}
        <FormGroup
          label="Pick-up Date"
          type="date"
          value={pickUpDate}
          onChange={setPickUpDate}
        />
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex justify-between mt-10">
        <button
          onClick={handleDelete}
          className="px-6 py-3 bg-red-600 text-white rounded-lg shadow hover:bg-red-700"
        >
          Delete Trip
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------
        TEXT INPUT
------------------------------------ */
function FormGroup({ label, value, onChange, type = "text" }: any) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border p-3 rounded-lg shadow-sm"
      />
    </div>
  );
}

/* ------------------------------------
        SELECT INPUT
------------------------------------ */
function FormGroupSelect({ label, value, onChange, options }: any) {
  return (
    <div>
      <label className="block text-sm text-gray-600 mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value === "" ? null : Number(e.target.value))
        }
        className="w-full border p-3 rounded-lg shadow-sm"
      >
        <option value="">Select...</option>
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
