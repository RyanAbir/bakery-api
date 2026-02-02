"use client";

import { useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

type LedgerEntry = {
  id: string;
  date?: string;
  account?: { name?: string } | null;
  accountId?: string | null;
  direction?: string | null;
  amount?: number | null;
  note?: string | null;
  refType?: string | null;
  refId?: string | null;
};

type Filters = {
  from: string;
  to: string;
  accountId: string;
};

const emptyFilters: Filters = {
  from: "",
  to: "",
  accountId: "",
};

export default function LedgerPage() {
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>(emptyFilters);

  async function loadLedger(current: Filters) {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams();
    if (current.from) params.set("from", current.from);
    if (current.to) params.set("to", current.to);
    if (current.accountId) params.set("accountId", current.accountId);

    const query = params.toString();

    try {
      const data = await apiGet(
        `/ledger${query ? `?${query}` : ""}`,
        { cache: "no-store" }
      );

      const list = Array.isArray(data)
        ? data
        : data?.entries ?? data?.data ?? [];

      setEntries(Array.isArray(list) ? list : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load ledger");
      setEntries([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadLedger(filters);
  }, []);

  function update<K extends keyof Filters>(key: K, value: Filters[K]) {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <div>
      <h1>Ledger</h1>

      <form
        onSubmit={(event) => {
          event.preventDefault();
          loadLedger(filters);
        }}
      >
        <div>
          <label>
            From
            <input
              type="date"
              value={filters.from}
              onChange={(event) => update("from", event.target.value)}
            />
          </label>
        </div>

        <div>
          <label>
            To
            <input
              type="date"
              value={filters.to}
              onChange={(event) => update("to", event.target.value)}
            />
          </label>
        </div>

        <div>
          <label>
            Account ID
            <input
              value={filters.accountId}
              onChange={(event) => update("accountId", event.target.value)}
            />
          </label>
        </div>

        <button type="submit">Apply</button>
        <button
          type="button"
          onClick={() => {
            setFilters(emptyFilters);
            loadLedger(emptyFilters);
          }}
        >
          Reset
        </button>
      </form>

      {loading ? <p>Loading...</p> : null}
      {error ? <p>{error}</p> : null}
      {!loading && !error && entries.length === 0 ? <p>No entries.</p> : null}

      {!loading && !error && entries.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Account</th>
              <th>Direction</th>
              <th>Amount</th>
              <th>Note</th>
              <th>Reference</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.date ?? "-"}</td>
                <td>{entry.account?.name ?? entry.accountId ?? "-"}</td>
                <td>{entry.direction ?? "-"}</td>
                <td>{entry.amount ?? "-"}</td>
                <td>{entry.note ?? "-"}</td>
                <td>
                  {entry.refType || entry.refId
                    ? `${entry.refType ?? ""}${
                        entry.refType && entry.refId ? ":" : ""
                      }${entry.refId ?? ""}`
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
