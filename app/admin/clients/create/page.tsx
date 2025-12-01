"use client";

import { useState } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

export default function CreateClientPage() {
  const router = useRouter();

  const [codeName, setCodeName] = useState("");
  const [registeredName, setRegisteredName] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [preferredSchedule, setPreferredSchedule] = useState("");
  const [feePerKg, setFeePerKg] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/admin/client", {
        codeName,
        registeredCompanyName: registeredName,
        pickUpLocation: pickupLocation,
        preferredSchedule,
        driverAndLoaderPerKgFee: Number(feePerKg),
      });

      router.push("/admin/clients");
    } catch (err: any) {
      setError("Failed to save client. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-8 border">

      {/* TITLE */}
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        Create New Client
      </h1>

      {/* ERROR */}
      {error && (
        <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 border border-red-300 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Code Name */}
        <FormGroup
          label="Code Name"
          value={codeName}
          onChange={setCodeName}
          placeholder="Ex: ABC Corp"
        />

        {/* Registered Company Name */}
        <FormGroup
          label="Registered Company Name"
          value={registeredName}
          onChange={setRegisteredName}
          placeholder="Ex: ABC Corporation Philippines"
        />

        {/* Pick-up Location */}
        <FormGroup
          label="Pick-up Location"
          value={pickupLocation}
          onChange={setPickupLocation}
          placeholder="Ex: Mandaue City"
        />

        {/* Preferred Hauling Schedule */}
        <FormGroup
          label="Preferred Schedule"
          value={preferredSchedule}
          onChange={setPreferredSchedule}
          placeholder="Ex: Every Monday & Thursday"
        />

        {/* Fee per KG */}
        <FormGroup
          label="Fee per KG (Driver & Loader)"
          value={feePerKg}
          onChange={setFeePerKg}
          type="number"
          placeholder="Ex: 5"
        />

        {/* BUTTON */}
        <button
          type="submit"
          disabled={loading}
          className="
            w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold 
            shadow hover:bg-indigo-700 transition disabled:opacity-50
          "
        >
          {loading ? "Saving..." : "Save Client"}
        </button>
      </form>
    </div>
  );
}

/* 🔥 Reusable Form Component */
function FormGroup({ label, value, onChange, type = "text", placeholder }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="
          w-full border border-gray-300 rounded-lg p-3 
          focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 
          transition shadow-sm text-gray-700
        "
        required
      />
    </div>
  );
}
