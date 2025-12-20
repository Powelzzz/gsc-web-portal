"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";

export default function TruckDetailsPage() {
  const router = useRouter();
  const { id } = useParams();
  const truckId = Number(id);

  const [truck, setTruck] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Editable fields
  const [plateNumber, setPlateNumber] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<string>("");
  const [isActive, setIsActive] = useState<boolean>(true);

  /* ------------------------------------
        LOAD TRUCK
  ------------------------------------ */
  const loadTruck = async () => {
    try {
      // ✅ NEW: Use GET-by-id endpoint
      const res = await api.get(`/admin/truck/${truckId}`);
      const found = res.data;

      if (!found) {
        setTruck(null);
        return;
      }

      setTruck(found);

      setPlateNumber(found.plateNumber ?? "");
      setMake(found.make ?? "");
      setModel(found.model ?? "");
      setYear(found.year != null ? String(found.year) : "");
      setIsActive(
        found.isActive === "true" || found.isActive === "1" || found.isActive === true
      );
    } catch (err) {
      console.log(err);
      toast.error("Failed to load truck details.");
      setTruck(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!Number.isFinite(truckId)) return;
    loadTruck();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [truckId]);

  /* ------------------------------
        DETECT CHANGES
  ------------------------------ */
  const hasChanges = () => {
    if (!truck) return false;

    const originalIsActive =
      truck.isActive === "true" || truck.isActive === "1" || truck.isActive === true;

    const originalYear = truck.year != null ? String(truck.year) : "";

    return (
      plateNumber.trim() !== (truck.plateNumber ?? "") ||
      make.trim() !== (truck.make ?? "") ||
      model.trim() !== (truck.model ?? "") ||
      year.trim() !== originalYear ||
      isActive !== originalIsActive
    );
  };

  /* ------------------------------
        SAVE CHANGES
  ------------------------------ */
  const handleSave = async () => {
    if (!truck) return;

    if (!hasChanges()) {
      toast.error("No changes detected.");
      return;
    }

    const plate = plateNumber.trim();
    if (!plate) {
      toast.error("Plate number is required.");
      return;
    }

    const parsedYear = year.trim() ? Number(year) : null;
    if (year.trim() && (!Number.isFinite(parsedYear) || parsedYear! < 1900 || parsedYear! > 2100)) {
      toast.error("Please enter a valid year.");
      return;
    }

    setSaving(true);

    try {
      await api.put(`/admin/truck/${truckId}`, {
        plateNumber: plate,
        make: make.trim() || null,
        model: model.trim() || null,
        year: parsedYear,
        isActive: isActive,
      });

      toast.success("Truck updated successfully!");
      router.push("/admin/truck");
    } catch (err: any) {
      const msg =
        err?.response?.data ||
        (err?.response?.status === 409
          ? "Plate number already exists."
          : "Failed to update truck.");
      toast.error(typeof msg === "string" ? msg : "Failed to update truck.");
      console.log(err);
    }

    setSaving(false);
  };

  /* ------------------------------
        DELETE TRUCK
  ------------------------------ */
  const handleDelete = async () => {
    const confirmed = confirm("Are you sure you want to delete this truck?");
    if (!confirmed) return;

    try {
      await api.delete(`/admin/truck/${truckId}`);
      toast.success("Truck deleted.");
      router.push("/admin/truck");
    } catch (err) {
      console.log(err);
      toast.error("Failed to delete truck.");
    }
  };

  /* ------------------------------
        LOADING + NOT FOUND
  ------------------------------ */
  if (loading) {
    return (
      <div className="text-center py-10 text-gray-500">
        Loading truck details...
      </div>
    );
  }

  if (!truck) {
    return (
      <div className="text-center py-10 text-red-500">
        Truck not found.
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 md:px-0 py-3 sm:py-4">
      <div className="max-w-3xl mx-auto bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow border">
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4 mb-5 sm:mb-6">
          <div className="min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">
              Truck Details
            </h1>
            <p className="text-gray-500 text-sm">
              Edit truck details or delete this record.
            </p>
          </div>

          <button
            type="button"
            onClick={() => router.push("/admin/truck")}
            className="
              w-full sm:w-auto px-4 py-2.5 rounded-xl border text-sm font-semibold
              border-gray-300 text-gray-700 hover:bg-gray-50
              active:scale-[0.99] transition
            "
          >
            ← Back
          </button>
        </div>

        {/* FORM */}
        <div className="space-y-5 sm:space-y-6">
          <FormGroup
            label="Plate Number"
            value={plateNumber}
            onChange={setPlateNumber}
            placeholder="e.g. ABC-1234"
            required
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormGroup
              label="Make"
              value={make}
              onChange={setMake}
              placeholder="e.g. Isuzu"
            />
            <FormGroup
              label="Model"
              value={model}
              onChange={setModel}
              placeholder="e.g. Elf N-Series"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormGroup
              label="Year"
              type="number"
              inputMode="numeric"
              value={year}
              onChange={setYear}
              placeholder="e.g. 2020"
            />

            <FormGroupSelect
              label="Status"
              value={isActive ? "active" : "inactive"}
              onChange={(val: string) => setIsActive(val === "active")}
              options={[
                { value: "active", label: "Active" },
                { value: "inactive", label: "Inactive" },
              ]}
            />
          </div>
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
            Delete Truck
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
        INPUT
------------------------------------ */
function FormGroup({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
  inputMode,
}: any) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label} {required ? <span className="text-red-500">*</span> : null}
      </label>
      <input
        type={type}
        inputMode={inputMode}
        value={value}
        placeholder={placeholder}
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
        SELECT
------------------------------------ */
function FormGroupSelect({ label, value, onChange, options }: any) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1">
        {label}
      </label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full border border-gray-300 rounded-xl p-3 bg-white
          focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
          outline-none text-sm text-gray-700 shadow-sm transition
        "
      >
        {options.map((opt: any) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
