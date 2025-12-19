"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";

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
      toast.error("No changes detected."); // ❌ ERROR TOAST
      return;
    }

    if (!clientId || !pickUpDate) {
      toast.error("Client and pick-up date are required."); // ❌ ERROR TOAST
      return;
    }

    setSaving(true);

    try {
      await api.put(`/admin/haulingtrip/${tripId}`, {
        ClientId: clientId,
        PickUpDate: pickUpDate,
      });

      toast.success("Hauling trip updated successfully!"); // ✅ SUCCESS TOAST

      setTimeout(() => {
        router.push("/admin/hauling");
      }, 1200);
    } catch {
      toast.error("Failed to update hauling trip."); // ❌ ERROR TOAST
    }

    setSaving(false);
  };

  /* ------------------------------
        DELETE TRIP
  ------------------------------ */
  const handleDelete = async () => {
    const confirmed = confirm(
      "Are you sure you want to delete this hauling trip?"
    );
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
    return (
      <div className="text-center py-10 text-gray-500">
        Loading trip details...
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="text-center py-10 text-red-500">Trip not found.</div>
    );
  }

  return (
    <div className="px-3 sm:px-4 md:px-0 py-3 sm:py-4">
      <div className="max-w-3xl mx-auto bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow border">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Hauling Trip #{tripId}
            </h1>
            <p className="text-gray-500 text-sm">
              Update hauling trip details or delete this record.
            </p>
          </div>

          {/* Optional: back link (UI-only, no logic impact) */}
          <button
            type="button"
            onClick={() => router.push("/admin/hauling")}
            className="
              w-full sm:w-auto px-4 py-2.5 rounded-xl border text-sm font-semibold
              border-gray-300 text-gray-700 hover:bg-gray-50
              active:scale-[0.99] transition
            "
          >
            ← Back
          </button>
        </div>

        {/* SUCCESS / ERROR MESSAGES */}
        {successMsg && (
          <div className="p-3 mb-4 bg-green-100 text-green-700 border border-green-300 rounded-xl text-sm">
            {successMsg}
          </div>
        )}
        {deleteMsg && (
          <div className="p-3 mb-4 bg-red-100 text-red-700 border border-red-300 rounded-xl text-sm">
            {deleteMsg}
          </div>
        )}
        {errorMsg && (
          <div className="p-3 mb-4 bg-red-100 text-red-700 border border-red-300 rounded-xl text-sm">
            {errorMsg}
          </div>
        )}

        {/* FORM */}
        <div className="space-y-5 sm:space-y-6">
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
        <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 mt-8 sm:mt-10">
          <button
            onClick={handleDelete}
            className="
              w-full sm:w-auto px-6 py-3 rounded-xl font-semibold
              bg-red-600 text-white shadow hover:bg-red-700
              active:scale-[0.99] transition
            "
          >
            Delete Trip
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="
              w-full sm:w-auto px-6 py-3 rounded-xl font-semibold
              bg-indigo-600 text-white shadow hover:bg-indigo-700
              disabled:opacity-50 disabled:cursor-not-allowed
              active:scale-[0.99] transition
            "
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
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
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full border border-gray-300 rounded-xl p-3 bg-white
          focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
          outline-none text-sm text-gray-700 shadow-sm transition
        "
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
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) =>
          onChange(e.target.value === "" ? null : Number(e.target.value))
        }
        className="
          w-full border border-gray-300 rounded-xl p-3 bg-white
          focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
          outline-none text-sm text-gray-700 shadow-sm transition
        "
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
