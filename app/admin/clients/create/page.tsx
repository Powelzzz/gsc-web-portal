"use client";

import { useState, useRef } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { SearchBoxCore } from "@mapbox/search-js-core";
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

    const lng = 123.8854; // Cebu City center
    const lat = 10.3157;

    const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(
      value
    )}.json?access_token=${
      process.env.NEXT_PUBLIC_MAPBOX_TOKEN
    }&country=ph&autocomplete=true&types=poi,address,place&proximity=123.8854,10.3157&bbox=123.80,10.20,124.00,10.50&limit=5&language=en`;


    console.log("MAPBOX QUERY:", url); // Debugging

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

    toast.success("Client successfully added!");  // ✅ SUCCESS TOAST

    setTimeout(() => {
      router.push("/admin/clients");
    }, 1200);

  } catch (err) {
    toast.error("Failed to save client. Please try again.");  // ❌ ERROR TOAST
  }

  setLoading(false);
};

  return (
    <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-8 border">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Create New Client</h1>

      {error && (
        <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 border">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormGroup label="Code Name" value={codeName} onChange={setCodeName} />
        <FormGroup
          label="Registered Company Name"
          value={registeredName}
          onChange={setRegisteredName}
        />

        {/* AUTOCOMPLETE INPUT */}
        <div className="relative">
          <FormGroup
            label="Pick-up Location"
            value={pickupLocation}
            onChange={handlePickupLocationChange}
          />

          {showSuggestions && suggestions.length > 0 && (
            <ul className="absolute z-50 w-full bg-white border rounded-lg shadow-lg max-h-60 overflow-y-auto">
              {suggestions.map((item: any, idx) => (
                <li
                  key={idx}
                  onClick={() => handleSuggestionClick(item)}
                  className="p-3 hover:bg-gray-100 cursor-pointer text-sm"
                >
                  {item.place_name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* MAP + COORDINATES */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pick-up Coordinates (Auto + Map Sync)
          </label>

          <LeafletMap onSelect={setPickUpLatLong} latLong={pickUpLatLong} />

          <input
            type="text"
            value={pickUpLatLong}
            readOnly
            className="w-full mt-2 border rounded-lg p-3 bg-gray-100"
          />
        </div>

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

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save Client"}
        </button>
      </form>
    </div>
  );
}

function FormGroup({ label, value, onChange, type = "text", placeholder }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border rounded-lg p-3 shadow-sm"
      />
    </div>
  );
}
