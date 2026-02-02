"use client";

import { useEffect, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";

type Account = {
  id: string;
  name?: string;
  type?: string;
  openingBalance?: number | null;
  balance?: number | null;
  isActive?: boolean | null;
};

type FormState = {
  name: string;
  type: string;
  openingBalance: string;
};

const emptyForm: FormState = {
  name: "",
  type: "",
  openingBalance: "",
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);

  useEffect(() => {
    let cancelled = false;

    async function loadAccounts() {
      setLoading(true);
      setError(null);

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
          setError(
            err instanceof Error ? err.message : "Failed to load accounts"
          );
          setAccounts([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
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
      const data = await apiPost("/accounts", {
        name: form.name,
        type: form.type,
        openingBalance:
          form.openingBalance !== ""
            ? Number(form.openingBalance)
            : undefined,
      });

      setForm(emptyForm);
      const list = Array.isArray(data)
        ? data
        : data?.accounts ?? data?.data ?? null;
      if (!list) {
        const refreshData = await apiGet("/accounts", { cache: "no-store" });
        const refreshList = Array.isArray(refreshData)
          ? refreshData
          : refreshData?.accounts ?? refreshData?.data ?? [];
        setAccounts(Array.isArray(refreshList) ? refreshList : []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create account");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1>Accounts</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Name
            <input
              value={form.name}
              onChange={(event) => update("name", event.target.value)}
              required
            />
          </label>
        </div>

        <div>
          <label>
            Type
            <input
              value={form.type}
              onChange={(event) => update("type", event.target.value)}
              required
            />
          </label>
        </div>

        <div>
          <label>
            Opening Balance
            <input
              type="number"
              value={form.openingBalance}
              onChange={(event) => update("openingBalance", event.target.value)}
            />
          </label>
        </div>

        {error ? <p>{error}</p> : null}

        <button type="submit" disabled={saving}>
          {saving ? "Saving..." : "Create"}
        </button>
      </form>

      {loading ? <p>Loading...</p> : null}

      {!loading && !error && accounts.length === 0 ? <p>No accounts.</p> : null}

      {!loading && accounts.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Opening Balance</th>
              <th>Balance</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {accounts.map((account) => (
              <tr key={account.id}>
                <td>{account.name ?? "-"}</td>
                <td>{account.type ?? "-"}</td>
                <td>{account.openingBalance ?? 0}</td>
                <td>{account.balance ?? "-"}</td>
                <td>{account.isActive === false ? "No" : "Yes"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}
