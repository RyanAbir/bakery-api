"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

type LowStockRow = {
  itemId?: string;
  name?: string;
  onHand?: number;
  reorderLevel?: number;
};

type ResponseShape = LowStockRow[] | { items?: LowStockRow[]; data?: LowStockRow[] } | null;

export default function StockLowPage() {
  const [rows, setRows] = useState<LowStockRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiGet<ResponseShape>("/stock/low-stock", {
        cache: "no-store",
      });
      const list = Array.isArray(data)
        ? data
        : data?.items ?? data?.data ?? [];
      setRows(Array.isArray(list) ? list : []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load low stock";
      setError(message);
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <div>
      <div>
        <h1>Low Stock</h1>
        <button type="button" onClick={loadData} disabled={loading}>
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {loading ? <p>Loading...</p> : null}
      {error ? <p>{error}</p> : null}
      {!loading && !error && rows.length === 0 ? <p>No records.</p> : null}

      {!loading && !error && rows.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Item</th>
              <th>On Hand</th>
              <th>Reorder Level</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.itemId ?? index}>
                <td>{row.name ?? row.itemId ?? "-"}</td>
                <td>{row.onHand ?? 0}</td>
                <td>{row.reorderLevel ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}