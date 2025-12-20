"use client";

import { useState } from "react";
import api from "@/lib/api";
import Link from "next/link";
import toast from "react-hot-toast";

export default function AddTruckPage() {
  const [plateNumber, setPlateNumber] = useState("");
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<string>("");

  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    const plate = plateNumber.trim();

    if (!plate) {
      toast.error("Plate number is required.");
      return;
    }

    // year is optional but must be valid if provided
    const parsedYear = year.trim() ? Number(year) : null;
    if (year.trim() && (!Number.isFinite(parsedYear) || parsedYear! < 1900 || parsedYear! > 2100)) {
      toast.error("Please enter a valid year.");
      return;
    }

    setLoading(true);

    try {
      await api.post("/admin/truck", {
        plateNumber: plate,
        make: make.trim() || null,
        model: model.trim() || null,
        year: parsedYear,
      });

      toast.success("Truck created successfully!");

      setPlateNumber("");
      setMake("");
      setModel("");
      setYear("");
    } catch (err: any) {
      // Handle common backend responses
      const msg =
        err?.response?.data ||
        (err?.response?.status === 409
          ? "Plate number already exists."
          : "Failed to create truck.");
      toast.error(typeof msg === "string" ? msg : "Failed to create truck.");
      console.log(err);
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
              Add New Truck
            </h1>
            <p className="text-gray-500 text-sm">Register a truck for hauling</p>
          </div>

          <Link
            href="/admin/truck"
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
          {/* PLATE NUMBER */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">
              Plate Number <span className="text-red-500">*</span>
            </label>

            <input
              type="text"
              value={plateNumber}
              onChange={(e) => setPlateNumber(e.target.value)}
              placeholder="e.g. ABC-1234"
              className="
                w-full border border-gray-300 rounded-xl p-3
                text-gray-700 bg-white
                focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                outline-none shadow-sm transition
              "
            />
          </div>

          {/* MAKE */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">
              Make
            </label>

            <input
              type="text"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              placeholder="e.g. Isuzu"
              className="
                w-full border border-gray-300 rounded-xl p-3
                text-gray-700 bg-white
                focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                outline-none shadow-sm transition
              "
            />
          </div>

          {/* MODEL */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">
              Model
            </label>

            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="e.g. Elf N-Series"
              className="
                w-full border border-gray-300 rounded-xl p-3
                text-gray-700 bg-white
                focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                outline-none shadow-sm transition
              "
            />
          </div>

          {/* YEAR */}
          <div>
            <label className="text-sm font-semibold text-gray-700 mb-1 block">
              Year
            </label>

            <input
              type="number"
              inputMode="numeric"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              placeholder="e.g. 2020"
              className="
                w-full border border-gray-300 rounded-xl p-3
                text-gray-700 bg-white
                focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                outline-none shadow-sm transition
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
            {loading ? "Saving..." : "Save Truck"}
          </button>
        </div>
      </div>
    </div>
  );
}
