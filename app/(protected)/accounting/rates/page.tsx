"use client";

import {
  useState,
  useEffect,
  useMemo,
  useRef,
  ChangeEvent,
  InputHTMLAttributes,
} from "react";
import api from "@/lib/api";
import toast from "react-hot-toast";

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

  // Client search for dropdown
  const [clientSearch, setClientSearch] = useState("");

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
  const [auditQuery, setAuditQuery] = useState(""); // UI typing
  const [auditFilterText, setAuditFilterText] = useState(""); // debounced
  const auditReqRef = useRef(0);

  // Saving / Deleting states
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  // Modal (Deactivate)
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmRate, setConfirmRate] = useState<ServiceRate | null>(null);

  // track initial audit load to avoid double fetch
  const didInitialAuditLoad = useRef(false);

  /* ─────────────────────────────────────────────── */
  /* HELPERS                                         */
  /* ─────────────────────────────────────────────── */
  const getApiErrorMessage = (err: any) => {
    const msg =
      err?.response?.data ||
      err?.message ||
      "Something went wrong. Please try again.";
    return typeof msg === "string" ? msg : "Something went wrong.";
  };

  function resetForm() {
    setClientId("");
    setServiceType("");
    setRate("");
    setTerms("");
  }

  function clearFilters() {
    setFilterClientId("");
    setFilterClientName("");
    setFilterType("");
    setPage(1);
  }

  const selectedClient = useMemo(() => {
    const cid = Number(clientId);
    if (!cid) return undefined;
    return clients.find((c) => c.id === cid);
  }, [clientId, clients]);

  const filteredClients = useMemo(() => {
    const q = clientSearch.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter(
      (c) =>
        c.name.toLowerCase().includes(q) || String(c.id).includes(q)
    );
  }, [clients, clientSearch]);

  /* ─────────────────────────────────────────────── */
  /* LOAD RATES                                      */
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
      toast.error(getApiErrorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  /* ─────────────────────────────────────────────── */
  /* LOAD CLIENTS                                    */
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
      toast.error(getApiErrorMessage(err));
      return [];
    } finally {
      setClientsLoading(false);
    }
  }

  /* ─────────────────────────────────────────────── */
  /* LOAD AUDIT LOGS                                 */
  /* ─────────────────────────────────────────────── */
  async function loadAuditLogs(
    selectedClientId?: number,
    clientList?: ClientOption[]
  ) {
    const reqId = ++auditReqRef.current;
    setAuditLoading(true);

    try {
      const res = await api.get("/Accounting/rates/audit", {
        params: { clientId: selectedClientId, take: 50 },
      });

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

      const clientLookup = clientList ?? clients;

      const mapped: ServiceRateAuditLog[] = (res.data || []).map((x: any) => {
        const after = safeJson(x.afterJson);
        const before = safeJson(x.beforeJson);

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

      // newest first
      mapped.sort(
        (a, b) =>
          new Date(b.performedAt).getTime() - new Date(a.performedAt).getTime()
      );

      setAuditLogs(mapped);
    } catch (err) {
      console.error("Failed to load audit logs:", err);
      if (reqId === auditReqRef.current) setAuditLogs([]);
      toast.error(getApiErrorMessage(err));
    } finally {
      if (reqId === auditReqRef.current) setAuditLoading(false);
    }
  }

  /* INITIAL LOAD */
  useEffect(() => {
    (async () => {
      try {
        const [, loadedClients] = await Promise.all([loadRates(), loadClients()]);
        await loadAuditLogs(undefined, loadedClients);
        didInitialAuditLoad.current = true;
      } catch (err) {
        // keep silent on initial load failures; log for debugging
        console.error("Initial load failed:", err);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* LOAD AUDIT LOGS WHEN CLIENT CHANGES (only after initial audit load) */
  useEffect(() => {
    if (!didInitialAuditLoad.current) return;
    // If no client selected, do not refetch (we already loaded "all" on init)
    if (!clientId) return;
    loadAuditLogs(Number(clientId));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  /* PREFILL FIELDS WHEN CLIENT CHANGES */
  useEffect(() => {
    if (!clientId) {
      setServiceType("");
      setRate("");
      setTerms("");
      return;
    }

    const selectedId = Number(clientId);
    if (!selectedId) return;

    const c = clients.find((x) => x.id === selectedId);

    if (c?.serviceRate) {
      setServiceType(c.serviceRate.serviceType);
      setRate(c.serviceRate.ratePerKg);
      setTerms(c.serviceRate.paymentTerms);
    } else {
      setServiceType("");
      setRate("");
      setTerms("");
    }
  }, [clientId, clients]);

  /* Debounce audit search */
  useEffect(() => {
    const t = setTimeout(() => setAuditFilterText(auditQuery), 250);
    return () => clearTimeout(t);
  }, [auditQuery]);

  /* FILTERING + PAGINATION */
  const filteredRates = useMemo(() => {
    return rates.filter((r) => {
      return (
        (filterClientId === "" || r.clientId.toString().includes(filterClientId)) &&
        (filterClientName === "" ||
          r.clientName.toLowerCase().includes(filterClientName.toLowerCase())) &&
        (filterType === "" ||
          r.serviceType.toLowerCase().includes(filterType.toLowerCase()))
      );
    });
  }, [rates, filterClientId, filterClientName, filterType]);

  const totalPages = Math.max(1, Math.ceil(filteredRates.length / rowsPerPage));
  const paginatedData = filteredRates.slice((page - 1) * rowsPerPage, page * rowsPerPage);

  /* AUDIT LOG FILTERING (UI SEARCH + AUTO CLIENT FILTER) */
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

  /* SAVE */
  async function handleSave() {
    if (!clientId || !serviceType) {
      toast.error("Client and Service Type are required.");
      return;
    }

    const rateNum = Number(rate);
    if (!Number.isFinite(rateNum) || rateNum <= 0) {
      toast.error("Rate must be a valid number greater than 0.");
      return;
    }

    setSaving(true);
    const toastId = toast.loading("Saving rate...");
    try {
      const payload = {
        clientId: Number(clientId),
        serviceType: serviceType.trim(),
        ratePerKg: rateNum.toString(),
        paymentTerms: terms.trim(),
      };

      await api.post("/Accounting/rates", payload);

      await Promise.all([loadRates(), loadClients()]);
      await loadAuditLogs(Number(clientId));

      toast.success("Rate saved successfully!", { id: toastId });

      resetForm();
      setClientSearch("");
      setPage(1);
    } catch (err: any) {
      console.error(err);
      toast.error(getApiErrorMessage(err), { id: toastId });
    } finally {
      setSaving(false);
    }
  }

  /* OPEN CONFIRM MODAL */
  function requestDeactivate(rateRow: ServiceRate) {
    setConfirmRate(rateRow);
    setConfirmOpen(true);
  }

  /* CONFIRM DEACTIVATE */
  async function confirmDeactivate() {
    if (!confirmRate) return;

    setDeletingId(confirmRate.id);
    const toastId = toast.loading("Deactivating rate...");
    try {
      await api.delete(`/Accounting/rates/${confirmRate.id}`);

      setRates((prev) => prev.filter((r) => r.id !== confirmRate.id));

      // Refresh logs after operation
      if (clientId) await loadAuditLogs(Number(clientId));
      else await loadAuditLogs();

      toast.success("Rate deactivated.", { id: toastId });
      setConfirmOpen(false);
      setConfirmRate(null);
    } catch (err) {
      console.error(err);
      toast.error(getApiErrorMessage(err), { id: toastId });
    } finally {
      setDeletingId(null);
    }
  }

  const showingCountText = useMemo(() => {
    return `Showing ${paginatedData.length} of ${filteredRates.length} result(s)`;
  }, [paginatedData.length, filteredRates.length]);

  return (
    <div className="p-4 md:p-6 space-y-8 md:space-y-10">
      {/* TITLE */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Encode Service Rates per Client</h1>
        <p className="text-gray-500 text-sm mt-1">
          Manage hauling service pricing and payment terms for each client.
        </p>
      </div>

      {/* FORM CARD */}
      <div className="bg-white p-6 rounded-xl shadow border">
        <h2 className="text-lg font-semibold mb-5">Add New Service Rate</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LabeledInput
            label="Search Client"
            value={clientSearch}
            onChange={(e) => setClientSearch(e.target.value)}
          />

          <LabeledSelect
            label="Client"
            value={clientId}
            onChange={(e) => {
              setClientId(e.target.value);
              setPage(1);
            }}
            options={filteredClients}
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

        {/* Snapshot */}
        {clientId && (
          <div className="mt-5 rounded-lg border bg-gray-50 p-4 text-sm">
            <p className="font-semibold text-gray-800 mb-2">Current Saved Rate (Snapshot)</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
              <p className="text-gray-700 break-words">
                <span className="text-gray-500">Service:</span>{" "}
                {selectedClient?.serviceRate?.serviceType || "—"}
              </p>
              <p className="text-gray-700 tabular-nums">
                <span className="text-gray-500">Rate:</span>{" "}
                ₱{Number(selectedClient?.serviceRate?.ratePerKg || 0).toFixed(2)}
              </p>
              <p className="text-gray-700 break-words">
                <span className="text-gray-500">Terms:</span>{" "}
                {selectedClient?.serviceRate?.paymentTerms || "—"}
              </p>
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col sm:flex-row gap-2">
          <button
            onClick={handleSave}
            disabled={saving || clientsLoading || loading || !clientId || !serviceType}
            className="w-full md:w-auto bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 text-white px-6 py-3 rounded-lg shadow font-medium"
          >
            {saving ? "Saving..." : "Save Rate"}
          </button>

          <button
            type="button"
            onClick={resetForm}
            disabled={saving}
            className="w-full md:w-auto border bg-white hover:bg-gray-50 disabled:bg-gray-100 px-6 py-3 rounded-lg font-medium"
          >
            Reset
          </button>
        </div>
      </div>

      {/* TABLE CARD */}
      <div className="bg-white p-6 rounded-xl shadow border">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-5">
          <h2 className="text-lg font-semibold">Existing Service Rates</h2>

          <button
            type="button"
            onClick={clearFilters}
            className="w-full md:w-auto px-4 py-2 rounded-lg border bg-white hover:bg-gray-50"
          >
            Clear Filters
          </button>
        </div>

        {/* FILTERS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-3">
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

        <p className="text-xs text-gray-500 mb-4">{showingCountText}</p>

        {loading && <p className="text-gray-500">Loading...</p>}

        {/* MOBILE (cards) */}
        <div className="md:hidden space-y-3">
          {paginatedData.map((r) => (
            <div key={r.id} className="border rounded-xl p-4 bg-white">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 break-words">{r.clientName}</p>
                  <p className="text-sm text-gray-600 break-words">{r.serviceType}</p>
                </div>

                <span className="text-sm font-semibold text-gray-900 tabular-nums whitespace-nowrap">
                  ₱{parseFloat(r.ratePerKg).toFixed(2)}
                </span>
              </div>

              <div className="mt-3 text-sm text-gray-700 break-words">
                <span className="text-gray-500">Terms:</span> {r.paymentTerms}
              </div>

              <div className="mt-4">
                <button
                  onClick={() => requestDeactivate(r)}
                  disabled={deletingId === r.id}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-3 py-2 rounded-lg"
                >
                  {deletingId === r.id ? "Deactivating..." : "Deactivate"}
                </button>
              </div>
            </div>
          ))}

          {!loading && paginatedData.length === 0 && (
            <div className="py-10 text-center text-gray-400 border rounded-xl">
              No matching results.
            </div>
          )}
        </div>

        {/* DESKTOP (table) */}
        <div className="hidden md:block overflow-x-auto">
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
                  <td className="py-3 px-3 tabular-nums">
                    ₱{parseFloat(r.ratePerKg).toFixed(2)}
                  </td>
                  <td className="py-3 px-3">{r.paymentTerms}</td>
                  <td className="py-3 px-3">
                    <button
                      onClick={() => requestDeactivate(r)}
                      disabled={deletingId === r.id}
                      className="bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white px-3 py-1 rounded"
                    >
                      {deletingId === r.id ? "Deactivating..." : "Deactivate"}
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
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mt-6">
          <button
            disabled={page === 1}
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            className={`px-4 py-2 rounded border ${
              page === 1 ? "text-gray-400 bg-gray-100" : "bg-white hover:bg-gray-50"
            }`}
          >
            Previous
          </button>

          <p className="text-gray-600 text-sm">
            Page <b>{page}</b> of <b>{totalPages}</b>
          </p>

          <button
            disabled={page === totalPages}
            onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
            className={`px-4 py-2 rounded border ${
              page === totalPages ? "text-gray-400 bg-gray-100" : "bg-white hover:bg-gray-50"
            }`}
          >
            Next
          </button>
        </div>

        {/* AUDIT LOGS */}
        <div className="mt-10 pt-6 border-t">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-800">Audit Logs</h3>
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
                value={auditQuery}
                onChange={(e) => setAuditQuery(e.target.value)}
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

          {auditLoading && <p className="text-gray-500 text-sm">Loading audit logs...</p>}

          {!auditLoading && (
            <>
              {/* MOBILE (cards) */}
              <div className="md:hidden space-y-3">
                {filteredAuditLogs.map((a) => (
                  <div key={a.id} className="border rounded-xl p-4 bg-white">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-sm text-gray-500">
                          {new Date(a.performedAt).toLocaleString()}
                        </p>
                        <p className="font-semibold text-gray-900 break-words">
                          {a.performedBy}
                        </p>
                        <p className="text-sm text-gray-700 break-words">{a.clientName}</p>
                      </div>

                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold whitespace-nowrap ${
                          a.action === "CREATE"
                            ? "bg-green-100 text-green-700"
                            : a.action === "DEACTIVATE"
                            ? "bg-red-100 text-red-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {a.action}
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-1 gap-1 text-sm">
                      <p className="text-gray-700 break-words">
                        <span className="text-gray-500">Service:</span> {a.serviceType}
                      </p>
                      <p className="text-gray-700 tabular-nums">
                        <span className="text-gray-500">Rate:</span> ₱
                        {Number(a.ratePerKg || 0).toFixed(2)}
                      </p>
                      <p className="text-gray-700 break-words">
                        <span className="text-gray-500">Terms:</span> {a.paymentTerms}
                      </p>
                    </div>

                    <div className="mt-3 text-sm text-gray-600 break-words">
                      <span className="text-gray-500">Notes:</span> {a.notes ?? "—"}
                    </div>
                  </div>
                ))}

                {filteredAuditLogs.length === 0 && (
                  <div className="py-10 text-center text-gray-400 border rounded-xl">
                    No logs match your search.
                  </div>
                )}
              </div>

              {/* DESKTOP (table) */}
              <div className="hidden md:block overflow-x-auto">
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
                        <td className="py-3 px-3 tabular-nums">
                          ₱{Number(a.ratePerKg || 0).toFixed(2)}
                        </td>
                        <td className="py-3 px-3">{a.paymentTerms}</td>
                        <td className="py-3 px-3 text-gray-500">{a.notes ?? "—"}</td>
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
            </>
          )}

          {!auditLoading && auditLogs.length === 0 && (
            <p className="text-xs text-gray-400 mt-3">
              No audit logs found yet. Perform a rate create/deactivate to generate logs.
            </p>
          )}
        </div>
      </div>

      {/* CONFIRM MODAL */}
      <ConfirmModal
        open={confirmOpen}
        title="Deactivate Service Rate"
        message={
          confirmRate
            ? `Are you sure you want to deactivate this rate for "${confirmRate.clientName}" (${confirmRate.serviceType})?`
            : "Are you sure you want to deactivate this rate?"
        }
        confirmText={deletingId ? "Deactivating..." : "Deactivate"}
        confirmDisabled={!!deletingId}
        onClose={() => {
          if (deletingId) return; // prevent closing while processing
          setConfirmOpen(false);
          setConfirmRate(null);
        }}
        onConfirm={confirmDeactivate}
      />
    </div>
  );
}

/* ─────────────────────────────────────────────── */
/* REUSABLE INPUT COMPONENT                         */
/* ─────────────────────────────────────────────── */
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
        className="border rounded-lg px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );
}

/* ─────────────────────────────────────────────── */
/* CLIENT DROPDOWN COMPONENT                        */
/* ─────────────────────────────────────────────── */
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
        className="border rounded-lg px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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

/* ─────────────────────────────────────────────── */
/* SIMPLE CONFIRM MODAL                             */
/* ─────────────────────────────────────────────── */
function ConfirmModal({
  open,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmDisabled,
  onConfirm,
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmDisabled?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="absolute inset-0 flex items-end sm:items-center justify-center p-4">
        <div className="w-full sm:max-w-lg bg-white rounded-2xl shadow-xl border p-5">
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          <p className="text-sm text-gray-600 mt-2 break-words">{message}</p>

          <div className="mt-5 flex flex-col sm:flex-row gap-2 sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={!!confirmDisabled}
              className="w-full sm:w-auto px-4 py-2 rounded-lg border bg-white hover:bg-gray-50 disabled:bg-gray-100"
            >
              {cancelText}
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={!!confirmDisabled}
              className="w-full sm:w-auto px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-medium"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
