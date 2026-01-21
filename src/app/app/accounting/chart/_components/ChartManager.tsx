"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type ChartAccount = {
  id: string;
  code: string;
  name: string;
  type: string;
  parentId: string | null;
  parent?: { id: string; code: string; name: string } | null;
};

type ChartManagerProps = {
  canEdit: boolean;
};

const typeOptions = [
  { label: "Ativo", value: "ASSET" },
  { label: "Passivo", value: "LIABILITY" },
  { label: "Patrimônio", value: "EQUITY" },
  { label: "Receita", value: "INCOME" },
  { label: "Despesa", value: "EXPENSE" },
];

export default function ChartManager({ canEdit }: ChartManagerProps) {
  const [items, setItems] = useState<ChartAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    code: "",
    name: "",
    type: "ASSET",
    parentId: "",
  });
  const [editForm, setEditForm] = useState({
    code: "",
    name: "",
    type: "ASSET",
    parentId: "",
  });

  const loadChart = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/accounting/chart", { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Erro ao carregar");
      }
      setItems(payload.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadChart();
  }, [loadChart]);

  const availableParents = useMemo(
    () => items.filter((item) => item.id !== editingId),
    [items, editingId],
  );

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canEdit) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/accounting/chart", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: form.code.trim(),
          name: form.name.trim(),
          type: form.type,
          parentId: form.parentId || null,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Erro ao salvar");
      }
      setForm({ code: "", name: "", type: "ASSET", parentId: "" });
      setCreating(false);
      await loadChart();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingId) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/accounting/chart/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: editForm.code.trim(),
          name: editForm.name.trim(),
          type: editForm.type,
          parentId: editForm.parentId || null,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Erro ao atualizar");
      }
      setEditingId(null);
      await loadChart();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/accounting/chart/${id}`, {
        method: "DELETE",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Erro ao remover");
      }
      await loadChart();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main style={{ padding: 32 }}>
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Plano de contas</h1>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/app/accounting/journal">Diário</Link>
          {canEdit && (
            <button type="button" onClick={() => setCreating((prev) => !prev)}>
              {creating ? "Fechar" : "Nova conta"}
            </button>
          )}
        </div>
      </header>

      {!canEdit && <p style={{ marginTop: 8 }}>Acesso somente leitura.</p>}
      {error && <p style={{ marginTop: 12, color: "crimson" }}>{error}</p>}

      {creating && canEdit && (
        <form onSubmit={handleCreate} style={{ marginTop: 16 }}>
          <h2>Nova conta</h2>
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            <label>
              <div>Código</div>
              <input
                type="text"
                value={form.code}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, code: event.target.value }))
                }
              />
            </label>
            <label>
              <div>Nome</div>
              <input
                type="text"
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
              />
            </label>
            <label>
              <div>Tipo</div>
              <select
                value={form.type}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, type: event.target.value }))
                }
              >
                {typeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <div>Conta mãe</div>
              <select
                value={form.parentId}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, parentId: event.target.value }))
                }
              >
                <option value="">Nenhuma</option>
                {items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.code} - {item.name}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button type="submit" disabled={saving} style={{ marginTop: 12 }}>
            Salvar
          </button>
        </form>
      )}

      <section style={{ marginTop: 24 }}>
        {loading ? (
          <p>Carregando...</p>
        ) : items.length === 0 ? (
          <p>Nenhuma conta cadastrada.</p>
        ) : (
          <ul style={{ display: "grid", gap: 12, listStyle: "none" }}>
            {items.map((item) => (
              <li
                key={item.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                {editingId === item.id ? (
                  <form onSubmit={handleUpdate}>
                    <div style={{ display: "grid", gap: 12 }}>
                      <label>
                        <div>Código</div>
                        <input
                          type="text"
                          value={editForm.code}
                          onChange={(event) =>
                            setEditForm((prev) => ({
                              ...prev,
                              code: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        <div>Nome</div>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(event) =>
                            setEditForm((prev) => ({
                              ...prev,
                              name: event.target.value,
                            }))
                          }
                        />
                      </label>
                      <label>
                        <div>Tipo</div>
                        <select
                          value={editForm.type}
                          onChange={(event) =>
                            setEditForm((prev) => ({
                              ...prev,
                              type: event.target.value,
                            }))
                          }
                        >
                          {typeOptions.map((option) => (
                            <option key={option.value} value={option.value}>
                              {option.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <div>Conta mãe</div>
                        <select
                          value={editForm.parentId}
                          onChange={(event) =>
                            setEditForm((prev) => ({
                              ...prev,
                              parentId: event.target.value,
                            }))
                          }
                        >
                          <option value="">Nenhuma</option>
                          {availableParents.map((parent) => (
                            <option key={parent.id} value={parent.id}>
                              {parent.code} - {parent.name}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                      <button type="submit" disabled={saving}>
                        Atualizar
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <div>
                      <strong>
                        {item.code} - {item.name}
                      </strong>
                    </div>
                    <div>Tipo: {item.type}</div>
                    <div>
                      Conta mãe: {item.parent ? `${item.parent.code} - ${item.parent.name}` : "-"}
                    </div>
                    {canEdit && (
                      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(item.id);
                            setEditForm({
                              code: item.code,
                              name: item.name,
                              type: item.type,
                              parentId: item.parentId ?? "",
                            });
                          }}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(item.id)}
                          disabled={saving}
                        >
                          Remover
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
