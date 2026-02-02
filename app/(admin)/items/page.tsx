"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

type Item = {
  id: string;
  name: string;
  category?: { name?: string } | null;
  unit?: { name?: string } | null;
  reorderLevel?: number | null;
  trackExpiry?: boolean | null;
  isActive?: boolean | null;
};

type ItemsResponse = Item[] | { items?: Item[]; data?: Item[] } | null;

export default function ItemsPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiGet<ItemsResponse>("/items", { cache: "no-store" });
      const list = Array.isArray(data)
        ? data
        : data?.items ?? data?.data ?? [];
      setItems(Array.isArray(list) ? list : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load items";
      setError(message);
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  return (
    <div>
      <div>
        <h1>Items</h1>
        <div>
          <Link href="/items/new">New Item</Link>
          <button type="button" onClick={loadItems} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {loading ? <p>Loading...</p> : null}
      {error ? <p>{error}</p> : null}

      {!loading && !error && items.length === 0 ? <p>No items.</p> : null}

      {!loading && !error && items.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Category</th>
              <th>Unit</th>
              <th>Reorder Level</th>
              <th>Track Expiry</th>
              <th>Active</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item) => (
              <tr key={item.id}>
                <td>{item.name}</td>
                <td>{item.category?.name ?? "-"}</td>
                <td>{item.unit?.name ?? "-"}</td>
                <td>{item.reorderLevel ?? 0}</td>
                <td>{item.trackExpiry ? "Yes" : "No"}</td>
                <td>{item.isActive === false ? "No" : "Yes"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}