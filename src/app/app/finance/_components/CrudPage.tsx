"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import { useCallback, useEffect, useState } from "react";

type Option = {
  label: string;
  value: string;
};

type Field = {
  name: string;
  label: string;
  type: "text" | "select";
  optional?: boolean;
  options?: Option[];
};

type Item = {
  id: string;
  [key: string]: string | null;
};

type CrudPageProps = {
  title: string;
  endpoint: string;
  fields: Field[];
  canEdit: boolean;
};

const emptyValue = (field: Field) => {
  if (field.type === "select") {
    return field.options?.[0]?.value ?? "";
  }
  return "";
};

const buildEmptyForm = (fields: Field[]) =>
  fields.reduce<Record<string, string>>((acc, field) => {
    acc[field.name] = emptyValue(field);
    return acc;
  }, {});

const normalizePayload = (data: Record<string, string>, fields: Field[]) =>
  fields.reduce<Record<string, string | null>>((acc, field) => {
    const raw = data[field.name] ?? "";
    const value = raw.trim();
    acc[field.name] = value === "" && field.optional ? null : value;
    return acc;
  }, {});

export default function CrudPage({
  title,
  endpoint,
  fields,
  canEdit,
}: CrudPageProps) {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState(() => buildEmptyForm(fields));
  const [editData, setEditData] = useState<Record<string, string>>({});

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(endpoint, { cache: "no-store" });
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
  }, [endpoint]);

  useEffect(() => {
    void loadItems();
  }, [loadItems]);

  const handleChange = (
    setter: Dispatch<SetStateAction<Record<string, string>>>,
    field: Field,
    value: string,
  ) => {
    setter((prev) => ({ ...prev, [field.name]: value }));
  };

  const handleCreate = async (event: FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizePayload(formData, fields)),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Erro ao salvar");
      }
      setFormData(buildEmptyForm(fields));
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
      setCreating(false);
    }
  };

  const startEdit = (item: Item) => {
    setEditingId(item.id);
    setEditData(
      fields.reduce<Record<string, string>>((acc, field) => {
        acc[field.name] = item[field.name] ?? "";
        return acc;
      }, {}),
    );
  };

  const handleUpdate = async (event: FormEvent) => {
    event.preventDefault();
    if (!editingId) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${endpoint}/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(normalizePayload(editData, fields)),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Erro ao atualizar");
      }
      setEditingId(null);
      setEditData({});
      await loadItems();
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
      const response = await fetch(`${endpoint}/${id}`, {
        method: "DELETE",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Erro ao remover");
      }
      await loadItems();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main style={{ padding: 32, display: "flex", flexDirection: "column" }}>
      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>{title}</h1>
        {canEdit && (
          <button type="button" onClick={() => setCreating((prev) => !prev)}>
            {creating ? "Fechar" : "Novo"}
          </button>
        )}
      </div>

      {!canEdit && (
        <p style={{ marginTop: 8 }}>Acesso somente leitura.</p>
      )}

      {error && (
        <p style={{ marginTop: 12, color: "crimson" }}>{error}</p>
      )}

      {creating && canEdit && (
        <form onSubmit={handleCreate} style={{ marginTop: 16 }}>
          <h2>Novo cadastro</h2>
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            {fields.map((field) => (
              <label key={field.name}>
                <div>{field.label}</div>
                {field.type === "select" ? (
                  <select
                    value={formData[field.name]}
                    onChange={(event) =>
                      handleChange(setFormData, field, event.target.value)
                    }
                  >
                    {field.options?.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={formData[field.name]}
                    onChange={(event) =>
                      handleChange(setFormData, field, event.target.value)
                    }
                  />
                )}
              </label>
            ))}
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
          <p>Nenhum cadastro encontrado.</p>
        ) : (
          <ul style={{ display: "grid", gap: 16, listStyle: "none" }}>
            {items.map((item) => (
              <li
                key={item.id}
                style={{
                  border: "1px solid #ddd",
                  padding: 16,
                  borderRadius: 8,
                }}
              >
                {editingId === item.id ? (
                  <form onSubmit={handleUpdate}>
                    <div style={{ display: "grid", gap: 12 }}>
                      {fields.map((field) => (
                        <label key={field.name}>
                          <div>{field.label}</div>
                          {field.type === "select" ? (
                            <select
                              value={editData[field.name] ?? ""}
                              onChange={(event) =>
                                handleChange(
                                  setEditData,
                                  field,
                                  event.target.value,
                                )
                              }
                            >
                              {field.options?.map((option) => (
                                <option
                                  key={option.value}
                                  value={option.value}
                                >
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={editData[field.name] ?? ""}
                              onChange={(event) =>
                                handleChange(
                                  setEditData,
                                  field,
                                  event.target.value,
                                )
                              }
                            />
                          )}
                        </label>
                      ))}
                    </div>
                    <div
                      style={{
                        marginTop: 12,
                        display: "flex",
                        gap: 8,
                      }}
                    >
                      <button type="submit" disabled={saving}>
                        Atualizar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingId(null);
                          setEditData({});
                        }}
                      >
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <div style={{ display: "grid", gap: 6 }}>
                      {fields.map((field) => (
                        <div key={field.name}>
                          <strong>{field.label}:</strong>{" "}
                          {item[field.name] ?? "-"}
                        </div>
                      ))}
                    </div>
                    {canEdit && (
                      <div
                        style={{
                          marginTop: 12,
                          display: "flex",
                          gap: 8,
                        }}
                      >
                        <button type="button" onClick={() => startEdit(item)}>
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
