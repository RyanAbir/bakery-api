"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { apiGet, apiPost } from "@/lib/api";

type Item = {
  id: string;
  name?: string;
};

type Line = {
  itemId: string;
  qty: string;
  rate: string;
};

type FormState = {
  date: string;
  reason: "PURCHASE" | "ADJUSTMENT";
  note: string;
  refType: string;
  refId: string;
  lines: Line[];
};

type ItemsResponse = Item[] | { items?: Item[]; data?: Item[] } | null;

const emptyLine = (): Line => ({ itemId: "", qty: "", rate: "" });

function todayISO() {
  return new Date().toISOString().slice(0, 10);
}

export default function StockInPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [loadingItems, setLoadingItems] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [movementId, setMovementId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>({
    date: todayISO(),
    reason: "PURCHASE",
    note: "",
    refType: "",
    refId: "",
    lines: [emptyLine()],
  });

  useEffect(() => {
    let cancelled = false;

    async function loadItems() {
      setLoadingItems(true);
      try {
        const data = await apiGet<ItemsResponse>("/items", { cache: "no-store" });
        const list = Array.isArray(data)
          ? data
          : data?.items ?? data?.data ?? [];
        if (!cancelled) {
          setItems(Array.isArray(list) ? list : []);
        }
      } catch {
        if (!cancelled) {
          setItems([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingItems(false);
        }
      }
    }

    loadItems();

    return () => {
      cancelled = true;
    };
  }, []);

  const canSubmit = useMemo(() => {
    if (!form.date || !form.reason) return false;
    if (form.lines.length === 0) return false;
    return form.lines.every((line) => line.itemId && line.qty);
  }, [form]);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function updateLine(index: number, key: keyof Line, value: string) {
    setForm((prev) => {
      const next = [...prev.lines];
      next[index] = { ...next[index], [key]: value };
      return { ...prev, lines: next };
    });
  }

  function addLine() {
    setForm((prev) => ({ ...prev, lines: [...prev.lines, emptyLine()] }));
  }

  function removeLine(index: number) {
    setForm((prev) => ({
      ...prev,
      lines: prev.lines.filter((_, i) => i !== index),
    }));
  }

  async function submitStockIn(body: Record<string, unknown>) {
    return apiPost("/stock/in", body);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setMovementId(null);

    const payload = {
      date: form.date,
      reason: form.reason,
      note: form.note || undefined,
      refType: form.refType || undefined,
      refId: form.refId || undefined,
      lines: form.lines.map((line) => ({
        itemId: line.itemId,
        qty: Number(line.qty),
        rate: line.rate !== "" ? Number(line.rate) : undefined,
      })),
    };

    try {
      const data = (await submitStockIn(payload)) as { id?: string } | null;
      const id = data?.id ?? null;
      if (id) {
        setMovementId(id);
      }
      return;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to record stock in";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1>Stock In</h1>

      <form onSubmit={handleSubmit}>
        <div>
          <label>
            Date
            <input
              type="date"
              value={form.date}
              onChange={(event) => update("date", event.target.value)}
              required
            />
          </label>
        </div>

        <div>
          <label>
            Reason
            <select
              value={form.reason}
              onChange={(event) =>
                update("reason", event.target.value as "PURCHASE" | "ADJUSTMENT")
              }
            >
              <option value="PURCHASE">PURCHASE</option>
              <option value="ADJUSTMENT">ADJUSTMENT</option>
            </select>
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

        <div>
          <p>Lines</p>
          {form.lines.map((line, index) => (
            <div key={`line-${index}`}>
              <label>
                Item
                <select
                  value={line.itemId}
                  onChange={(event) =>
                    updateLine(index, "itemId", event.target.value)
                  }
                  required
                  disabled={loadingItems}
                >
                  <option value="">Select item</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name ?? item.id}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Qty
                <input
                  type="number"
                  min="0"
                  value={line.qty}
                  onChange={(event) => updateLine(index, "qty", event.target.value)}
                  required
                />
              </label>

              <label>
                Rate
                <input
                  type="number"
                  min="0"
                  value={line.rate}
                  onChange={(event) => updateLine(index, "rate", event.target.value)}
                />
              </label>

              {form.lines.length > 1 ? (
                <button type="button" onClick={() => removeLine(index)}>
                  Remove
                </button>
              ) : null}
            </div>
          ))}

          <button type="button" onClick={addLine}>
            Add line
          </button>
        </div>

        {loadingItems ? <p>Loading items...</p> : null}
        {error ? <p>{error}</p> : null}
        {movementId ? (
          <p>
            Created movement: {movementId}. <Link href="/stock/on-hand">View on-hand stock</Link>
          </p>
        ) : null}

        <button type="submit" disabled={saving || !canSubmit}>
          {saving ? "Saving..." : "Submit"}
        </button>
      </form>
    </div>
  );
}
