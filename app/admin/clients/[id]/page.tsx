"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useRouter, useParams } from "next/navigation";

export default function ClientDetailsPage() {
  const router = useRouter();
  const { id } = useParams();

  const [client, setClient] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [deleteMsg, setDeleteMsg] = useState("");

  // Editable fields
  const [registeredCompanyName, setRegisteredCompanyName] = useState("");
  const [codeName, setCodeName] = useState("");
  const [pickUpLocation, setPickUpLocation] = useState("");
  const [preferredHaulingSchedule, setPreferredHaulingSchedule] =
    useState("");
  const [driverAndLoaderPerKgFee, setDriverAndLoaderPerKgFee] =
    useState("");

  const [clientServiceRate, setClientServiceRate] = useState("");
  const [minimumCharging, setMinimumCharging] = useState("");

  // Service Rate (from ClientServiceRate table)
  const [serviceType, setServiceType] = useState("");
  const [paymentTerms, setPaymentTerms] = useState("");

  /* ----------------------------------------
     LOAD CLIENT BY ID
  ---------------------------------------- */
  const loadClient = async () => {
    try {
      const res = await api.get(`/admin/client/${id}`);
      setClient(res.data);

      setRegisteredCompanyName(res.data.registeredCompanyName ?? "");
      setCodeName(res.data.codeName ?? "");
      setPickUpLocation(res.data.pickUpLocation ?? "");
      setPreferredHaulingSchedule(res.data.preferredHaulingSchedule ?? "");
      setDriverAndLoaderPerKgFee(res.data.driverAndLoaderPerKgFee ?? "");

      setClientServiceRate(res.data.clientServiceRate ?? "");
      setMinimumCharging(res.data.minimumCharging ?? "");

      // serviceRate may NOT exist (backend update required)
      if (res.data.serviceRate) {
        setServiceType(res.data.serviceRate.serviceType ?? "");
        setPaymentTerms(res.data.serviceRate.paymentTerms ?? "");
      }

    } catch {
      setErrorMsg("Failed to load client details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClient();
  }, [id]);

  /* ----------------------------------------
     DETECT CHANGES
  ---------------------------------------- */
  const hasChanges = () => {
    if (!client) return false;

    return (
      registeredCompanyName !== client.registeredCompanyName ||
      codeName !== client.codeName ||
      pickUpLocation !== client.pickUpLocation ||
      preferredHaulingSchedule !== (client.preferredHaulingSchedule ?? "") ||
      driverAndLoaderPerKgFee !== (client.driverAndLoaderPerKgFee ?? "") ||
      clientServiceRate !== (client.clientServiceRate ?? "") ||
      minimumCharging !== (client.minimumCharging ?? "") ||
      serviceType !== (client.serviceRate?.serviceType ?? "") ||
      paymentTerms !== (client.serviceRate?.paymentTerms ?? "")
    );
  };

  /* ----------------------------------------
     SAVE UPDATES
  ---------------------------------------- */
  const handleSave = async () => {
    setErrorMsg("");
    setSuccessMsg("");

    if (!hasChanges()) {
      setErrorMsg("No changes detected.");
      return;
    }

    if (driverAndLoaderPerKgFee && isNaN(Number(driverAndLoaderPerKgFee))) {
      setErrorMsg("Rate per KG must be a number.");
      return;
    }

    if (clientServiceRate && isNaN(Number(clientServiceRate))) {
      setErrorMsg("Client Service Rate must be a number.");
      return;
    }

    if (minimumCharging && isNaN(Number(minimumCharging))) {
      setErrorMsg("Minimum Charging must be a number.");
      return;
    }

    setSaving(true);

    try {
      await api.put(`/admin/client/${id}`, {
        RegisteredCompanyName: registeredCompanyName,
        CodeName: codeName,
        PickUpLocation: pickUpLocation,
        PreferredHaulingSchedule: preferredHaulingSchedule,
        DriverAndLoaderPerKgFee:
          driverAndLoaderPerKgFee === "" ? null : Number(driverAndLoaderPerKgFee),

        ClientServiceRate:
          clientServiceRate === "" ? null : Number(clientServiceRate),

        MinimumCharging:
          minimumCharging === "" ? null : Number(minimumCharging),

        // requires backend update:
        ServiceType: serviceType,
        PaymentTerms: paymentTerms,
      });

      setSuccessMsg("Client information successfully updated!");

      setTimeout(() => {
        router.push("/admin/clients");
      }, 1200);
    } catch {
      setErrorMsg("Failed to update client.");
    }

    setSaving(false);
  };

  /* ----------------------------------------
     DELETE CLIENT
  ---------------------------------------- */
  const deleteClient = async () => {
    const confirmDelete = confirm("Are you sure you want to delete this client?");
    if (!confirmDelete) return;

    try {
      await api.delete(`/admin/client/${id}`);
      setDeleteMsg("Client successfully deleted.");

      setTimeout(() => {
        router.push("/admin/clients");
      }, 1200);

    } catch (err: any) {
      if (
        err.response &&
        err.response.status === 500 &&
        err.response.data?.includes("FK_ClientServiceRate_Client")
      ) {
        setErrorMsg(
          "This client cannot be deleted because it has existing assigned service rates."
        );
        return;
      }

      setErrorMsg("Failed to delete client.");
    }
  };

  /* ----------------------------------------
     UI STATES
  ---------------------------------------- */
  if (loading) {
    return (
      <div className="text-center py-10 text-gray-500 font-medium">
        Loading client information...
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-10 text-red-500 font-medium">
        Client not found.
      </div>
    );
  }

  /* ----------------------------------------
     MAIN UI
  ---------------------------------------- */
  return (
    <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl shadow border">

      <h1 className="text-3xl font-bold text-gray-800 mb-2">
        Manage Client
      </h1>

      <p className="text-gray-500 text-sm mb-6">
        Update client details or delete the client record.
      </p>

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

      {errorMsg && (
        <div className="p-3 mb-4 text-sm bg-red-100 text-red-700 border border-red-300 rounded">
          {errorMsg}
        </div>
      )}

      <div className="space-y-6">
        <FormGroup label="Registered Company Name" value={registeredCompanyName} onChange={setRegisteredCompanyName} />
        <FormGroup label="Code Name" value={codeName} onChange={setCodeName} />
        <FormGroup label="Pick-up Location" value={pickUpLocation} onChange={setPickUpLocation} />
        <FormGroup label="Preferred Hauling Schedule" value={preferredHaulingSchedule} onChange={setPreferredHaulingSchedule} />
        <FormGroup label="Rate per KG (Driver + Loader)" value={driverAndLoaderPerKgFee} onChange={setDriverAndLoaderPerKgFee} type="number" />

        {/* NEW FIELDS */}
        <FormGroup label="Client Service Rate" value={clientServiceRate} onChange={setClientServiceRate} type="number" />
        <FormGroup label="Minimum Charging" value={minimumCharging} onChange={setMinimumCharging} type="number" />

        {/* SERVICE RATE FIELDS */}
        <FormGroup label="Service Type" value={serviceType} onChange={setServiceType} />
        <FormGroup label="Payment Terms" value={paymentTerms} onChange={setPaymentTerms} />
      </div>

      <div className="flex justify-between mt-10">
        <button onClick={deleteClient} className="px-6 py-3 bg-red-600 text-white rounded-lg shadow hover:bg-red-700">
          Delete Client
        </button>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg shadow hover:bg-indigo-700 disabled:opacity-50"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}

/* ----------------------------------------------
   GENERIC INPUT COMPONENT
---------------------------------------------- */

function FormGroup({ label, value, onChange, type = "text", placeholder = "" }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      <input
        type={type}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="w-full border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm transition text-gray-700"
      />
    </div>
  );
}
