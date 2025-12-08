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

  /* -------------------------------------------
     LOAD EXISTING STAFF DATA (GET)
  ------------------------------------------- */
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
      } catch (err) {
        console.error(err);
        toast.error("Failed to load staff details.");
      }

      setLoading(false);
    };

    loadStaff();
  }, [staffId]);

  /* -------------------------------------------
     SAVE UPDATE (PUT)
  ------------------------------------------- */
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
    } catch (err) {
      console.error(err);
      toast.error("Failed to update staff. Please try again.");
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto p-8">
        <p>Loading staff information...</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow border">
      <h1 className="text-3xl font-bold mb-4">Edit Accounting Staff</h1>

      <form onSubmit={handleSave} className="space-y-6">
        <FormGroup label="First Name" value={firstName} onChange={setFirstName} required />
        <FormGroup label="Last Name" value={lastName} onChange={setLastName} required />
        <FormGroup label="Username" value={username} onChange={setUsername} required />
        <FormGroup label="Email (Optional)" type="email" value={email} onChange={setEmail} />

        <ContactField value={contactDigits} onChange={setContactDigits} />

        <RoleSelect roleId={roleId} setRoleId={setRoleId} />

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 font-semibold"
        >
          {saving ? "Saving changes..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
}

/* -------------------------------------------
   Reusable Components
------------------------------------------- */

function RoleSelect({ roleId, setRoleId }: any) {
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
