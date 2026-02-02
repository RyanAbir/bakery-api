"use client";

import { useCallback, useEffect, useState } from "react";
import { apiGet } from "@/lib/api";

type OnHandRow = {
  itemId?: string;
  name?: string;
  onHand?: number;
  unit?: string;
  reorderLevel?: number;
};

type ResponseShape = OnHandRow[] | { items?: OnHandRow[]; data?: OnHandRow[] } | null;

export default function StockOnHandPage() {
  const [rows, setRows] = useState<OnHandRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await apiGet<ResponseShape>("/stock/on-hand", {
        cache: "no-store",
      });
      const list = Array.isArray(data)
        ? data
        : data?.items ?? data?.data ?? [];
      setRows(Array.isArray(list) ? list : []);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Failed to load on-hand stock";
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
        <h1>Stock On Hand</h1>
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
              <th>Unit</th>
              <th>Reorder Level</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={row.itemId ?? index}>
                <td>{row.name ?? row.itemId ?? "-"}</td>
                <td>{row.onHand ?? 0}</td>
                <td>{row.unit ?? "-"}</td>
                <td>{row.reorderLevel ?? "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : null}
    </div>
  );
}