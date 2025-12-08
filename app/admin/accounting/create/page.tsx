"use client";

import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import api from "@/lib/api";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function CreateAccountingStaffPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  // store ONLY the digits (e.g., "9123456789")
  const [contactDigits, setContactDigits] = useState("");

  const [roleId, setRoleId] = useState(""); // ⭐ NEW

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

    const handleSave = async (e: any) => {
    e.preventDefault();
    setError("");

    const contactNumber =
      contactDigits.trim() === "" ? "" : `+63${contactDigits}`;

    if (!roleId) {
      toast.error("Please select a role.");   // ❌ ERROR TOAST
      return;
    }

    setLoading(true);

    try {
      await api.post("/admin/accounting", {
        firstName,
        lastName,
        username,
        email,
        contactNumber,
        roleId: Number(roleId),
      });

      toast.success("Staff successfully added!"); // ✅ SUCCESS TOAST

      setTimeout(() => {
        router.push("/admin/accounting");
      }, 1200);

    } catch (err: any) {
      toast.error("Failed to save staff. Please try again."); // ❌ ERROR TOAST
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

        {/* Contact Number */}
        <ContactField value={contactDigits} onChange={setContactDigits} />

        {/* ⭐ ROLE DROPDOWN */}
        <RoleSelect roleId={roleId} setRoleId={setRoleId} />

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

function RoleSelect({
  roleId,
  setRoleId,
}: {
  roleId: string;
  setRoleId: Dispatch<SetStateAction<string>>;
}) {
  return (
    <div>
      <label className="block font-medium mb-1">Select Role</label>

      <select
        value={roleId}
        onChange={(e) => setRoleId(e.target.value)}
        className="w-full border p-3 rounded-lg"
        required
      >
        <option value="">Choose role...</option>

        <option value="5">Accounting Super Admin</option>
        <option value="6">Accounts Receivable</option>
        <option value="7">Accounts Payable</option>
        <option value="8">Messenger</option>
      </select>
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
    const digits = e.target.value.replace(/\D/g, "");
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
