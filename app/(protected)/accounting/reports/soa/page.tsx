"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  Download,
  FileText,
  Search,
  X,
  Printer,
  ChevronDown,
  Check,
  Copy,
} from "lucide-react";
import api from "@/lib/api";

const API_ORIGIN = process.env.NEXT_PUBLIC_API_ORIGIN || "http://localhost:5001";
const RECENT_KEY = "soa_recent_clients_v1";

type ClientSearchItem = {
  id: number;
  codeName: string;
  registeredCompanyName: string;
};

type SoaResponse = {
  client: { id: number; codeName: string; registeredCompanyName: string };
  periodFrom: string | null;
  periodTo: string | null;
  asOf: string;
  totals: { totalBilled: string; totalApplied: string; totalRemaining: string };
  aging: {
    current0To30: string;
    days31To60: string;
    days61To90: string;
    over90: string;
  };
  ledgerRows: Array<{
    date: string | null;
    refNo: string | null;
    type: "INVOICE" | "PAYMENT";
    description: string;
    billedAmount: string;
    paymentAmount: string;
    runningBalance: string;
  }>;
  outstandingInvoices: Array<{
    invoiceNo: string | null;
    generateDate: string | null;
    dueDate: string | null;
    daysPastDue: number;
    billedAmount: string;
    appliedAmount: string;
    remainingAmount: string;
    sentInvoiceImagePath: string | null;
  }>;
};

const fmtDate = (d?: string | null) => (d ? d.split("T")[0] : "-");
const toNum = (s?: string | null) =>
  Number(String(s ?? "0").replace(/,/g, "")) || 0;
const money = (s?: string | null) =>
  `₱${toNum(s).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

type ToastType = "success" | "error" | "info";
type ToastState = { type: ToastType; text: string } | null;

type SortKey = "date" | "refNo" | "billed" | "paid" | "balance";
type SortDir = "asc" | "desc";

function clampPageDate(d?: string) {
  // <input type="date" /> gives yyyy-mm-dd already; just guard
  return d?.trim() ? d.trim() : "";
}

function getRange(kind: string) {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = now.getMonth(); // 0-index
  const pad = (n: number) => String(n).padStart(2, "0");
  const iso = (dt: Date) =>
    `${dt.getFullYear()}-${pad(dt.getMonth() + 1)}-${pad(dt.getDate())}`;

  if (kind === "this_month") {
    const from = new Date(yyyy, mm, 1);
    const to = new Date(yyyy, mm + 1, 0);
    return { from: iso(from), to: iso(to) };
  }

  if (kind === "last_month") {
    const from = new Date(yyyy, mm - 1, 1);
    const to = new Date(yyyy, mm, 0);
    return { from: iso(from), to: iso(to) };
  }

  if (kind === "ytd") {
    const from = new Date(yyyy, 0, 1);
    const to = new Date(yyyy, mm + 1, 0);
    return { from: iso(from), to: iso(to) };
  }

  // none
  return { from: "", to: "" };
}

function safeJsonParse<T>(s: string | null, fallback: T): T {
  try {
    return s ? (JSON.parse(s) as T) : fallback;
  } catch {
    return fallback;
  }
}

export default function StatementOfAccountsPage() {
  // ✅ Client search state
  const [clientQuery, setClientQuery] = useState("");
  const [clientResults, setClientResults] = useState<ClientSearchItem[]>([]);
  const [clientSearching, setClientSearching] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ClientSearchItem | null>(
    null
  );
  const [showClientDropdown, setShowClientDropdown] = useState(false);

  // recent clients
  const [recentClients, setRecentClients] = useState<ClientSearchItem[]>([]);

  // internal selected id (used by API call)
  const [clientId, setClientId] = useState<number | "">("");

  // optional as-of + period filters
  const [asOf, setAsOf] = useState<string>("");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");
  const [quickRange, setQuickRange] = useState<
    "" | "this_month" | "last_month" | "ytd"
  >("");

  // ledger search + sort
  const [ledgerQ, setLedgerQ] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  // outstanding filter
  const [outstandingFilter, setOutstandingFilter] = useState<
    "all" | "current" | "past_due" | "over_90"
  >("all");

  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [soa, setSoa] = useState<SoaResponse | null>(null);

  // toast instead of inline msg
  const [toast, setToast] = useState<ToastState>(null);
  const toastTimerRef = useRef<number | null>(null);

  const canGenerate = clientId !== "" && Number(clientId) > 0;

  function showToast(type: ToastType, text: string) {
    setToast({ type, text });
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    toastTimerRef.current = window.setTimeout(() => setToast(null), 2500);
  }

  // load recent clients once
  useEffect(() => {
    const saved = safeJsonParse<ClientSearchItem[]>(
      localStorage.getItem(RECENT_KEY),
      []
    );
    setRecentClients(Array.isArray(saved) ? saved : []);
  }, []);

  function pushRecent(c: ClientSearchItem) {
    const next = [c, ...recentClients.filter((x) => x.id !== c.id)].slice(0, 8);
    setRecentClients(next);
    localStorage.setItem(RECENT_KEY, JSON.stringify(next));
  }

  // ✅ minimal debounce for search (best practice: avoids spamming API)
  useEffect(() => {
    const q = clientQuery.trim();
    if (q.length < 2) {
      setClientResults([]);
      setClientSearching(false);
      return;
    }

    setClientSearching(true);
    const t = setTimeout(async () => {
      try {
        const res = await api.get(`/Accounting/clients/search`, { params: { q } });
        setClientResults(Array.isArray(res.data) ? res.data : []);
      } catch {
        setClientResults([]);
      } finally {
        setClientSearching(false);
      }
    }, 250);

    return () => clearTimeout(t);
  }, [clientQuery]);

  // quick range -> set from/to
  useEffect(() => {
    if (!quickRange) return;
    const r = getRange(quickRange);
    setFrom(r.from);
    setTo(r.to);
  }, [quickRange]);

  async function generateSOA() {
    if (!canGenerate) {
      showToast("error", "Please select a client from the dropdown.");
      return;
    }

    // keep old SOA visible; just mark as refreshing
    const hadData = !!soa;
    setLoading(true);
    setRefreshing(hadData);

    try {
      const res = await api.get(`/Accounting/statement/${clientId}`, {
        params: {
          ...(clampPageDate(asOf) ? { asOf: clampPageDate(asOf) } : {}),
          ...(clampPageDate(from) ? { from: clampPageDate(from) } : {}),
          ...(clampPageDate(to) ? { to: clampPageDate(to) } : {}),
        },
      });

      setSoa(res.data);
      showToast("success", hadData ? "SOA refreshed." : "SOA generated.");
    } catch (e: any) {
      const data = e?.response?.data;
      showToast("error", typeof data === "string" ? data : "Failed to generate SOA.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  // dropdown keyboard navigation
  const [activeIdx, setActiveIdx] = useState<number>(-1);

  const dropdownWrapRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (!dropdownWrapRef.current) return;
      if (!dropdownWrapRef.current.contains(e.target as Node)) {
        setShowClientDropdown(false);
        setActiveIdx(-1);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const dropdownItems: ClientSearchItem[] = useMemo(() => {
    const q = clientQuery.trim();
    if (q.length < 2) return recentClients;
    return clientResults;
  }, [clientQuery, clientResults, recentClients]);

  function selectClient(c: ClientSearchItem) {
    setSelectedClient(c);
    setClientId(c.id);
    setClientQuery(`${c.registeredCompanyName} (${c.codeName})`);
    setShowClientDropdown(false);
    setActiveIdx(-1);
    pushRecent(c);
  }

  function onClientKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showClientDropdown) return;

    const items = dropdownItems;
    if (!items || items.length === 0) {
      if (e.key === "Escape") setShowClientDropdown(false);
      return;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((x) => Math.min(x + 1, items.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((x) => Math.max(x - 1, 0));
    } else if (e.key === "Enter") {
      if (activeIdx >= 0 && activeIdx < items.length) {
        e.preventDefault();
        selectClient(items[activeIdx]);
      }
    } else if (e.key === "Escape") {
      setShowClientDropdown(false);
      setActiveIdx(-1);
    }
  }

  const filteredLedgerRows = useMemo(() => {
    if (!soa) return [];
    const q = ledgerQ.trim().toLowerCase();
    const base = !q
      ? soa.ledgerRows
      : soa.ledgerRows.filter((r) => {
          const hay = [
            r.refNo ?? "",
            r.type ?? "",
            r.description ?? "",
            r.billedAmount ?? "",
            r.paymentAmount ?? "",
            r.runningBalance ?? "",
            fmtDate(r.date),
          ]
            .join(" ")
            .toLowerCase();
          return hay.includes(q);
        });

    const dir = sortDir === "asc" ? 1 : -1;
    const getDate = (s: string | null) => (s ? new Date(s).getTime() : 0);

    const sorted = [...base].sort((a, b) => {
      if (sortKey === "date") return (getDate(a.date) - getDate(b.date)) * dir;
      if (sortKey === "refNo") return String(a.refNo || "").localeCompare(String(b.refNo || "")) * dir;
      if (sortKey === "billed") return (toNum(a.billedAmount) - toNum(b.billedAmount)) * dir;
      if (sortKey === "paid") return (toNum(a.paymentAmount) - toNum(b.paymentAmount)) * dir;
      return (toNum(a.runningBalance) - toNum(b.runningBalance)) * dir;
    });

    return sorted;
  }, [soa, ledgerQ, sortKey, sortDir]);

  function toggleSort(nextKey: SortKey) {
    if (sortKey !== nextKey) {
      setSortKey(nextKey);
      setSortDir("asc");
      return;
    }
    setSortDir((d) => (d === "asc" ? "desc" : "asc"));
  }

  const csvText = useMemo(() => {
    if (!soa) return "";

    const headerBlock: string[][] = [
      ["Client", `${soa.client.registeredCompanyName} (${soa.client.codeName})`],
      ["As Of", fmtDate(soa.asOf)],
      ["Period From", fmtDate(soa.periodFrom)],
      ["Period To", fmtDate(soa.periodTo)],
      [],
      ["Total Billed", soa.totals.totalBilled],
      ["Total Applied", soa.totals.totalApplied],
      ["Total Remaining", soa.totals.totalRemaining],
      [],
      ["Aging 0-30", soa.aging.current0To30],
      ["Aging 31-60", soa.aging.days31To60],
      ["Aging 61-90", soa.aging.days61To90],
      ["Aging 90+", soa.aging.over90],
      [],
    ];

    const ledgerHeader = [
      "Date",
      "Invoice/Receipt No",
      "Type",
      "Description",
      "Billed Amount",
      "Payment Amount",
      "Running Balance",
    ];

    const rows = soa.ledgerRows.map((r) => [
      fmtDate(r.date),
      r.refNo || "",
      r.type,
      r.description,
      r.billedAmount || "",
      r.paymentAmount || "",
      r.runningBalance || "",
    ]);

    const esc = (v: any) => `"${String(v ?? "").replaceAll(`"`, `""`)}"`;
    const line = (cols: any[]) => cols.map(esc).join(",");

    const lines: string[] = [];
    headerBlock.forEach((r) => {
      if (r.length === 0) lines.push("");
      else lines.push(line(r));
    });

    lines.push(line(ledgerHeader));
    rows.forEach((r) => lines.push(line(r)));

    return lines.join("\n");
  }, [soa]);

  function exportCsv() {
    if (!soa) return;

    const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `SOA_${soa.client.codeName || soa.client.id}_${fmtDate(soa.asOf)}.csv`;
    a.click();

    URL.revokeObjectURL(url);
    showToast("success", "CSV exported.");
  }

  function printSoa() {
    window.print();
  }

  const filteredOutstanding = useMemo(() => {
    if (!soa) return [];
    const list = soa.outstandingInvoices || [];
    const f = outstandingFilter;

    const out = list.filter((x) => {
      const days = Number(x.daysPastDue || 0);
      if (f === "current") return days <= 0;
      if (f === "past_due") return days > 0;
      if (f === "over_90") return days > 90;
      return true;
    });

    // sensible default: most overdue first
    return [...out].sort((a, b) => (b.daysPastDue || 0) - (a.daysPastDue || 0));
  }, [soa, outstandingFilter]);

  async function copyText(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      showToast("success", "Copied.");
    } catch {
      showToast("error", "Copy failed.");
    }
  }

  const showDropdown =
    showClientDropdown &&
    (clientSearching ||
      dropdownItems.length > 0 ||
      clientQuery.trim().length >= 2 ||
      (clientQuery.trim().length < 2 && recentClients.length > 0));

  const dropdownTitle =
    clientQuery.trim().length < 2 ? "Recent clients" : "Search results";

  return (
    <div className="max-w-7xl mx-auto space-y-8 sm:space-y-10 p-4 sm:p-0">
      {/* TOAST */}
      {toast && (
        <div className="fixed top-5 right-5 z-[100] max-w-[calc(100vw-2.5rem)]">
          <div
            className={`rounded-xl px-4 py-3 shadow-lg border text-sm break-words ${
              toast.type === "success"
                ? "bg-green-50 border-green-200 text-green-700"
                : toast.type === "error"
                ? "bg-red-50 border-red-200 text-red-700"
                : "bg-gray-50 border-gray-200 text-gray-700"
            }`}
          >
            {toast.text}
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
        <div className="min-w-0">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-gray-900">
            Statement of Accounts (SOA)
          </h1>
          <p className="text-gray-500 break-words">
            Generate and review client statements, including balances, payments, and outstanding invoices.
          </p>
        </div>

        {/* subtle status */}
        {refreshing && (
          <span className="text-xs px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 w-fit">
            Refreshing…
          </span>
        )}
      </div>

      {/* FILTERS */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 space-y-5 sm:space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-800">Search Client</h2>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <button
              onClick={printSoa}
              disabled={!soa}
              className="flex items-center justify-center gap-2 px-4 py-2 border rounded-lg hover:bg-gray-50 disabled:opacity-60 w-full sm:w-auto"
              title="Print (add print stylesheet for best result)"
            >
              <Printer size={16} />
              Print
            </button>

            <div className="relative w-full sm:w-auto">
              <select
                value={quickRange}
                onChange={(e) => setQuickRange(e.target.value as any)}
                className="input pr-10 w-full"
                title="Quick range"
              >
                <option value="">Quick range</option>
                <option value="this_month">This month</option>
                <option value="last_month">Last month</option>
                <option value="ytd">YTD</option>
              </select>
              <ChevronDown
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                size={16}
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
          {/* Client autocomplete */}
          <div className="relative lg:col-span-3" ref={dropdownWrapRef}>
            <input
              placeholder="Type client code or name (min 2 chars)"
              value={clientQuery}
              onChange={(e) => {
                setClientQuery(e.target.value);
                setShowClientDropdown(true);
                setActiveIdx(-1);
                // ensure user re-selects from dropdown
                setSelectedClient(null);
                setClientId("");
              }}
              onFocus={() => {
                setShowClientDropdown(true);
                setActiveIdx(-1);
              }}
              onKeyDown={onClientKeyDown}
              className="input w-full"
            />

            {/* selected pill */}
            {selectedClient && (
              <div className="mt-2 inline-flex items-center gap-2 text-xs px-2.5 py-1 rounded-full bg-gray-50 border max-w-full">
                <Check size={14} className="text-green-600 shrink-0" />
                <span className="text-gray-700 truncate">
                  {selectedClient.registeredCompanyName} ({selectedClient.codeName})
                </span>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-700 shrink-0"
                  title="Clear selection"
                  onClick={() => {
                    setSelectedClient(null);
                    setClientId("");
                    setClientQuery("");
                    setClientResults([]);
                    setShowClientDropdown(false);
                    setActiveIdx(-1);
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            )}

            {showDropdown && (
              <div className="absolute z-50 mt-2 w-full bg-white border rounded-lg shadow-lg overflow-hidden">
                <div className="px-3 py-2 text-xs text-gray-500 bg-gray-50 border-b">
                  {dropdownTitle}
                </div>

                {clientSearching ? (
                  <div className="p-3 text-sm text-gray-500">Searching…</div>
                ) : dropdownItems.length === 0 ? (
                  <div className="p-3 text-sm text-gray-500">
                    {clientQuery.trim().length < 2
                      ? "No recent clients yet."
                      : "No clients found."}
                  </div>
                ) : (
                  <ul className="max-h-64 overflow-auto">
                    {dropdownItems.map((c, idx) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onMouseEnter={() => setActiveIdx(idx)}
                          onClick={() => selectClient(c)}
                          className={`w-full text-left px-4 py-3 ${
                            idx === activeIdx ? "bg-gray-50" : "hover:bg-gray-50"
                          }`}
                        >
                          <div className="font-medium text-gray-900">
                            {c.registeredCompanyName}
                          </div>
                          <div className="text-xs text-gray-500">
                            {c.codeName} • ID {c.id}
                          </div>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </div>

          {/* as-of */}
          <Input
            placeholder="As of (optional)"
            type="date"
            value={asOf}
            onChange={(e: any) => setAsOf(e.target.value)}
          />

          {/* from/to (backend already supports) */}
          <Input
            placeholder="From (optional)"
            type="date"
            value={from}
            onChange={(e: any) => {
              setQuickRange("");
              setFrom(e.target.value);
            }}
          />
          <Input
            placeholder="To (optional)"
            type="date"
            value={to}
            onChange={(e: any) => {
              setQuickRange("");
              setTo(e.target.value);
            }}
          />
        </div>

        <button
          onClick={generateSOA}
          disabled={!canGenerate || loading}
          className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-60 w-full sm:w-auto"
        >
          <Search size={18} />
          {loading ? "Generating..." : "Generate SOA"}
        </button>
      </div>

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6">
        <SummaryCard
          label="Total Amount Billed"
          value={soa ? money(soa.totals.totalBilled) : "₱0.00"}
          loading={loading && !soa}
        />
        <SummaryCard
          label="Total Payments Applied (Cash + WHT)"
          value={soa ? money(soa.totals.totalApplied) : "₱0.00"}
          loading={loading && !soa}
        />
        <SummaryCard
          label="Outstanding Balance"
          value={soa ? money(soa.totals.totalRemaining) : "₱0.00"}
          highlight
          loading={loading && !soa}
        />
      </div>

      {/* SOA TABLE */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 space-y-4">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3 min-w-0">
            <h2 className="text-lg font-semibold text-gray-800">SOA Details</h2>
            {soa && (
              <div className="text-xs text-gray-500 break-words">
                <span className="font-medium text-gray-700">
                  {soa.client.registeredCompanyName}
                </span>{" "}
                • As of {fmtDate(soa.asOf)}
                {soa.periodFrom || soa.periodTo ? (
                  <>
                    {" "}
                    • Period {fmtDate(soa.periodFrom)} to {fmtDate(soa.periodTo)}
                  </>
                ) : null}
              </div>
            )}
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap gap-2">
            <button
              onClick={exportCsv}
              disabled={!soa || loading}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-60 w-full sm:w-auto"
            >
              <Download size={18} />
              Export CSV
            </button>

            <button
              disabled
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-yellow-600 text-white rounded-lg opacity-60 cursor-not-allowed w-full sm:w-auto"
              title="Add PDF export next (frontend jsPDF or backend PDF endpoint)."
            >
              <FileText size={18} />
              Export PDF
            </button>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="w-full sm:max-w-sm relative">
            <Input
              placeholder="Search ledger (invoice no, receipt, text...)"
              value={ledgerQ}
              onChange={(e: any) => setLedgerQ(e.target.value)}
            />
            {ledgerQ.trim() && (
              <button
                type="button"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700"
                title="Clear"
                onClick={() => setLedgerQ("")}
              >
                <X size={16} />
              </button>
            )}
          </div>

          {soa && (
            <div className="text-xs text-gray-500">
              Showing{" "}
              <span className="font-medium text-gray-700">
                {filteredLedgerRows.length}
              </span>{" "}
              of{" "}
              <span className="font-medium text-gray-700">
                {soa.ledgerRows.length}
              </span>{" "}
              rows
            </div>
          )}
        </div>

        {/* scrollable with sticky header */}
        <div className="relative max-h-[520px] overflow-auto border rounded-lg -mx-4 sm:mx-0">
          <div className="min-w-[920px] px-4 sm:px-0">
            <table className="w-full text-sm">
              <thead className="text-gray-500 sticky top-0 bg-white z-10 border-b">
                <tr className="text-left uppercase text-xs tracking-wide">
                  <ThSort
                    label="Date"
                    active={sortKey === "date"}
                    dir={sortDir}
                    onClick={() => toggleSort("date")}
                  />
                  <ThSort
                    label="Invoice/Receipt No."
                    active={sortKey === "refNo"}
                    dir={sortDir}
                    onClick={() => toggleSort("refNo")}
                  />
                  <th className="py-3 px-3">Description</th>
                  <ThSortRight
                    label="Billed Amount"
                    active={sortKey === "billed"}
                    dir={sortDir}
                    onClick={() => toggleSort("billed")}
                  />
                  <ThSortRight
                    label="Payment"
                    active={sortKey === "paid"}
                    dir={sortDir}
                    onClick={() => toggleSort("paid")}
                  />
                  <ThSortRight
                    label="Running Balance"
                    active={sortKey === "balance"}
                    dir={sortDir}
                    onClick={() => toggleSort("balance")}
                  />
                </tr>
              </thead>

              <tbody>
                {!soa ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-400">
                      No SOA data generated
                    </td>
                  </tr>
                ) : filteredLedgerRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-10 text-gray-400">
                      {soa.ledgerRows.length === 0
                        ? "This client has no invoices/payments for the selected criteria."
                        : "No ledger rows match your search."}
                    </td>
                  </tr>
                ) : (
                  filteredLedgerRows.map((r, idx) => (
                    <tr
                      key={idx}
                      className={`border-t ${
                        idx % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                      } hover:bg-blue-50/30`}
                    >
                      <td className="py-3 px-3 tabular-nums whitespace-nowrap">
                        {fmtDate(r.date)}
                      </td>
                      <td className="py-3 px-3 tabular-nums whitespace-nowrap">
                        {r.refNo || "-"}
                      </td>
                      <td className="py-3 px-3">
                        <div className="font-medium text-gray-800">
                          {r.description}
                        </div>
                        <div className="text-xs text-gray-500">{r.type}</div>
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums whitespace-nowrap">
                        {r.billedAmount ? money(r.billedAmount) : "-"}
                      </td>
                      <td className="py-3 px-3 text-right tabular-nums whitespace-nowrap">
                        {r.paymentAmount ? money(r.paymentAmount) : "-"}
                      </td>
                      <td className="py-3 px-3 text-right font-semibold tabular-nums whitespace-nowrap">
                        {money(r.runningBalance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* OUTSTANDING INVOICES */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 space-y-5 sm:space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-800">Outstanding Invoices</h2>

          <div className="flex flex-wrap gap-2">
            <Chip
              active={outstandingFilter === "all"}
              onClick={() => setOutstandingFilter("all")}
            >
              All
            </Chip>
            <Chip
              active={outstandingFilter === "current"}
              onClick={() => setOutstandingFilter("current")}
            >
              Current
            </Chip>
            <Chip
              active={outstandingFilter === "past_due"}
              onClick={() => setOutstandingFilter("past_due")}
            >
              Past due
            </Chip>
            <Chip
              active={outstandingFilter === "over_90"}
              onClick={() => setOutstandingFilter("over_90")}
            >
              Over 90
            </Chip>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
          <BreakdownCard
            label="Current (0–30 days)"
            value={soa ? money(soa.aging.current0To30) : "₱0.00"}
          />
          <BreakdownCard
            label="31–60 days"
            value={soa ? money(soa.aging.days31To60) : "₱0.00"}
          />
          <BreakdownCard
            label="61–90 days"
            value={soa ? money(soa.aging.days61To90) : "₱0.00"}
          />
          <BreakdownCard
            label="Over 90 days"
            value={soa ? money(soa.aging.over90) : "₱0.00"}
            highlight
          />
        </div>

        {soa && (soa.outstandingInvoices?.length ?? 0) > 0 && (
          <div className="overflow-x-auto pt-2 border rounded-lg -mx-4 sm:mx-0">
            <div className="min-w-[900px] px-4 sm:px-0">
              <table className="w-full text-sm">
                <thead className="text-gray-500 bg-white sticky top-0">
                  <tr className="text-left uppercase text-xs tracking-wide border-b">
                    <th className="py-3 px-3">Invoice No.</th>
                    <th className="py-3 px-3">Generate Date</th>
                    <th className="py-3 px-3">Due Date</th>
                    <th className="py-3 px-3">Days Past Due</th>
                    <th className="py-3 px-3 text-right">Remaining</th>
                    <th className="py-3 px-3">Proof</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOutstanding.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-gray-400">
                        No invoices match the selected filter.
                      </td>
                    </tr>
                  ) : (
                    filteredOutstanding.map((x, i) => {
                      const isPastDue = (x.daysPastDue || 0) > 0;
                      const over90 = (x.daysPastDue || 0) > 90;

                      return (
                        <tr
                          key={i}
                          className={`border-t ${
                            i % 2 === 0 ? "bg-white" : "bg-gray-50/40"
                          } ${over90 ? "bg-red-50/40" : ""}`}
                        >
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-2">
                              <span className="tabular-nums whitespace-nowrap">
                                {x.invoiceNo || "-"}
                              </span>
                              {x.invoiceNo && (
                                <button
                                  type="button"
                                  className="text-gray-400 hover:text-gray-700"
                                  title="Copy invoice no"
                                  onClick={() => copyText(x.invoiceNo!)}
                                >
                                  <Copy size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                          <td className="py-3 px-3 tabular-nums whitespace-nowrap">
                            {fmtDate(x.generateDate)}
                          </td>
                          <td className="py-3 px-3 tabular-nums whitespace-nowrap">
                            {fmtDate(x.dueDate)}
                          </td>
                          <td
                            className={`py-3 px-3 tabular-nums whitespace-nowrap ${
                              isPastDue
                                ? "text-red-600 font-semibold"
                                : "text-gray-600"
                            }`}
                          >
                            {isPastDue ? x.daysPastDue : "Current"}
                          </td>
                          <td className="py-3 px-3 text-right font-semibold tabular-nums whitespace-nowrap">
                            {money(x.remainingAmount)}
                          </td>
                          <td className="py-3 px-3 whitespace-nowrap">
                            {x.sentInvoiceImagePath ? (
                              <a
                                className="text-blue-600 hover:underline"
                                href={`${API_ORIGIN}/${String(
                                  x.sentInvoiceImagePath
                                ).replace(/^\/+/, "")}`}
                                target="_blank"
                                rel="noreferrer"
                              >
                                View
                              </a>
                            ) : (
                              "-"
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {soa && (soa.outstandingInvoices?.length ?? 0) === 0 && (
          <div className="text-sm text-gray-500">No outstanding invoices.</div>
        )}
      </div>
    </div>
  );
}

/* INPUT COMPONENT */
function Input({ placeholder, value, onChange, type = "text" }: any) {
  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className="input w-full"
    />
  );
}

function ThSort({
  label,
  active,
  dir,
  onClick,
}: {
  label: string;
  active: boolean;
  dir: "asc" | "desc";
  onClick: () => void;
}) {
  return (
    <th className="py-3 px-3">
      <button
        type="button"
        onClick={onClick}
        className={`inline-flex items-center gap-1 hover:text-gray-700 ${
          active ? "text-gray-700" : "text-gray-500"
        }`}
        title="Sort"
      >
        <span className="whitespace-nowrap">{label}</span>
        <span className="text-[10px]">{active ? (dir === "asc" ? "▲" : "▼") : ""}</span>
      </button>
    </th>
  );
}

function ThSortRight(props: any) {
  return (
    <th className="py-3 px-3 text-right">
      <button
        type="button"
        onClick={props.onClick}
        className={`inline-flex items-center justify-end gap-1 w-full hover:text-gray-700 ${
          props.active ? "text-gray-700" : "text-gray-500"
        }`}
        title="Sort"
      >
        <span className="whitespace-nowrap">{props.label}</span>
        <span className="text-[10px]">
          {props.active ? (props.dir === "asc" ? "▲" : "▼") : ""}
        </span>
      </button>
    </th>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active?: boolean;
  onClick: () => void;
  children: any;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-3 py-1.5 rounded-full text-xs border transition ${
        active
          ? "bg-blue-50 border-blue-200 text-blue-700"
          : "bg-white border-gray-200 text-gray-600 hover:bg-gray-50"
      }`}
    >
      {children}
    </button>
  );
}

/* SUMMARY CARD */
function SummaryCard({
  label,
  value,
  highlight,
  loading,
}: {
  label: string;
  value: string;
  highlight?: boolean;
  loading?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 sm:p-6 flex flex-col text-center ${
        highlight ? "bg-red-50 border border-red-200" : "bg-white shadow-sm"
      }`}
    >
      <span className="text-sm text-gray-500 break-words">{label}</span>
      {loading ? (
        <div className="mt-2 h-8 w-2/3 mx-auto rounded bg-gray-200 animate-pulse" />
      ) : (
        <span
          className={`text-xl sm:text-2xl font-bold tabular-nums break-words ${
            highlight ? "text-red-600" : "text-gray-800"
          }`}
        >
          {value}
        </span>
      )}
    </div>
  );
}

/* BREAKDOWN CARD */
function BreakdownCard({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl p-4 sm:p-5 flex flex-col gap-1 ${
        highlight ? "bg-red-50 border border-red-200" : "bg-gray-50"
      }`}
    >
      <span className="text-sm text-gray-500 break-words">{label}</span>
      <span
        className={`text-lg sm:text-xl font-semibold tabular-nums break-words ${
          highlight ? "text-red-600" : "text-gray-800"
        }`}
      >
        {value}
      </span>
    </div>
  );
}
