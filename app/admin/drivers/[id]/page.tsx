"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useRouter, useParams } from "next/navigation";
import toast from "react-hot-toast";

export default function DriverDetailsPage() {
  const router = useRouter();
  const { id } = useParams();

  const [driver, setDriver] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [deleteMsg, setDeleteMsg] = useState("");

  // Editable fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [contactNumber, setContactNumber] = useState("+63");
  const [email, setEmail] = useState("");

  // Load driver by ID
  const loadDriver = async () => {
    try {
      const res = await api.get(`/admin/driver/${id}`);
      setDriver(res.data);

      setFirstName(res.data.firstName ?? "");
      setLastName(res.data.lastName ?? "");
      setEmail(res.data.email ?? "");
      setContactNumber(res.data.contactNumber || "+63");
    } catch (err) {
      setErrorMsg("Failed to load driver details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDriver();
  }, [id]);

  // Compare changes
  const hasChanges = () => {
    if (!driver) return false;
    return (
      firstName !== driver.firstName ||
      lastName !== driver.lastName ||
      email !== (driver.email ?? "") ||
      contactNumber !== (driver.contactNumber ?? "+63")
    );
  };

    // Save Update
    const handleSave = async () => {
    setSuccessMsg("");
    setErrorMsg("");

    if (!hasChanges()) {
      toast.error("No changes detected.");   // ❌ ERROR TOAST
      return;
    }

    if (contactNumber.length !== 13) {
      toast.error("Contact number must be in +63XXXXXXXXXX format."); // ❌ ERROR TOAST
      return;
    }

    setSaving(true);

    try {
      await api.put(`/admin/driver/${id}`, {
        firstName,
        lastName,
        email,
        contactNumber,
      });

      toast.success("Driver information successfully updated!"); // ✅ SUCCESS TOAST

      setTimeout(() => {
        router.push("/admin/drivers");
      }, 1200);

    } catch {
      toast.error("Failed to update driver."); // ❌ ERROR TOAST
    }

    setSaving(false);
  };

  // Delete Driver
  const deleteDriver = async () => {
    const confirmDelete = confirm("Are you sure you want to delete this driver?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/admin/driver/${id}`);
      setDeleteMsg("Driver successfully deleted.");

      setTimeout(() => {
        router.push("/admin/drivers");
      }, 1200);
    } catch {
      setErrorMsg("Failed to delete driver.");
    }
  };

  if (loading) {
    return (
      <div className="text-center py-10 text-gray-500 font-medium">
        Loading driver information...
      </div>
    );
  }

  if (!driver) {
    return (
      <div className="text-center py-10 text-red-500 font-medium">
        Driver not found.
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl shadow border">

      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        Manage Driver
      </h1>

      <p className="text-gray-500 text-sm mb-6">
        Update driver information or delete the account.
      </p>

      {/* SUCCESS MESSAGES */}
      {successMsg && (
        <div className="p-3 mb-4 text-sm bg-green-100 text-green-700 border border-green-300 rounded">
          {successMsg}
        </div>
      )}

      {deleteMsg && (
        <div className="p-3 mb-4 text-sm bg-red-100 text-red-700 border border-red-300 rounded">
          {deleteMsg}
        </div>
      )}

      {/* ERROR */}
      {errorMsg && (
        <div className="p-3 mb-4 text-sm bg-red-100 text-red-700 border border-red-300 rounded">
          {errorMsg}
        </div>
      )}

      {/* FORM */}
      <div className="space-y-6">
        <FormGroup
          label="First Name"
          value={firstName}
          onChange={setFirstName}
        />

        <FormGroup
          label="Last Name"
          value={lastName}
          onChange={setLastName}
        />

        <FormGroup
          label="Email"
          value={email}
          onChange={setEmail}
        />

        <ContactNumberGroup
          label="Contact Number"
          value={contactNumber}
          onChange={setContactNumber}
        />
      </div>

      {/* ACTION BUTTONS */}
      <div className="flex justify-between mt-10">

        <button
          onClick={deleteDriver}
          className="px-6 py-3 bg-red-600 text-white rounded-lg shadow hover:bg-red-700"
        >
          Delete Driver
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="
            px-6 py-3 bg-indigo-600 text-white rounded-lg shadow 
            hover:bg-indigo-700 disabled:opacity-50
          "
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>

      </div>
    </div>
  );
}

/* ----------------------------------------------
   +63 VALIDATION INPUT FIELD
---------------------------------------------- */

function ContactNumberGroup({ label, value, onChange }: any) {
  const handleChange = (val: string) => {
    // Remove anything that's not a number
    let numbersOnly = val.replace(/\D/g, "");

    // Always force +63 prefix
    if (numbersOnly.startsWith("63")) {
      numbersOnly = numbersOnly.substring(2); // remove extra 63
    }

    // Limit digits to 10 only after +63
    numbersOnly = numbersOnly.substring(0, 10);

    const finalValue = "+63" + numbersOnly;
    onChange(finalValue);
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>

      <div className="flex">
        <span className="px-4 flex items-center rounded-l-lg border border-gray-300 bg-gray-100 text-gray-700 font-semibold">
          +63
        </span>

        <input
          type="tel"
          value={value.replace("+63", "")}
          onChange={(e) => handleChange(e.target.value)}
          className="
            w-full border border-gray-300 rounded-r-lg p-3
            focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
            shadow-sm transition text-gray-700
          "
          placeholder="9123456789"
        />
      </div>

      {/* Validation */}
      {value && value.length !== 13 && (
        <p className="text-xs text-red-600 mt-1">
          Must be 10 digits after +63 (e.g., +639123456789)
        </p>
      )}
    </div>
  );
}

/* ----------------------------------------------
   GENERIC INPUT COMPONENT
---------------------------------------------- */

function FormGroup({ label, value, onChange }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>

      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="
          w-full border border-gray-300 rounded-lg p-3
          focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500
          shadow-sm transition text-gray-700
        "
      />
    </div>
  );
}
