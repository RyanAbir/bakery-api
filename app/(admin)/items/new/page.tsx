"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { apiGet, apiPost } from "@/lib/api";

type Category = {
  id: string;
  name?: string;
};

type Unit = {
  id: string;
  name?: string;
};

type ListResponse<T> = T[] | { items?: T[]; data?: T[] } | null;

type FormState = {
  name: string;
  sku: string;
  categoryId: string;
  unitId: string;
  reorderLevel: string;
  trackExpiry: boolean;
};

const emptyForm: FormState = {
  name: "",
  sku: "",
  categoryId: "",
  unitId: "",
  reorderLevel: "0",
  trackExpiry: false,
};

function normalizeList<T>(data: ListResponse<T>) {
  const list = Array.isArray(data) ? data : data?.items ?? data?.data ?? [];
  return Array.isArray(list) ? list : [];
}

async function fetchWithFallback<T>(primary: string, fallback: string) {
  try {
    const data = await apiGet<ListResponse<T>>(primary, { cache: "no-store" });
    return normalizeList(data);
  } catch {
    const data = await apiGet<ListResponse<T>>(fallback, { cache: "no-store" });
    return normalizeList(data);
  }
}

export default function NewItemPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);

  useEffect(() => {
    let cancelled = false;

    async function loadOptions() {
      setLoadingOptions(true);
      setError(null);

      try {
        const [categoryList, unitList] = await Promise.all([
          fetchWithFallback<Category>("/items/categories", "/categories"),
          fetchWithFallback<Unit>("/items/units", "/units"),
        ]);

        if (!cancelled) {
          setCategories(categoryList);
          setUnits(unitList);
        }
      } catch (err) {
        const message =
          err instanceof Error ? err.message : "Failed to load options";
        if (!cancelled) {
          setError(message);
          setCategories([]);
          setUnits([]);
        }
      } finally {
        if (!cancelled) {
          setLoadingOptions(false);
        }
      }
    }

    loadOptions();

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
      await apiPost("/items", {
        name: form.name,
        sku: form.sku || undefined,
        categoryId: form.categoryId,
        unitId: form.unitId,
        reorderLevel: Number(form.reorderLevel),
        trackExpiry: form.trackExpiry,
      });

      setForm(emptyForm);
      router.replace("/items");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create item";
      setError(message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div>
      <h1>New Item</h1>

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
            SKU
            <input
              value={form.sku}
              onChange={(event) => update("sku", event.target.value)}
            />
          </label>
        </div>

        <div>
          <label>
            Category
            <select
              value={form.categoryId}
              onChange={(event) => update("categoryId", event.target.value)}
              required
              disabled={loadingOptions}
            >
              <option value="">Select category</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name ?? category.id}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <label>
            Unit
            <select
              value={form.unitId}
              onChange={(event) => update("unitId", event.target.value)}
              required
              disabled={loadingOptions}
            >
              <option value="">Select unit</option>
              {units.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name ?? unit.id}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div>
          <label>
            Reorder Level
            <input
              type="number"
              min="0"
              value={form.reorderLevel}
              onChange={(event) => update("reorderLevel", event.target.value)}
            />
          </label>
        </div>

        <div>
          <label>
            <input
              type="checkbox"
              checked={form.trackExpiry}
              onChange={(event) => update("trackExpiry", event.target.checked)}
            />
            Track Expiry
          </label>
        </div>

        {loadingOptions ? <p>Loading options...</p> : null}
        {error ? <p>{error}</p> : null}

        <button type="submit" disabled={saving || loadingOptions}>
          {saving ? "Saving..." : "Create"}
        </button>
      </form>
    </div>
  );
}