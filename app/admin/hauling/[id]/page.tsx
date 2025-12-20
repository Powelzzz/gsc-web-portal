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

  const [errorMsg, setErrorMsg] = useState("");

  // Editable fields
  const [clientId, setClientId] = useState<number | null>(null);
  const [pickUpDate, setPickUpDate] = useState("");
  const [pickUpTime, setPickUpTime] = useState("");

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

      if (t.data.pickUpDate) {
        const d = new Date(t.data.pickUpDate);
        setPickUpDate(d.toISOString().slice(0, 10));
        setPickUpTime(d.toISOString().slice(11, 16)); // HH:mm
      }
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

    const original = trip.pickUpDate
      ? new Date(trip.pickUpDate).toISOString().slice(0, 16)
      : "";

    const current = pickUpDate && pickUpTime
      ? `${pickUpDate}T${pickUpTime}`
      : "";

    return clientId !== trip.clientId || original !== current;
  };

  /* ------------------------------
        SAVE CHANGES
  ------------------------------ */
  const handleSave = async () => {
    setErrorMsg("");

    if (!hasChanges()) {
      toast.error("No changes detected.");
      return;
    }

    if (!clientId || !pickUpDate || !pickUpTime) {
      toast.error("Client, pick-up date, and time are required.");
      return;
    }

    const pickUpDateTime = `${pickUpDate}T${pickUpTime}:00`;

    setSaving(true);

    try {
      await api.put(`/admin/haulingtrip/${tripId}`, {
        ClientId: clientId,
        PickUpDate: pickUpDateTime,
      });

      toast.success("Hauling trip updated successfully!");
      router.push("/admin/hauling");
    } catch {
      toast.error("Failed to update hauling trip.");
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
      toast.success("Trip deleted.");
      router.push("/admin/hauling");
    } catch {
      toast.error("Failed to delete hauling trip.");
    }
  };

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
        <div className="flex justify-between mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Hauling Trip #{tripId}
            </h1>
            <p className="text-gray-500 text-sm">
              Update hauling trip details
            </p>
          </div>

          <button
            onClick={() => router.push("/admin/hauling")}
            className="border px-4 py-2 rounded-xl text-sm font-semibold"
          >
            ← Back
          </button>
        </div>

        {/* FORM */}
        <div className="space-y-5">
          <FormGroupSelect
            label="Client"
            value={clientId ?? ""}
            onChange={setClientId}
            options={clients.map((c: any) => ({
              value: c.id,
              label: `[${c.codeName}] ${c.registeredCompanyName}`,
            }))}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormGroup
              label="Pick-up Date"
              type="date"
              value={pickUpDate}
              onChange={setPickUpDate}
            />

            <FormGroup
              label="Pick-up Time"
              type="time"
              value={pickUpTime}
              onChange={setPickUpTime}
            />
          </div>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 mt-8">
          <button
            onClick={handleDelete}
            className="bg-red-600 text-white px-6 py-3 rounded-xl font-semibold"
          >
            Delete Trip
          </button>

          <button
            onClick={handleSave}
            disabled={saving}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-semibold"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------
        INPUT COMPONENTS
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
        className="w-full border rounded-xl p-3"
      />
    </div>
  );
}

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
        className="w-full border rounded-xl p-3"
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
