"use client";

import { useState } from "react";
import type { Dispatch, SetStateAction } from "react";
import adminApi from "@/lib/adminApi";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function CreateAccountingStaffPage() {
  const router = useRouter();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [contactDigits, setContactDigits] = useState("");
  const [roleId, setRoleId] = useState("");

  const [loading, setLoading] = useState(false);

  const handleSave = async (e: any) => {
    e.preventDefault();

    const contactNumber =
      contactDigits.trim() === "" ? "" : `+63${contactDigits}`;

    if (!roleId) {
      toast.error("Please select a role.");
      return;
    }

    setLoading(true);

    try {
      await adminApi.post("/admin/accounting", {
        firstName,
        lastName,
        username,
        email,
        contactNumber,
        roleId: Number(roleId),
      });

      toast.success("Staff successfully added!");

      setTimeout(() => {
        router.push("/admin/accounting");
      }, 1200);
    } catch (err) {
      toast.error("Failed to save staff. Please try again.");
    }

    setLoading(false);
  };

  return (
    <div className="px-3 sm:px-4 md:px-0 py-3 sm:py-4">
      <div className="max-w-2xl mx-auto bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow border">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Create Accounting Staff
        </h1>
        <p className="text-gray-600 text-sm mb-5 sm:mb-6">
          Password will be auto-generated as <b>accounting_{"{username}"}</b>
        </p>

        <form onSubmit={handleSave} className="space-y-5 sm:space-y-6">
          {/* 2-col on sm+ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormGroup
              label="First Name"
              value={firstName}
              onChange={setFirstName}
              required
            />
            <FormGroup
              label="Last Name"
              value={lastName}
              onChange={setLastName}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormGroup
              label="Username"
              value={username}
              onChange={setUsername}
              required
            />
            <FormGroup
              label="Email (Optional)"
              type="email"
              value={email}
              onChange={setEmail}
            />
          </div>

          <ContactField value={contactDigits} onChange={setContactDigits} />

          <RoleSelect roleId={roleId} setRoleId={setRoleId} />

          <button
            type="submit"
            disabled={loading}
            className="
              w-full bg-indigo-600 text-white py-3 rounded-xl hover:bg-indigo-700
              font-semibold shadow active:scale-[0.99] transition disabled:opacity-50
            "
          >
            {loading ? "Saving..." : "Save Accounting Staff"}
          </button>
        </form>
      </div>
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
    <div className="min-w-0">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Select Role
      </label>

      <select
        value={roleId}
        onChange={(e) => setRoleId(e.target.value)}
        className="
          w-full border border-gray-300 p-3 rounded-xl
          focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
          shadow-sm transition text-gray-700 text-sm bg-white
        "
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

function FormGroup({
  label,
  value,
  onChange,
  type = "text",
  required = false,
}: any) {
  return (
    <div className="min-w-0">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        required={required}
        className="
          w-full border border-gray-300 p-3 rounded-xl
          focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
          shadow-sm transition text-gray-700 text-sm
        "
      />
    </div>
  );
}

function ContactField({ value, onChange }: any) {
  const handleChange = (e: any) => {
    const digits = e.target.value.replace(/\D/g, "");
    if (digits.length <= 10) onChange(digits);
  };

  return (
    <div className="min-w-0">
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Contact Number (Optional)
      </label>

      <div className="flex rounded-xl overflow-hidden border border-gray-300 bg-white shadow-sm">
        <span className="px-4 flex items-center bg-gray-100 text-gray-700 border-r border-gray-300 text-sm font-semibold">
          +63
        </span>

        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="9123456789"
          inputMode="numeric"
          className="
            w-full p-3 outline-none
            focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
            text-gray-700 text-sm
          "
        />
      </div>

      {/* small helper line (UI only) */}
      <p className="text-xs text-gray-500 mt-1">
        Enter 10 digits (no leading 0).
      </p>
    </div>
  );
}
