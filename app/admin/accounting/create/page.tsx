"use client";

import { useState } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";

export default function CreateAccountingStaffPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  // store ONLY the digits (e.g., "9123456789")
  const [contactDigits, setContactDigits] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async (e: any) => {
    e.preventDefault();
    setError("");

    const contactNumber =
      contactDigits.trim() === "" ? "" : `+63${contactDigits}`;

    setLoading(true);

    try {
      await api.post("/admin/accounting", {
        firstName,
        lastName,
        username,
        email,
        contactNumber,
      });

      router.push("/admin/accounting");
    } catch (err: any) {
      setError("Failed to save staff. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow border">
      <h1 className="text-3xl font-bold mb-4">Create Accounting Staff</h1>
      <p className="text-gray-600 mb-6">
        Password will be auto-generated as <b>accounting_{"{username}"}</b>
      </p>

      {error && <p className="text-red-600 mb-4">{error}</p>}

      <form onSubmit={handleSave} className="space-y-6">

        <FormGroup label="First Name" value={firstName} onChange={setFirstName} required />
        <FormGroup label="Last Name" value={lastName} onChange={setLastName} required />
        <FormGroup label="Username" value={username} onChange={setUsername} required />
        <FormGroup label="Email (Optional)" type="email" value={email} onChange={setEmail} />

        {/* Contact Number using new UI */}
        <ContactField value={contactDigits} onChange={setContactDigits} />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-semibold"
        >
          {loading ? "Saving..." : "Save Accounting Staff"}
        </button>
      </form>
    </div>
  );
}

/* Reusable Input Component */
function FormGroup({ label, value, onChange, type = "text", required = false }: any) {
  return (
    <div>
      <label className="block font-medium mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="w-full border p-3 rounded-lg"
      />
    </div>
  );
}

/* Contact Number Component */
function ContactField({ value, onChange }: any) {
  const handleChange = (e: any) => {
    // only digits allowed
    const digits = e.target.value.replace(/\D/g, "");

    // limit to 10 digits
    if (digits.length <= 10) onChange(digits);
  };

  return (
    <div>
      <label className="block font-medium mb-1">Contact Number (Optional)</label>

      <div className="flex rounded-lg overflow-hidden border border-gray-300">
        <span className="px-4 py-3 bg-gray-100 text-gray-700 border-r border-gray-300">
          +63
        </span>

        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="9123456789"
          className="w-full p-3 outline-none"
        />
      </div>
    </div>
  );
}
