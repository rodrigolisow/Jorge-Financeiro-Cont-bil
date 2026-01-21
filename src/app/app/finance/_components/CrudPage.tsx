"use client";

import type { Dispatch, FormEvent, SetStateAction } from "react";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { EmptyState } from "@/components/ui/EmptyState";
import { Plus, Pencil, Trash2, X, Save, AlertCircle } from "lucide-react";
import styles from "./CrudPage.module.css";

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
  description?: string;
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
  description,
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
      setCreating(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
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
    if (!editingId) return;
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
    if (!confirm("Tem certeza que deseja remover este item?")) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`${endpoint}/${id}`, { method: "DELETE" });
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

  const cancelEdit = () => {
    setEditingId(null);
    setEditData({});
  };

  return (
    <div className={styles.container}>
      <PageHeader
        title={title}
        description={description ?? `Gerenciamento de ${title.toLowerCase()}`}
        action={
          canEdit && !creating && (
            <Button variant="primary" onClick={() => setCreating(true)}>
              <Plus size={18} /> Novo
            </Button>
          )
        }
      />

      {error && (
        <div className={styles.alert}>
          <AlertCircle size={18} /> {error}
        </div>
      )}

      {creating && canEdit && (
        <Card className={styles.createCard}>
          <CardHeader>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <CardTitle>Novo Cadastro</CardTitle>
              <Button size="sm" variant="ghost" onClick={() => setCreating(false)}>
                <X size={18} />
              </Button>
            </div>
          </CardHeader>
          <form onSubmit={handleCreate}>
            <CardContent>
              <div className={styles.formGrid}>
                {fields.map((field) => (
                  <div key={field.name}>
                    {field.type === "select" ? (
                      <Select
                        label={field.label}
                        value={formData[field.name]}
                        onChange={(e) => handleChange(setFormData, field, e.target.value)}
                        options={field.options}
                        disabled={saving}
                      />
                    ) : (
                      <Input
                        label={field.label}
                        value={formData[field.name]}
                        onChange={(e) => handleChange(setFormData, field, e.target.value)}
                        disabled={saving}
                      />
                    )}
                  </div>
                ))}
              </div>
              <div className={styles.formFooter}>
                <Button type="button" variant="secondary" onClick={() => setCreating(false)} disabled={saving}>
                  Cancelar
                </Button>
                <Button type="submit" variant="primary" isLoading={saving}>
                  <Save size={16} /> Salvar
                </Button>
              </div>
            </CardContent>
          </form>
        </Card>
      )}

      <Card>
        {loading ? (
          <div className={styles.loadingState}>Carregando...</div>
        ) : items.length === 0 ? (
          <div style={{ padding: '0.5rem' }}>
            <EmptyState
              title={`Nenhum ${title.toLowerCase().slice(0, -1)} encontrado`}
              description="Comece criando um novo registro."
              actionLabel={canEdit && !creating ? "Criar Novo" : undefined}
              onAction={() => setCreating(true)}
            />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                {fields.map((field) => (
                  <TableHead key={field.name}>{field.label}</TableHead>
                ))}
                {canEdit && <TableHead style={{ width: 100, textAlign: 'right' }}>Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id} className={styles.tableRow}>
                  {editingId === item.id ? (
                    <TableCell colSpan={fields.length + (canEdit ? 1 : 0)}>
                      <form onSubmit={handleUpdate} className={styles.editRow}>
                        <div className={styles.editFields}>
                          {fields.map((field) => (
                            <div key={field.name}>
                              {field.type === "select" ? (
                                <Select
                                  value={editData[field.name] ?? ""}
                                  onChange={(e) => handleChange(setEditData, field, e.target.value)}
                                  options={field.options}
                                  disabled={saving}
                                />
                              ) : (
                                <Input
                                  value={editData[field.name] ?? ""}
                                  onChange={(e) => handleChange(setEditData, field, e.target.value)}
                                  disabled={saving}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                        <div className={styles.editButtons}>
                          <Button type="submit" size="sm" variant="success" isLoading={saving}>
                            <Save size={16} />
                          </Button>
                          <Button type="button" size="sm" variant="ghost" onClick={cancelEdit} disabled={saving}>
                            <X size={16} />
                          </Button>
                        </div>
                      </form>
                    </TableCell>
                  ) : (
                    <>
                      {fields.map((field) => (
                        <TableCell key={field.name}>
                          {item[field.name] ?? <span style={{ color: '#94a3b8' }}>—</span>}
                        </TableCell>
                      ))}
                      {canEdit && (
                        <TableCell style={{ textAlign: 'right' }}>
                          <div className={styles.tableActions}>
                            <Button size="sm" variant="ghost" onClick={() => startEdit(item)} title="Editar">
                              <Pencil size={14} />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDelete(item.id)}
                              disabled={saving}
                              title="Remover"
                              style={{ color: '#ef4444' }}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </>
                  )}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Card>
    </div>
  );
}
