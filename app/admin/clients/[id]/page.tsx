"use client";

import { useEffect, useState, useRef } from "react";
import api from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import dynamic from "next/dynamic";
import toast from "react-hot-toast";

const LeafletMap = dynamic(() => import("components/LeafletMap"), {
  ssr: false,
});

export default function ClientDetailsPage() {
  const router = useRouter();
  const { id } = useParams();

  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Editable fields (same order as Create)
  const [codeName, setCodeName] = useState("");
  const [registeredName, setRegisteredName] = useState("");
  const [pickUpLocation, setPickUpLocation] = useState("");
  const [pickUpLatLong, setPickUpLatLong] = useState("");

  const [preferredSchedule, setPreferredSchedule] = useState("");
  const [feePerKg, setFeePerKg] = useState("");

  const [clientServiceRate, setClientServiceRate] = useState("");
  const [minimumCharging, setMinimumCharging] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");

  // autocomplete
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchTimeout = useRef<any>(null);

  // Load existing client
  const loadClient = async () => {
    try {
      const res = await api.get(`/admin/client/${id}`);
      const c = res.data;

      setClient(c);

      setCodeName(c.codeName ?? "");
      setRegisteredName(c.registeredCompanyName ?? "");
      setPickUpLocation(c.pickUpLocation ?? "");
      setPickUpLatLong(c.pickUpLatLong ?? "");

      setPreferredSchedule(c.preferredHaulingSchedule ?? "");
      setFeePerKg(c.driverAndLoaderPerKgFee ?? "");

      setClientServiceRate(c.clientServiceRate ?? "");
      setMinimumCharging(c.minimumCharging ?? "");

      if (c.serviceRate) {
        setServiceType(c.serviceRate.serviceType ?? "");
        setPaymentTerms(c.serviceRate.paymentTerms ?? "");
      }
    } catch {
      setErrorMsg("Failed to load client.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClient();
  }, [id]);

  // AUTOCOMPLETE — same as Create page
  const handlePickupLocationChange = (value: string) => {
    setPickUpLocation(value);

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

  const handleSuggestionClick = (item: any) => {
    const [lng, lat] = item.center;
    setPickUpLocation(item.place_name);
    setPickUpLatLong(`${lat},${lng}`);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handleSave = async () => {
    setErrorMsg("");
    setSuccessMsg("");
    setSaving(true);

    try {
      await api.put(`/admin/client/${id}`, {
        CodeName: codeName,
        RegisteredCompanyName: registeredName,
        PickUpLocation: pickUpLocation,
        PickUpLatLong: pickUpLatLong,
        PreferredHaulingSchedule: preferredSchedule,
        DriverAndLoaderPerKgFee: feePerKg ? Number(feePerKg) : null,
        ClientServiceRate: clientServiceRate ? Number(clientServiceRate) : null,
        MinimumCharging: minimumCharging ? Number(minimumCharging) : null,
        ServiceType: serviceType,
        PaymentTerms: paymentTerms,
      });

      toast.success("Client successfully updated!");
      setTimeout(() => router.push("/admin/clients"), 1200);
    } catch (err) {
      toast.error("Failed to update client.");
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="px-3 sm:px-4 md:px-0 py-6">
        <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border p-5 sm:p-6 text-center text-gray-500">
          Loading client information...
        </div>
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 md:px-0 py-3 sm:py-4">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-md p-4 sm:p-6 md:p-8 border">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-4 sm:mb-6">
          Edit Client
        </h1>

        {errorMsg && (
          <div className="mb-4 p-3 text-sm text-red-700 bg-red-100 border rounded-xl">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-4 p-3 text-sm text-green-700 bg-green-100 border rounded-xl">
            {successMsg}
          </div>
        )}

        <div className="space-y-5 sm:space-y-6">
          {/* Basic */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormGroup label="Code Name" value={codeName} onChange={setCodeName} />
            <FormGroup
              label="Registered Company Name"
              value={registeredName}
              onChange={setRegisteredName}
            />
          </div>

          {/* AUTOCOMPLETE FIELD */}
          <div className="relative">
            <FormGroup
              label="Pick-up Location"
              value={pickUpLocation}
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
              Pick-up Coordinates
            </label>

            <div className="relative z-0 overflow-hidden rounded-xl border">
              <LeafletMap onSelect={setPickUpLatLong} latLong={pickUpLatLong} />
            </div>

            <input
              type="text"
              value={pickUpLatLong}
              readOnly
              className="w-full border rounded-xl p-3 bg-gray-100 text-sm"
            />
          </div>

          {/* Schedule + Fees */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormGroup
              label="Preferred Schedule"
              value={preferredSchedule}
              onChange={setPreferredSchedule}
            />

            <FormGroup
              label="Fee per KG (Driver & Loader)"
              type="number"
              value={feePerKg}
              onChange={setFeePerKg}
            />
          </div>

          {/* NEW FIELDS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormGroup
              label="Client Service Rate (₱)"
              type="number"
              value={clientServiceRate}
              onChange={setClientServiceRate}
            />

            <FormGroup
              label="Minimum Charging (₱)"
              type="number"
              value={minimumCharging}
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
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full mt-6 sm:mt-8 bg-indigo-600 text-white py-3 rounded-xl font-semibold hover:bg-indigo-700 active:scale-[0.99] disabled:opacity-50 transition"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

function FormGroup({ label, value, onChange, type = "text", placeholder }: any) {
  return (
    <div className="min-w-0">
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
