"use client";

import { useState, useEffect } from "react";
import adminApi from "@/lib/adminApi";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";

export default function EditAccountingStaffPage() {
  const router = useRouter();
  const params = useParams();
  const staffId = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  const [contactDigits, setContactDigits] = useState("");
  const [roleId, setRoleId] = useState("");

  /* LOAD EXISTING STAFF */
  useEffect(() => {
    const loadStaff = async () => {
      try {
        const res = await adminApi.get(`/admin/accounting/${staffId}`);
        const s = res.data;

        setFirstName(s.firstName ?? "");
        setLastName(s.lastName ?? "");
        setUsername(s.username ?? "");
        setEmail(s.email ?? "");

        const extracted = s.contactNumber
          ? s.contactNumber.replace("+63", "")
          : "";
        setContactDigits(extracted);

        setRoleId(String(s.roleId ?? ""));
      } catch {
        toast.error("Failed to load staff details.");
      }

      setLoading(false);
    };

    loadStaff();
  }, [staffId]);

  /* SAVE UPDATE */
  const handleSave = async (e: any) => {
    e.preventDefault();

    if (!roleId) return toast.error("Please select a role.");

    setSaving(true);

    const contactNumber = contactDigits.trim()
      ? `+63${contactDigits}`
      : "";

    try {
      await adminApi.put(`/admin/accounting/${staffId}`, {
        firstName,
        lastName,
        username,
        email,
        contactNumber,
        roleId: Number(roleId),
      });

      toast.success("Staff updated successfully!");
      setTimeout(() => router.push("/admin/accounting"), 1200);
    } catch {
      toast.error("Failed to update staff.");
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="px-4 py-10 text-center text-gray-500">
        Loading staff information...
      </div>
    );
  }

  return (
    <div className="px-3 sm:px-4 md:px-0 py-3 sm:py-4">
      <div className="max-w-2xl mx-auto bg-white p-4 sm:p-6 md:p-8 rounded-xl shadow border">

        {/* HEADER */}
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
          Edit Accounting Staff
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          Update staff information and assigned role
        </p>

        <form onSubmit={handleSave} className="space-y-5 sm:space-y-6">

          {/* NAME */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormGroup label="First Name" value={firstName} onChange={setFirstName} required />
            <FormGroup label="Last Name" value={lastName} onChange={setLastName} required />
          </div>

          {/* ACCOUNT */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormGroup label="Username" value={username} onChange={setUsername} required />
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
            disabled={saving}
            className="
              w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold
              hover:bg-indigo-700 shadow transition disabled:opacity-50
              active:scale-[0.99]
            "
          >
            {saving ? "Saving changes..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}

/* -------------------------------------------
   REUSABLE COMPONENTS (UI ONLY)
------------------------------------------- */

function RoleSelect({ roleId, setRoleId }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Select Role
      </label>

      <select
        value={roleId}
        onChange={(e) => setRoleId(e.target.value)}
        className="
          w-full border border-gray-300 p-3 rounded-xl
          focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
          text-sm shadow-sm
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

function FormGroup({ label, value, onChange, type = "text", required = false }: any) {
  return (
    <div>
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
          text-sm shadow-sm
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
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Contact Number (Optional)
      </label>

      <div className="flex rounded-xl overflow-hidden border border-gray-300 shadow-sm">
        <span className="px-4 flex items-center bg-gray-100 text-gray-700 border-r text-sm font-semibold">
          +63
        </span>

        <input
          type="text"
          value={value}
          onChange={handleChange}
          placeholder="9123456789"
          inputMode="numeric"
          className="
            w-full p-3 outline-none text-sm
            focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
          "
        />
      </div>

      <p className="text-xs text-gray-500 mt-1">
        Enter 10 digits (no leading 0)
      </p>
    </div>
  );
}
