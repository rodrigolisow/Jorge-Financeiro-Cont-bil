"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Loader2, Plus, Edit2, Trash2, ArrowLeft } from "lucide-react";

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

const getTypeBadgeVariant = (type: string) => {
  switch (type) {
    case "ASSET": return "success";
    case "LIABILITY": return "warning";
    case "EQUITY": return "primary";
    case "INCOME": return "success";
    case "EXPENSE": return "destructive";
    default: return "secondary";
  }
};

const getTypeLabel = (type: string) => {
  return typeOptions.find(opt => opt.value === type)?.label || type;
};

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
    if (!canEdit) return;

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
    if (!editingId) return;

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
    if (!confirm("Tem certeza que deseja remover esta conta?")) return;

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

  const startEditing = (item: ChartAccount) => {
    setEditingId(item.id);
    setEditForm({
      code: item.code,
      name: item.name,
      type: item.type,
      parentId: item.parentId ?? "",
    });
    setCreating(false);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <PageHeader
        title="Plano de Contas"
        description="Gerencie a estrutura hierárquica das contas contábeis da sua empresa."
        action={
          <div className="flex gap-3">
            <Link href="/app/accounting/journal">
              <Button variant="secondary">Ver Diário</Button>
            </Link>
            {canEdit && (
              <Button onClick={() => {
                setCreating(!creating);
                setEditingId(null);
              }}>
                {creating ? <><ArrowLeft className="mr-2 h-4 w-4" /> Cancelar</> : <><Plus className="mr-2 h-4 w-4" /> Nova Conta</>}
              </Button>
            )}
          </div>
        }
      />

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">
          {error}
        </div>
      )}

      {(creating || editingId) && canEdit && (
        <Card className="mb-6 border-cyan-100 shadow-sm">
          <CardHeader>
            <CardTitle>{editingId ? "Editar Conta" : "Nova Conta"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Input
                  label="Código"
                  value={editingId ? editForm.code : form.code}
                  onChange={(e) => editingId
                    ? setEditForm(prev => ({ ...prev, code: e.target.value }))
                    : setForm(prev => ({ ...prev, code: e.target.value }))
                  }
                  placeholder="Ex: 1.1.01"
                  required
                />
                <Input
                  label="Nome da Conta"
                  value={editingId ? editForm.name : form.name}
                  onChange={(e) => editingId
                    ? setEditForm(prev => ({ ...prev, name: e.target.value }))
                    : setForm(prev => ({ ...prev, name: e.target.value }))
                  }
                  placeholder="Ex: Caixa Geral"
                  required
                />
                <Select
                  label="Tipo"
                  value={editingId ? editForm.type : form.type}
                  onChange={(e) => editingId
                    ? setEditForm(prev => ({ ...prev, type: e.target.value }))
                    : setForm(prev => ({ ...prev, type: e.target.value }))
                  }
                  options={typeOptions}
                />
                <Select
                  label="Conta Mãe (Opcional)"
                  value={editingId ? editForm.parentId : form.parentId}
                  onChange={(e) => editingId
                    ? setEditForm(prev => ({ ...prev, parentId: e.target.value }))
                    : setForm(prev => ({ ...prev, parentId: e.target.value }))
                  }
                  options={[
                    { label: "Nenhuma", value: "" },
                    ...(editingId ? availableParents : items).map(item => ({
                      label: `${item.code} - ${item.name}`,
                      value: item.id
                    }))
                  ]}
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    setCreating(false);
                    setEditingId(null);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" isLoading={saving}>
                  {editingId ? "Salvar Alterações" : "Criar Conta"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        {loading ? (
          <div className="flex justify-center items-center p-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            Carregando plano de contas...
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="Nenhuma conta encontrada"
            description="Comece criando a primeira conta do seu plano de contas."
            action={canEdit ? (
              <Button onClick={() => setCreating(true)}>
                <Plus className="mr-2 h-4 w-4" /> Criar Primeira Conta
              </Button>
            ) : undefined}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Código</TableHead>
                <TableHead>Nome</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Conta Mãe</TableHead>
                {canEdit && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell className="font-mono font-medium">{item.code}</TableCell>
                  <TableCell className="font-medium">{item.name}</TableCell>
                  <TableCell>
                    <Badge variant={getTypeBadgeVariant(item.type)}>
                      {getTypeLabel(item.type)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {item.parent ? `${item.parent.code} - ${item.parent.name}` : "-"}
                  </TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(item)}
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(item.id)}
                          title="Excluir"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
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
