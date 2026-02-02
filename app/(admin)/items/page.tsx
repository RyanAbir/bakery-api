"use client";

import { useEffect, useState } from "react";

type Item = {
  id?: string;
  name?: string | null;
  sku?: string | null;
  unit?: { name?: string | null } | string | null;
  createdAt?: string | null;
  created?: string | null;
  created_at?: string | null;
};

type ItemsResponse = Item[] | { items?: Item[]; data?: Item[] } | null;

function getUnitLabel(unit: Item["unit"]) {
  if (!unit) return "-";
  if (typeof unit === "string") return unit || "-";
  return unit.name ?? "-";
}

function getCreatedLabel(item: Item) {
  const value = item.createdAt ?? item.created ?? item.created_at;
  return value ? String(value) : "-";
}

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadItems() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/items", { cache: "no-store" });
        const data = (await response.json().catch(() => null)) as ItemsResponse;

        if (!response.ok) {
          const message =
            (data && typeof data === "object" && "error" in data
              ? String((data as { error?: string }).error)
              : undefined) ||
            (data && typeof data === "object" && "message" in data
              ? String((data as { message?: string }).message)
              : undefined) ||
            response.statusText ||
            "Failed to load items";
          throw new Error(message);
        }

        const list = Array.isArray(data)
          ? data
          : data?.items ?? data?.data ?? [];
        if (!cancelled) {
          setItems(Array.isArray(list) ? list : []);
        }
      } catch (err) {
        if (!cancelled) {
          const message =
            err instanceof Error ? err.message : "Failed to load items";
          setError(message);
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadItems();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold text-zinc-900">Items</h1>
        <p className="text-sm text-zinc-600">
          Inventory items currently available.
        </p>
      </div>

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
