"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";

type Account = {
  id: string;
  name?: string;
};

type FormState = {
  date: string;
  accountId: string;
  direction: "DR" | "CR";
  amount: string;
  note: string;
  refType: string;
  refId: string;
};

const emptyForm: FormState = {
  date: "",
  accountId: "",
  direction: "DR",
  amount: "",
  note: "",
  refType: "",
  refId: "",
};

export default function NewLedgerEntryPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    let cancelled = false;

    async function loadAccounts() {
      setLoadingAccounts(true);
      try {
        const data = await apiGet("/accounts", { cache: "no-store" });
        const list = Array.isArray(data)
          ? data
          : data?.accounts ?? data?.data ?? [];
        if (!cancelled) {
          setAccounts(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        if (!cancelled) {
          if (err instanceof Error) {
            setError(err.message);
          }
          setAccounts([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingAccounts(false);
        }
      }
    }

    loadAccounts();

    return () => {
      cancelled = true;
    };
  }, []);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      await apiPost("/ledger", {
        date: form.date || undefined,
        accountId: form.accountId,
        direction: form.direction,
        amount: Number(form.amount),
        note: form.note || undefined,
        refType: form.refType || undefined,
        refId: form.refId || undefined,
      });

      setForm(emptyForm);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create entry");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1>New Ledger Entry</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Date
            <input
              type="date"
              value={form.date}
              onChange={(event) => update("date", event.target.value)}
            />
          </label>
        </div>

        <div>
          <label>
            Account
            <select
              value={form.accountId}
              onChange={(event) => update("accountId", event.target.value)}
              required
              disabled={loadingAccounts}
            >
              <option value="">Select account</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name ?? account.id}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <label>
            Direction
            <select
              value={form.direction}
              onChange={(event) =>
                update("direction", event.target.value as "DR" | "CR")
              }
            >
              <option value="DR">DR</option>
              <option value="CR">CR</option>
            </select>
          </label>
        </div>

        <div>
          <label>
            Amount
            <input
              type="number"
              min="0"
              value={form.amount}
              onChange={(event) => update("amount", event.target.value)}
              required
            />
          </label>
        </div>

        <div>
          <label>
            Note
            <input
              value={form.note}
              onChange={(event) => update("note", event.target.value)}
            />
          </label>
        </div>

        <div>
          <label>
            Ref Type
            <input
              value={form.refType}
              onChange={(event) => update("refType", event.target.value)}
            />
          </label>
        </div>

        <div>
          <label>
            Ref ID
            <input
              value={form.refId}
              onChange={(event) => update("refId", event.target.value)}
            />
          </label>
        </div>

        {error ? <p>{error}</p> : null}

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Create"}
        </button>
      </form>
    </div>
  );
}
