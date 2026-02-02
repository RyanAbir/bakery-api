"use client";

import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";

type Item = {
  id: string | number;
  name?: string;
};

type StockRow = Record<string, any>;

type StockLine = {
  itemId: string;
  qty: number;
  rate: number;
};

type StockForm = {
  date: string;
  reason: string;
  note: string;
  refType: string;
  refId: string;
  lines: StockLine[];
};

const emptyLine = (): StockLine => ({ itemId: "", qty: 0, rate: 0 });

const emptyForm = (): StockForm => ({
  date: "",
  reason: "",
  note: "",
  refType: "",
  refId: "",
  lines: [emptyLine()],
});

function getItemName(row: StockRow) {
  return (
    row?.item?.name ||
    row?.itemName ||
    row?.name ||
    row?.item?.label ||
    "-"
  );
}

function getUnitName(row: StockRow) {
  return row?.unit?.name || row?.unitName || row?.unit || "-";
}

function getQty(row: StockRow) {
  return (
    row?.qty ??
    row?.quantity ??
    row?.onHand ??
    row?.onHandQty ??
    row?.stock ??
    "-"
  );
}

function getReorder(row: StockRow) {
  return row?.reorderLevel ?? row?.minLevel ?? row?.reorder ?? "-";
}

export default function StockPage() {
  const [onHand, setOnHand] = useState<StockRow[]>([]);
  const [lowStock, setLowStock] = useState<StockRow[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [loadingOnHand, setLoadingOnHand] = useState(true);
  const [loadingLowStock, setLoadingLowStock] = useState(true);
  const [loadingItems, setLoadingItems] = useState(true);
  const [errorOnHand, setErrorOnHand] = useState<string | null>(null);
  const [errorLowStock, setErrorLowStock] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [stockIn, setStockIn] = useState<StockForm>(emptyForm());
  const [stockOut, setStockOut] = useState<StockForm>(emptyForm());

  const itemOptions = useMemo(() => items, [items]);

  async function loadItems() {
    setLoadingItems(true);
    try {
      const data = await apiGet("/items", { cache: "no-store" });

      const list = Array.isArray(data)
        ? data
        : data?.items ?? data?.data ?? [];

      setItems(Array.isArray(list) ? list : []);
    } catch {
      setItems([]);
    } finally {
      setLoadingItems(false);
    }
  }

  async function loadOnHand() {
    setLoadingOnHand(true);
    setErrorOnHand(null);

    try {
      const data = await apiGet("/stock/on-hand", { cache: "no-store" });

      const list = Array.isArray(data)
        ? data
        : data?.items ?? data?.data ?? [];

      setOnHand(Array.isArray(list) ? list : []);
    } catch (err) {
      setErrorOnHand(
        err instanceof Error ? err.message : "Failed to load on-hand stock"
      );
      setOnHand([]);
    } finally {
      setLoadingOnHand(false);
    }
  }

  async function loadLowStock() {
    setLoadingLowStock(true);
    setErrorLowStock(null);

    try {
      const data = await apiGet("/stock/low-stock", {
        cache: "no-store",
      });

      const list = Array.isArray(data)
        ? data
        : data?.items ?? data?.data ?? [];

      setLowStock(Array.isArray(list) ? list : []);
    } catch (err) {
      setErrorLowStock(
        err instanceof Error ? err.message : "Failed to load low stock"
      );
      setLowStock([]);
    } finally {
      setLoadingLowStock(false);
    }
  }

  useEffect(() => {
    loadItems();
    loadOnHand();
    loadLowStock();
  }, []);

  function updateStockForm(
    setter: React.Dispatch<React.SetStateAction<StockForm>>,
    key: keyof StockForm,
    value: StockForm[keyof StockForm]
  ) {
    setter((prev) => ({ ...prev, [key]: value }));
  }

  function updateLine(
    setter: React.Dispatch<React.SetStateAction<StockForm>>,
    index: number,
    key: keyof StockLine,
    value: StockLine[keyof StockLine]
  ) {
    setter((prev) => {
      const lines = [...prev.lines];
      lines[index] = { ...lines[index], [key]: value };
      return { ...prev, lines };
    });
  }

  function addLine(setter: React.Dispatch<React.SetStateAction<StockForm>>) {
    setter((prev) => ({ ...prev, lines: [...prev.lines, emptyLine()] }));
  }

  function removeLine(
    setter: React.Dispatch<React.SetStateAction<StockForm>>,
    index: number
  ) {
    setter((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, idx) => idx !== index),
    }));
  }

  async function submitStock(
    path: "/stock/in" | "/stock/out",
    form: StockForm,
    reset: () => void
  ) {
    setSaving(true);
    setActionError(null);

    try {
      await apiPost(path, {
        date: form.date || undefined,
        reason: form.reason || undefined,
        note: form.note || undefined,
        refType: form.refType || undefined,
        refId: form.refId || undefined,
        lines: form.lines.map((line) => ({
          itemId: line.itemId,
          qty: Number(line.qty),
          rate: Number(line.rate),
        })),
      });

      reset();
      await loadOnHand();
      await loadLowStock();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : "Stock update failed"
      );
    } finally {
      setSaving(false);
    }
  }

  const onHandRows = useMemo(() => onHand, [onHand]);
  const lowStockRows = useMemo(() => lowStock, [lowStock]);

  return (
    <section className="space-y-10">
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Stock</h1>
        <p className="text-sm text-zinc-600">
          Monitor inventory and record stock movements.
        </p>
      </header>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700">
            On hand
          </div>
          {errorOnHand ? (
            <p className="px-4 py-4 text-sm text-red-600">{errorOnHand}</p>
          ) : null}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3">On hand</th>
                </tr>
              </thead>
              <tbody>
                {loadingOnHand ? (
                  <tr>
                    <td className="px-4 py-6 text-zinc-500" colSpan={3}>
                      Loading on-hand stock...
                    </td>
                  </tr>
                ) : onHandRows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-zinc-500" colSpan={3}>
                      No on-hand records.
                    </td>
                  </tr>
                ) : (
                  onHandRows.map((row, index) => (
                    <tr key={row.id ?? index} className="border-t border-zinc-100">
                      <td className="px-4 py-3 font-medium text-zinc-900">
                        {getItemName(row)}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {getUnitName(row)}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {getQty(row)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white">
          <div className="border-b border-zinc-200 px-4 py-3 text-sm font-medium text-zinc-700">
            Low stock
          </div>
          {errorLowStock ? (
            <p className="px-4 py-4 text-sm text-red-600">{errorLowStock}</p>
          ) : null}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-zinc-50 text-xs uppercase text-zinc-500">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Unit</th>
                  <th className="px-4 py-3">On hand</th>
                  <th className="px-4 py-3">Reorder</th>
                </tr>
              </thead>
              <tbody>
                {loadingLowStock ? (
                  <tr>
                    <td className="px-4 py-6 text-zinc-500" colSpan={4}>
                      Loading low stock...
                    </td>
                  </tr>
                ) : lowStockRows.length === 0 ? (
                  <tr>
                    <td className="px-4 py-6 text-zinc-500" colSpan={4}>
                      No low-stock items.
                    </td>
                  </tr>
                ) : (
                  lowStockRows.map((row, index) => (
                    <tr key={row.id ?? index} className="border-t border-zinc-100">
                      <td className="px-4 py-3 font-medium text-zinc-900">
                        {getItemName(row)}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {getUnitName(row)}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {getQty(row)}
                      </td>
                      <td className="px-4 py-3 text-zinc-600">
                        {getReorder(row)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={(event) => {
            event.preventDefault();
            submitStock("/stock/in", stockIn, () => setStockIn(emptyForm()));
          }}
          className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4"
        >
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-zinc-900">Stock In</h2>
            <p className="text-sm text-zinc-600">Record new inventory.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-zinc-700">
              Date
              <input
                type="date"
                value={stockIn.date}
                onChange={(event) =>
                  updateStockForm(setStockIn, "date", event.target.value)
                }
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm font-medium text-zinc-700">
              Reason
              <input
                value={stockIn.reason}
                onChange={(event) =>
                  updateStockForm(setStockIn, "reason", event.target.value)
                }
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                placeholder="Purchase"
              />
            </label>
            <label className="text-sm font-medium text-zinc-700">
              Reference Type
              <input
                value={stockIn.refType}
                onChange={(event) =>
                  updateStockForm(setStockIn, "refType", event.target.value)
                }
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                placeholder="Invoice"
              />
            </label>
            <label className="text-sm font-medium text-zinc-700">
              Reference ID
              <input
                value={stockIn.refId}
                onChange={(event) =>
                  updateStockForm(setStockIn, "refId", event.target.value)
                }
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                placeholder="INV-1024"
              />
            </label>
            <label className="md:col-span-2 text-sm font-medium text-zinc-700">
              Note
              <input
                value={stockIn.note}
                onChange={(event) =>
                  updateStockForm(setStockIn, "note", event.target.value)
                }
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                placeholder="Optional notes"
              />
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm font-medium text-zinc-700">
              <span>Lines</span>
              <button
                type="button"
                onClick={() => addLine(setStockIn)}
                className="text-xs font-semibold text-zinc-600 hover:text-zinc-900"
              >
                + Add line
              </button>
            </div>
            {stockIn.lines.map((line, index) => (
              <div
                key={`stock-in-${index}`}
                className="grid gap-3 rounded-lg border border-zinc-200 p-3 md:grid-cols-4"
              >
                <label className="text-xs font-medium text-zinc-600 md:col-span-2">
                  Item
                  <select
                    value={line.itemId}
                    onChange={(event) =>
                      updateLine(
                        setStockIn,
                        index,
                        "itemId",
                        event.target.value
                      )
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-2 text-sm"
                    required
                    disabled={loadingItems}
                  >
                    <option value="">Select item</option>
                    {itemOptions.map((item) => (
                      <option key={item.id} value={String(item.id)}>
                        {item.name ?? `Item ${item.id}`}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-medium text-zinc-600">
                  Qty
                  <input
                    type="number"
                    min="0"
                    value={line.qty}
                    onChange={(event) =>
                      updateLine(
                        setStockIn,
                        index,
                        "qty",
                        Number(event.target.value)
                      )
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-2 text-sm"
                    required
                  />
                </label>
                <label className="text-xs font-medium text-zinc-600">
                  Rate
                  <input
                    type="number"
                    min="0"
                    value={line.rate}
                    onChange={(event) =>
                      updateLine(
                        setStockIn,
                        index,
                        "rate",
                        Number(event.target.value)
                      )
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-2 text-sm"
                  />
                </label>
                {stockIn.lines.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeLine(setStockIn, index)}
                    className="text-xs font-semibold text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            ))}
          </div>

          {actionError ? (
            <p className="text-sm text-red-600">{actionError}</p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? "Saving..." : "Record Stock In"}
          </button>
        </form>

        <form
          onSubmit={(event) => {
            event.preventDefault();
            submitStock("/stock/out", stockOut, () =>
              setStockOut(emptyForm())
            );
          }}
          className="space-y-4 rounded-xl border border-zinc-200 bg-white p-4"
        >
          <div className="space-y-1">
            <h2 className="text-base font-semibold text-zinc-900">Stock Out</h2>
            <p className="text-sm text-zinc-600">Record stock usage.</p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <label className="text-sm font-medium text-zinc-700">
              Date
              <input
                type="date"
                value={stockOut.date}
                onChange={(event) =>
                  updateStockForm(setStockOut, "date", event.target.value)
                }
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              />
            </label>
            <label className="text-sm font-medium text-zinc-700">
              Reason
              <input
                value={stockOut.reason}
                onChange={(event) =>
                  updateStockForm(setStockOut, "reason", event.target.value)
                }
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                placeholder="Production"
              />
            </label>
            <label className="text-sm font-medium text-zinc-700">
              Reference Type
              <input
                value={stockOut.refType}
                onChange={(event) =>
                  updateStockForm(setStockOut, "refType", event.target.value)
                }
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                placeholder="Batch"
              />
            </label>
            <label className="text-sm font-medium text-zinc-700">
              Reference ID
              <input
                value={stockOut.refId}
                onChange={(event) =>
                  updateStockForm(setStockOut, "refId", event.target.value)
                }
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                placeholder="BATCH-52"
              />
            </label>
            <label className="md:col-span-2 text-sm font-medium text-zinc-700">
              Note
              <input
                value={stockOut.note}
                onChange={(event) =>
                  updateStockForm(setStockOut, "note", event.target.value)
                }
                className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                placeholder="Optional notes"
              />
            </label>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm font-medium text-zinc-700">
              <span>Lines</span>
              <button
                type="button"
                onClick={() => addLine(setStockOut)}
                className="text-xs font-semibold text-zinc-600 hover:text-zinc-900"
              >
                + Add line
              </button>
            </div>
            {stockOut.lines.map((line, index) => (
              <div
                key={`stock-out-${index}`}
                className="grid gap-3 rounded-lg border border-zinc-200 p-3 md:grid-cols-4"
              >
                <label className="text-xs font-medium text-zinc-600 md:col-span-2">
                  Item
                  <select
                    value={line.itemId}
                    onChange={(event) =>
                      updateLine(
                        setStockOut,
                        index,
                        "itemId",
                        event.target.value
                      )
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-2 text-sm"
                    required
                    disabled={loadingItems}
                  >
                    <option value="">Select item</option>
                    {itemOptions.map((item) => (
                      <option key={item.id} value={String(item.id)}>
                        {item.name ?? `Item ${item.id}`}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-medium text-zinc-600">
                  Qty
                  <input
                    type="number"
                    min="0"
                    value={line.qty}
                    onChange={(event) =>
                      updateLine(
                        setStockOut,
                        index,
                        "qty",
                        Number(event.target.value)
                      )
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-2 text-sm"
                    required
                  />
                </label>
                <label className="text-xs font-medium text-zinc-600">
                  Rate
                  <input
                    type="number"
                    min="0"
                    value={line.rate}
                    onChange={(event) =>
                      updateLine(
                        setStockOut,
                        index,
                        "rate",
                        Number(event.target.value)
                      )
                    }
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-2 py-2 text-sm"
                    required
                  />
                </label>
                {stockOut.lines.length > 1 ? (
                  <button
                    type="button"
                    onClick={() => removeLine(setStockOut, index)}
                    className="text-xs font-semibold text-red-600 hover:text-red-700"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            ))}
          </div>

          {actionError ? (
            <p className="text-sm text-red-600">{actionError}</p>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {saving ? "Saving..." : "Record Stock Out"}
          </button>
        </form>
      </div>
    </section>
  );
}
