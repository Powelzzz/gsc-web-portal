"use client";

import { useState, useEffect, useMemo, useRef, ChangeEvent, InputHTMLAttributes } from "react";
import api from "@/lib/api"; // your axios instance

interface ServiceRate {
  id: number;
  clientId: number;
  clientName: string;
  serviceType: string;
  ratePerKg: string;
  paymentTerms: string;
  createdAt: string;
}

interface ClientServiceRateSnapshot {
  serviceType: string;
  ratePerKg: string;
  paymentTerms: string;
}

interface ClientOption {
  id: number;
  name: string;
  serviceRate?: ClientServiceRateSnapshot;
}

/* ✅ AUDIT LOG TYPES (NOW FROM BACKEND) */
type AuditAction = "CREATE" | "DEACTIVATE" | "UPDATE";

interface ServiceRateAuditLog {
  id: number;
  performedAt: string; // ISO
  performedBy: string; // username/name
  action: AuditAction;

  clientId: number;
  clientName: string;

  serviceType: string;
  ratePerKg: string;
  paymentTerms: string;

  notes?: string;
}

export default function EncodeRatesPage() {
  // FORM
  const [clientId, setClientId] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [rate, setRate] = useState("");
  const [terms, setTerms] = useState("");

  // TABLE DATA
  const [rates, setRates] = useState<ServiceRate[]>([]);
  const [loading, setLoading] = useState(false);

  // CLIENT DROPDOWN
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [clientsLoading, setClientsLoading] = useState(false);

  // FILTERS
  const [filterClientId, setFilterClientId] = useState("");
  const [filterClientName, setFilterClientName] = useState("");
  const [filterType, setFilterType] = useState("");

  // PAGINATION
  const rowsPerPage = 10;
  const [page, setPage] = useState(1);

  // ✅ AUDIT LOGS (DYNAMIC)
  const [auditLogs, setAuditLogs] = useState<ServiceRateAuditLog[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditFilterText, setAuditFilterText] = useState("");
  // request guard to prevent stale responses from overwriting newer state
  const auditReqRef = useRef(0);

  /* ─────────────────────────────────────────────── */
  /* LOAD RATES FROM BACKEND                         */
  /* ─────────────────────────────────────────────── */
  async function loadRates() {
    setLoading(true);
    try {
      const res = await api.get("/Accounting/rates", {
        params: { activeOnly: true },
      });
      setRates(res.data);
    } catch (err) {
      console.error("Failed to load rates:", err);
    }
    setLoading(false);
  }

  /* ─────────────────────────────────────────────── */
  /* LOAD CLIENTS FOR DROPDOWN (FROM ADMIN CONTROLLER) */
  /* ─────────────────────────────────────────────── */
  async function loadClients(): Promise<ClientOption[]> {
    setClientsLoading(true);
    try {
      const res = await api.get("/Admin/client");

      type RawClient = {
        id: number;
        registeredCompanyName?: string | null;
        serviceRate?: {
          serviceType?: string | null;
          ratePerKg?: string | null;
          paymentTerms?: string | null;
        } | null;
      };

      const data = res.data as RawClient[];

      const mapped: ClientOption[] = data.map((c) => ({
        id: c.id,
        name: c.registeredCompanyName || "(Unknown Client)",
        serviceRate: c.serviceRate
          ? {
              serviceType: c.serviceRate.serviceType ?? "",
              ratePerKg: c.serviceRate.ratePerKg ?? "",
              paymentTerms: c.serviceRate.paymentTerms ?? "",
            }
          : undefined,
      }));

      setClients(mapped);
      return mapped;
    } catch (err) {
      console.error("Failed to load clients:", err);
      return [];
    } finally {
      setClientsLoading(false);
    }
  }

  /* ─────────────────────────────────────────────── */
  /* LOAD AUDIT LOGS (FROM BACKEND)                  */
  /* Backend expected: /Accounting/rates/audit       */
  /* returns array of:                              */
  /* { id, performedAt, performedBy, action, summary, afterJson, beforeJson } */
  /* ─────────────────────────────────────────────── */
  async function loadAuditLogs(selectedClientId?: number, clientList?: ClientOption[]) {
    const reqId = ++auditReqRef.current;
    setAuditLoading(true);
    try {
      const res = await api.get("/Accounting/rates/audit", {
        params: { clientId: selectedClientId, take: 50 },
      });
      // if a newer request exists, ignore this response
      if (reqId !== auditReqRef.current) return;

      const get = (obj: any, ...keys: string[]) => {
        for (const k of keys) {
          if (obj && obj[k] !== undefined && obj[k] !== null) return obj[k];
        }
        return undefined;
      };

      const safeJson = (s: any) => {
        if (!s) return {};
        if (typeof s === "object") return s;
        try {
          return JSON.parse(s);
        } catch {
          return {};
        }
      };

      // use provided clientList (from initial load) if given, otherwise use current state
      const clientLookup = clientList ?? clients;

      const mapped: ServiceRateAuditLog[] = (res.data || []).map((x: any) => {
        const after = safeJson(x.afterJson);
        const before = safeJson(x.beforeJson);

        // Prefer AFTER, fallback to BEFORE (useful if some old logs still partial)
        const data = Object.keys(after || {}).length ? after : before;

        const cid = Number(get(data, "clientId", "ClientId") ?? 0);

        const clientNameFromDropdown =
          cid > 0 ? clientLookup.find((c) => c.id === cid)?.name : undefined;

        return {
          id: x.id,
          performedAt: x.performedAt
            ? new Date(x.performedAt).toISOString()
            : new Date().toISOString(),
          performedBy: x.performedBy ?? "Unknown",
          action: (x.action ?? "UPDATE") as AuditAction,

          clientId: cid,
          clientName:
            get(data, "clientName", "ClientName") ??
            clientNameFromDropdown ??
            (cid ? `Client #${cid}` : "—"),

          serviceType: get(data, "serviceType", "ServiceType") ?? "—",
          ratePerKg: String(get(data, "ratePerKg", "RatePerKg") ?? "0"),
          paymentTerms: get(data, "paymentTerms", "PaymentTerms") ?? "—",

          notes: x.summary ?? "",
        };
      });

      setAuditLogs(mapped);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
      // only set error state if this is the latest request
      if (reqId === auditReqRef.current) setAuditLogs([]);
    } finally {
      if (reqId === auditReqRef.current) setAuditLoading(false);
    }
  }

  /* INITIAL LOAD */
  useEffect(() => {
    (async () => {
      // load rates + clients (clients result used immediately to avoid race)
      const [, loadedClients] = await Promise.all([loadRates(), loadClients()]);
      // now safe to load audit logs once (use loadedClients so client names are available)
      await loadAuditLogs(undefined, loadedClients);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* RELOAD AUDIT LOGS WHEN CLIENT CHANGES (auto-filter) */
  useEffect(() => {
  loadAuditLogs(clientId ? Number(clientId) : undefined);
  // only re-run when selected client changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [clientId]);


  /* ─────────────────────────────────────────────── */
  /* PREFILL FIELDS WHEN CLIENT CHANGES              */
  /* ─────────────────────────────────────────────── */
  useEffect(() => {
    if (!clientId) {
      setServiceType("");
      setRate("");
      setTerms("");
      return;
    }

    const selectedId = Number(clientId);
    if (!selectedId) return;

    const selectedClient = clients.find((c) => c.id === selectedId);

    if (selectedClient?.serviceRate) {
      setServiceType(selectedClient.serviceRate.serviceType);
      setRate(selectedClient.serviceRate.ratePerKg);
      setTerms(selectedClient.serviceRate.paymentTerms);
    } else {
      setServiceType("");
      setRate("");
      setTerms("");
    }
  }, [clientId, clients]);

  /* ─────────────────────────────────────────────── */
  /* FILTERING + PAGINATION                          */
  /* ─────────────────────────────────────────────── */
  const filteredRates = useMemo(() => {
    return rates.filter((r) => {
      return (
        (filterClientId === "" ||
          r.clientId.toString().includes(filterClientId)) &&
        (filterClientName === "" ||
          r.clientName.toLowerCase().includes(filterClientName.toLowerCase())) &&
        (filterType === "" ||
          r.serviceType.toLowerCase().includes(filterType.toLowerCase()))
      );
    });
  }, [rates, filterClientId, filterClientName, filterType]);

  const totalPages = Math.max(1, Math.ceil(filteredRates.length / rowsPerPage));
  const paginatedData = filteredRates.slice(
    (page - 1) * rowsPerPage,
    page * rowsPerPage
  );

  /* ✅ AUDIT LOG FILTERING (UI SEARCH + AUTO CLIENT FILTER) */
  const filteredAuditLogs = useMemo(() => {
    const q = auditFilterText.trim().toLowerCase();
    const selectedClientId = clientId ? Number(clientId) : null;

    return auditLogs.filter((a) => {
      const matchSearch =
        q === "" ||
        a.performedBy.toLowerCase().includes(q) ||
        a.clientName.toLowerCase().includes(q) ||
        a.serviceType.toLowerCase().includes(q) ||
        a.paymentTerms.toLowerCase().includes(q) ||
        a.action.toLowerCase().includes(q) ||
        (a.notes ?? "").toLowerCase().includes(q);

      const matchClient = !selectedClientId || a.clientId === selectedClientId;

      return matchSearch && matchClient;
    });
  }, [auditLogs, auditFilterText, clientId]);

  /* ─────────────────────────────────────────────── */
  /* SAVE NEW RATE (POST to backend)                 */
  /* ─────────────────────────────────────────────── */
  async function handleSave() {
    if (!clientId || !serviceType) {
      alert("Client and Service Type are required.");
      return;
    }

    const rateNum = Number(rate);
    if (!Number.isFinite(rateNum) || rateNum <= 0) {
      alert("Rate must be a valid number greater than 0.");
      return;
    }

    try {
      const payload = {
        clientId: Number(clientId),
        serviceType: serviceType.trim(),
        ratePerKg: rateNum.toString(),
        paymentTerms: terms.trim(),
      };

      // post then reload canonical data from server (single source of truth)
      await api.post("/Accounting/rates", payload);
      // refresh rates + clients (clients used for prefilling / snapshots)
      await Promise.all([loadRates(), loadClients()]);
      // refresh audit logs filtered to the saved client
      await loadAuditLogs(Number(clientId));

      alert("Rate saved successfully!");

      // clear form and reset page after successful full refresh
      setClientId("");
      setServiceType("");
      setRate("");
      setTerms("");
      setPage(1);
    } catch (err: any) {
      console.error(err);
      alert(err.response?.data || "Failed to save rate.");
    }
  }

  /* ─────────────────────────────────────────────── */
  /* DELETE / DEACTIVATE RATE                        */
  /* ─────────────────────────────────────────────── */
  async function handleDelete(id: number) {
    if (!confirm("Deactivate this rate?")) return;

    try {
      await api.delete(`/Accounting/rates/${id}`);

      setRates((prev) => prev.filter((r) => r.id !== id));

      alert("Rate deactivated.");

      // Refresh logs after operation
      if (clientId) loadAuditLogs(Number(clientId));
      else loadAuditLogs();
    } catch (err) {
      console.error(err);
      alert("Failed to deactivate rate.");
    }
  }

  /* ─────────────────────────────────────────────── */
  /* UI RENDERING                                    */
  /* ─────────────────────────────────────────────── */
  return (
    <div className="p-6 space-y-10">
      {/* TITLE */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">
          Encode Service Rates per Client
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage hauling service pricing and payment terms for each client.
        </p>
      </div>

      {/* FORM CARD */}
      <div className="bg-white p-6 rounded-xl shadow border">
        <h2 className="text-lg font-semibold mb-5">Add New Service Rate</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LabeledSelect
            label="Client"
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value);
              setPage(1);
            }}
            options={clients}
            loading={clientsLoading}
          />

          <LabeledInput
            label="Service Type"
            value={serviceType}
            onChange={(e) => setServiceType(e.target.value)}
          />

          <LabeledInput
            label="Rate per KG"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            type="number"
            inputProps={{ step: "0.01", min: "0" }}
          />

          <LabeledInput
            label="Payment Terms"
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
          />
        </div>

        <button
          onClick={handleSave}
          className="mt-6 bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg shadow font-medium"
        >
          Save Rate
        </button>
      </div>

      {/* TABLE CARD */}
      <div className="bg-white p-6 rounded-xl shadow border">
        <h2 className="text-lg font-semibold mb-5">Existing Service Rates</h2>

        {/* FILTERS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <LabeledInput
            label="Filter by Client ID"
            value={filterClientId}
            onChange={(e) => {
              setFilterClientId(e.target.value);
              setPage(1);
            }}
          />
          <LabeledInput
            label="Filter by Client Name"
            value={filterClientName}
            onChange={(e) => {
              setFilterClientName(e.target.value);
              setPage(1);
            }}
          />
          <LabeledInput
            label="Filter by Service Type"
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setPage(1);
            }}
          />
        </div>

        {/* LOADING */}
        {loading && <p className="text-gray-500">Loading...</p>}

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead className="bg-gray-100 text-gray-600 sticky top-0">
              <tr>
                <th className="py-2 px-3 text-left">Client</th>
                <th className="py-2 px-3 text-left">Service Type</th>
                <th className="py-2 px-3 text-left">Rate</th>
                <th className="py-2 px-3 text-left">Terms</th>
                <th className="py-2 px-3 text-left">Actions</th>
              </tr>
            </thead>

            <tbody>
              {paginatedData.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="py-3 px-3">{r.clientName}</td>
                  <td className="py-3 px-3">{r.serviceType}</td>
                  <td className="py-3 px-3">
                    ₱{parseFloat(r.ratePerKg).toFixed(2)}
                  </td>
                  <td className="py-3 px-3">{r.paymentTerms}</td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => handleDelete(r.id)}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded"
                    >
                      Deactivate
                    </button>
                  </td>
                </tr>
              ))}

              {!loading && paginatedData.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-gray-400">
                    No matching results.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className={`px-4 py-2 rounded border ${
              page === 1
                ? "text-gray-400 bg-gray-100"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            Previous
          </button>

          <p className="text-gray-600">
            Page {page} of {totalPages}
          </p>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className={`px-4 py-2 rounded border ${
              page === totalPages
                ? "text-gray-400 bg-gray-100"
                : "bg-white hover:bg-gray-50"
            }`}
          >
            Next
          </button>
        </div>

        {/* ✅ AUDIT LOGS (NOW CONNECTED TO BACKEND) */}
        <div className="mt-10 pt-6 border-t">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">
                Audit Logs
              </h3>
              <p className="text-sm text-gray-500">
                Shows who encoded/updated/deactivated service rates.
              </p>
              {clientId && (
                <p className="text-xs text-gray-500 mt-1">
                  Auto-filtered to selected Client ID:{" "}
                  <span className="font-semibold">{clientId}</span>
                </p>
              )}
            </div>

            <div className="w-full md:w-80">
              <LabeledInput
                label="Search logs (user/client/service/action)"
                value={auditFilterText}
                onChange={(e) => setAuditFilterText(e.target.value)}
              />
            </div>
          </div>

          {/* Summary row */}
          <div className="flex flex-wrap gap-3 mb-4 text-xs">
            <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-700">
              Total Logs: <b>{filteredAuditLogs.length}</b>
            </span>
            <span className="px-3 py-1 rounded-full bg-green-100 text-green-700">
              CREATE
            </span>
            <span className="px-3 py-1 rounded-full bg-yellow-100 text-yellow-700">
              UPDATE
            </span>
            <span className="px-3 py-1 rounded-full bg-red-100 text-red-700">
              DEACTIVATE
            </span>
          </div>

          {auditLoading && (
            <p className="text-gray-500 text-sm">Loading audit logs...</p>
          )}

          {!auditLoading && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="py-2 px-3 text-left">Date/Time</th>
                    <th className="py-2 px-3 text-left">User</th>
                    <th className="py-2 px-3 text-left">Action</th>
                    <th className="py-2 px-3 text-left">Client</th>
                    <th className="py-2 px-3 text-left">Service Type</th>
                    <th className="py-2 px-3 text-left">Rate</th>
                    <th className="py-2 px-3 text-left">Terms</th>
                    <th className="py-2 px-3 text-left">Notes</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredAuditLogs.map((a) => (
                    <tr key={a.id} className="border-t">
                      <td className="py-3 px-3">
                        {new Date(a.performedAt).toLocaleString()}
                      </td>
                      <td className="py-3 px-3 font-medium">{a.performedBy}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-1 rounded text-xs font-semibold ${
                            a.action === "CREATE"
                              ? "bg-green-100 text-green-700"
                              : a.action === "DEACTIVATE"
                              ? "bg-red-100 text-red-700"
                              : "bg-yellow-100 text-yellow-700"
                          }`}
                        >
                          {a.action}
                        </span>
                      </td>
                      <td className="py-3 px-3">{a.clientName}</td>
                      <td className="py-3 px-3">{a.serviceType}</td>
                      <td className="py-3 px-3">
                        ₱{Number(a.ratePerKg || 0).toFixed(2)}
                      </td>
                      <td className="py-3 px-3">{a.paymentTerms}</td>
                      <td className="py-3 px-3 text-gray-500">
                        {a.notes ?? "—"}
                      </td>
                    </tr>
                  ))}

                  {filteredAuditLogs.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-gray-400">
                        No logs match your search.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {!auditLoading && auditLogs.length === 0 && (
            <p className="text-xs text-gray-400 mt-3">
              No audit logs found yet. Perform a rate create/deactivate to
              generate logs.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* REUSABLE INPUT COMPONENT */
function LabeledInput({
  label,
  value,
  onChange,
  type = "text",
  inputProps,
}: {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  inputProps?: InputHTMLAttributes<HTMLInputElement>;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-gray-600 font-medium">{label}</label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        {...(inputProps ?? {})}
        className="border rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

/* CLIENT DROPDOWN COMPONENT */
function LabeledSelect({
  label,
  value,
  onChange,
  options,
  loading,
}: {
  label: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  options: ClientOption[];
  loading?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-sm text-gray-600 font-medium">{label}</label>
      <select
        value={value}
        onChange={onChange}
        className="border rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        <option value="">
          {loading ? "Loading clients..." : "Select a client"}
        </option>
        {options.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name}
          </option>
        ))}
      </select>
    </div>
  );
}
