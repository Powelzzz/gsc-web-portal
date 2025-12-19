"use client";

import { useState, useRef } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";

const LeafletMap = dynamic(() => import("components/LeafletMap"), {
  ssr: false,
});

export default function CreateClientPage() {
  const router = useRouter();

  const [codeName, setCodeName] = useState("");
  const [registeredName, setRegisteredName] = useState("");
  const [pickupLocation, setPickupLocation] = useState("");
  const [preferredSchedule, setPreferredSchedule] = useState("");
  const [feePerKg, setFeePerKg] = useState("");
  const [pickUpLatLong, setPickUpLatLong] = useState("");

  // Autocomplete states
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeout = useRef<any>(null);

  // NEW FIELDS
  const [clientServiceRate, setClientServiceRate] = useState("");
  const [minimumCharging, setMinimumCharging] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🔍 MAPBOX AUTOCOMPLETE SEARCH
  const handlePickupLocationChange = async (value: string) => {
    setPickupLocation(value);

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
      if (!value || value.length < 2) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }

      const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
        value
      )}.json?access_token=${
        process.env.NEXT_PUBLIC_MAPBOX_TOKEN
      }&country=ph&autocomplete=true&types=poi,address,place&proximity=123.8854,10.3157&bbox=123.80,10.20,124.00,10.50&limit=5&language=en`;

      const res = await fetch(url);
      const data = await res.json();

      setSuggestions(data.features || []);
      setShowSuggestions(true);
    }, 350);
  };

  // 📌 When user selects a suggestion
  const handleSuggestionClick = (item: any) => {
    const [lng, lat] = item.center; // Mapbox format is [lng, lat]

    setPickupLocation(item.place_name);
    setPickUpLatLong(`${lat},${lng}`);

    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/admin/client", {
        codeName,
        registeredCompanyName: registeredName,
        pickUpLocation: pickupLocation,
        preferredHaulingSchedule: preferredSchedule,
        driverAndLoaderPerKgFee: Number(feePerKg),

        clientServiceRate: clientServiceRate ? Number(clientServiceRate) : null,
        minimumCharging: minimumCharging ? Number(minimumCharging) : null,
        serviceType: serviceType || null,
        paymentTerms: paymentTerms || null,

        pickUpLatLong,
      });

      toast.success("Client successfully added!");

      setTimeout(() => {
        router.push("/admin/clients");
      }, 1200);
    } catch (err) {
      toast.error("Failed to save client. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="px-3 sm:px-4 md:px-0 py-3 sm:py-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md border p-4 sm:p-6 md:p-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">
          Create New Client
        </h1>

        {error && (
          <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 border rounded-lg">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5 sm:space-y-6">
          {/* Basic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormGroup label="Code Name" value={codeName} onChange={setCodeName} />
            <FormGroup
              label="Registered Company Name"
              value={registeredName}
              onChange={setRegisteredName}
            />
          </div>

          {/* AUTOCOMPLETE INPUT */}
          <div className="relative">
            <FormGroup
              label="Pick-up Location"
              value={pickupLocation}
              onChange={handlePickupLocationChange}
              placeholder="Search address / place..."
            />

            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-50 w-full bg-white border rounded-xl shadow-lg max-h-60 overflow-y-auto mt-2">
                {suggestions.map((item: any, idx) => (
                  <li
                    key={idx}
                    onClick={() => handleSuggestionClick(item)}
                    className="p-3 hover:bg-gray-50 cursor-pointer text-sm"
                  >
                    {item.place_name}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* MAP + COORDINATES */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Pick-up Coordinates (Auto + Map Sync)
            </label>

            <div className="overflow-hidden rounded-xl border">
              <LeafletMap onSelect={setPickUpLatLong} latLong={pickUpLatLong} />
            </div>

            <input
              type="text"
              value={pickUpLatLong}
              readOnly
              className="w-full border rounded-xl p-3 bg-gray-100 text-sm"
            />
          </div>

          {/* Schedule + Fee */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormGroup
              label="Preferred Schedule"
              value={preferredSchedule}
              onChange={setPreferredSchedule}
            />
            <FormGroup
              label="Fee per KG (Driver & Loader)"
              value={feePerKg}
              type="number"
              onChange={setFeePerKg}
            />
          </div>

          {/* New fields (stack on mobile, 2-col on sm+) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormGroup
              label="Client Service Rate (₱)"
              value={clientServiceRate}
              type="number"
              onChange={setClientServiceRate}
            />

            <FormGroup
              label="Minimum Charging (₱)"
              value={minimumCharging}
              type="number"
              onChange={setMinimumCharging}
            />

            <FormGroup
              label="Service Type"
              value={serviceType}
              onChange={setServiceType}
            />

            <FormGroup
              label="Payment Terms"
              value={paymentTerms}
              onChange={setPaymentTerms}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-50 transition"
          >
            {loading ? "Saving..." : "Save Client"}
          </button>
        </form>
      </div>
    </div>
  );
}

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
        className="w-full border rounded-xl p-3 shadow-sm text-sm"
      />
    </div>
  );
}
