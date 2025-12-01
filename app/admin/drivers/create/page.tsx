"use client";

import { useState } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

export default function CreateDriverPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [contactNumber, setContactNumber] = useState(""); // only digits after +63
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleContactChange = (value: string) => {
    // Remove all non-digits
    let digits = value.replace(/\D/g, "");

    // Remove leading "63" to avoid duplicate
    if (digits.startsWith("63")) {
      digits = digits.substring(2);
    }

    // Store only the actual digits after +63
    setContactNumber(digits);
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    setError("");

    if (!firstName.trim() || !username.trim()) {
      setError("First name and username are required.");
      return;
    }

    const password = `driver_${username}`;

    // Final format: +63 + digits
    const finalContact = contactNumber ? `+63${contactNumber}` : null;

    setLoading(true);
    try {
      await api.post("/admin/driver", {
        firstName,
        lastName,
        username,
        email,
        contactNumber: finalContact,
        password,
      });

      router.push("/admin/drivers");
    } catch (err: any) {
      setError("Failed to save driver. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow border">
      
      {/* HEADER */}
      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        Create New Driver
      </h1>
      <p className="text-gray-500 text-sm mb-6">
        Password will be auto-generated as <b>driver_&lt;username&gt;</b>
      </p>

      {/* ERROR */}
      {error && (
        <div className="p-3 mb-4 text-sm bg-red-100 text-red-700 border border-red-300 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">

        <FormGroup
          label="First Name"
          value={firstName}
          onChange={setFirstName}
          placeholder="e.g. Juan"
          required
        />

        <FormGroup
          label="Last Name"
          value={lastName}
          onChange={setLastName}
          placeholder="e.g. Dela Cruz"
        />

        <FormGroup
          label="Username"
          value={username}
          onChange={setUsername}
          placeholder="e.g. juan.driver01"
          required
        />

        <FormGroup
          label="Email (Optional)"
          value={email}
          onChange={setEmail}
          placeholder="Optional email"
          type="email"
        />

        {/* CONTACT NUMBER WITH AUTOMATIC +63 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contact Number (Optional)
          </label>

          <div className="flex">
            {/* fixed prefix */}
            <span className="px-3 py-3 bg-gray-100 border border-gray-300 rounded-l-lg text-gray-600">
              +63
            </span>

            {/* user types only digits */}
            <input
              type="text"
              value={contactNumber}
              onChange={(e) => handleContactChange(e.target.value)}
              placeholder="9123456789"
              className="
                w-full border border-gray-300 rounded-r-lg p-3 
                focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
                transition shadow-sm text-gray-700
              "
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="
            w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold 
            shadow hover:bg-indigo-700 transition disabled:opacity-50
          "
        >
          {loading ? "Saving..." : "Save Driver"}
        </button>

      </form>
    </div>
  );
}

/* reusable input component */

function FormGroup({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  required = false,
}: any) {
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
        required={required}
        className="
          w-full border border-gray-300 rounded-lg p-3 
          focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
          transition shadow-sm text-gray-700
        "
      />
    </div>
  );
}
