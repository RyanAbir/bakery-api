"use client";

import { useCallback, useEffect, useState } from "react";

const DEFAULT_CATEGORY_ID = "..cml2w0lg000063cn8u3tt5u0y";
const DEFAULT_UNIT_ID = "cml2w0lfj00003cn8dwb515qb";

type Item = {
  id?: string;
  name?: string | null;
  sku?: string | null;
  unit?: { name?: string | null } | string | null;
  createdAt?: string | null;
  created?: string | null;
  created_at?: string | null;
};

type ListResponse<T> = T[] | { items?: T[]; data?: T[] } | null;

function getUnitLabel(unit: Item["unit"]) {
  if (!unit) return "-";
  if (typeof unit === "string") return unit || "-";
  return unit.name ?? "-";
}

function getCreatedLabel(item: Item) {
  const value = item.createdAt ?? item.created ?? item.created_at;
  return value ? String(value) : "-";
}

function normalizeList<T>(data: ListResponse<T>) {
  const list = Array.isArray(data) ? data : data?.items ?? data?.data ?? [];
  return Array.isArray(list) ? list : [];
}

async function parseResponse(response: Response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function extractMessage(data: unknown, fallback: string) {
  if (data && typeof data === "object") {
    if ("message" in data) {
      const message = (data as { message?: unknown }).message;
      if (Array.isArray(message)) {
        return message.map(String).join(", ");
      }
      if (typeof message === "string") {
        return message;
      }
    }
    if ("error" in data && typeof (data as { error?: unknown }).error === "string") {
      return (data as { error?: string }).error as string;
    }
  }
  if (typeof data === "string") {
    return data;
  }
  return fallback;
}

async function fetchList<T>(path: string, fallback: string) {
  const response = await fetch(path, { cache: "no-store" });
  const data = await parseResponse(response);

  if (!response.ok) {
    throw new Error(extractMessage(data, fallback));
  }

  return normalizeList<T>(data as ListResponse<T>);
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: "",
    sku: "",
  });

  const loadItems = useCallback(async () => {
    try {
      const list = await fetchList<Item>("/api/items", "Failed to load items");
      setItems(list);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load items";
      setError(message);
      setItems([]);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitError(null);

    const name = form.name.trim();
    const sku = form.sku.trim();

    if (!name) {
      setSubmitError("Name is required.");
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        name,
        sku,
        categoryId: DEFAULT_CATEGORY_ID,
        unitId: DEFAULT_UNIT_ID,
      };

      const response = await fetch("/api/items", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await parseResponse(response);

      if (!response.ok) {
        throw new Error(extractMessage(data, "Failed to create item"));
      }

      setForm({ name: "", sku: "" });
      await loadItems();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to create item";
      setSubmitError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-zinc-900">Items</h1>
        <p className="text-sm text-zinc-600">
          Inventory items currently available.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block space-y-1 text-sm text-zinc-700">
            <span>Name *</span>
            <input
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              required
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
            />
          </label>

          <label className="block space-y-1 text-sm text-zinc-700">
            <span>SKU</span>
            <input
              value={form.sku}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, sku: event.target.value }))
              }
              className="w-full rounded-md border border-zinc-200 px-3 py-2 text-sm text-zinc-900 outline-none ring-zinc-300 focus:ring-2"
            />
          </label>
        </div>

        {submitError ? (
          <p className="text-sm text-red-600">{submitError}</p>
        ) : null}

        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {submitting ? "Creating..." : "Create Item"}
        </button>
      </form>

      {loading ? <p className="text-sm text-zinc-600">Loading...</p> : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {!loading && !error && items.length === 0 ? (
        <p className="text-sm text-zinc-600">No items found.</p>
      ) : null}

      {!loading && !error && items.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-zinc-600">
              <tr>
                <th className="px-4 py-2 font-medium">Name</th>
                <th className="px-4 py-2 font-medium">SKU</th>
                <th className="px-4 py-2 font-medium">Unit</th>
                <th className="px-4 py-2 font-medium">Created</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {items.map((item, index) => (
                <tr key={item.id ?? `${item.name ?? "item"}-${index}`}>
                  <td className="px-4 py-2 text-zinc-900">
                    {item.name ?? "-"}
                  </td>
                  <td className="px-4 py-2 text-zinc-600">
                    {item.sku ?? "-"}
                  </td>
                  <td className="px-4 py-2 text-zinc-600">
                    {getUnitLabel(item.unit)}
                  </td>
                  <td className="px-4 py-2 text-zinc-600">
                    {getCreatedLabel(item)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </section>
  );
}
