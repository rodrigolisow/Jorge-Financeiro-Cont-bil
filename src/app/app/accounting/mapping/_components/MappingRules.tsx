"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { EmptyState } from "@/components/ui/EmptyState";
import { Loader2, Plus, Edit2, Trash2, ArrowLeft, GitMerge } from "lucide-react";

type Option = {
  id: string;
  name: string;
};

type AccountOption = Option & { code: string };

type MappingRule = {
  id: string;
  financialCategory: Option;
  financialAccount: Option;
  supplier: Option | null;
  property: Option | null;
  debitAccount: AccountOption;
  creditAccount: AccountOption;
};

type MappingRulesProps = {
  canEdit: boolean;
};

export default function MappingRules({ canEdit }: MappingRulesProps) {
  const [rules, setRules] = useState<MappingRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Option[]>([]);
  const [accounts, setAccounts] = useState<Option[]>([]);
  const [suppliers, setSuppliers] = useState<Option[]>([]);
  const [properties, setProperties] = useState<Option[]>([]);
  const [chartAccounts, setChartAccounts] = useState<AccountOption[]>([]);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    financialCategoryId: "",
    financialAccountId: "",
    supplierId: "",
    propertyId: "",
    debitAccountId: "",
    creditAccountId: "",
  });

  const [editForm, setEditForm] = useState({
    financialCategoryId: "",
    financialAccountId: "",
    supplierId: "",
    propertyId: "",
    debitAccountId: "",
    creditAccountId: "",
  });

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        rulesRes,
        categoriesRes,
        accountsRes,
        suppliersRes,
        propertiesRes,
        chartRes,
      ] = await Promise.all([
        fetch("/api/accounting/mapping", { cache: "no-store" }),
        fetch("/api/finance/categories", { cache: "no-store" }),
        fetch("/api/finance/accounts", { cache: "no-store" }),
        fetch("/api/finance/suppliers", { cache: "no-store" }),
        fetch("/api/finance/properties", { cache: "no-store" }),
        fetch("/api/accounting/chart", { cache: "no-store" }),
      ]);

      const [
        rulesPayload,
        categoriesPayload,
        accountsPayload,
        suppliersPayload,
        propertiesPayload,
        chartPayload,
      ] = await Promise.all([
        rulesRes.json(),
        categoriesRes.json(),
        accountsRes.json(),
        suppliersRes.json(),
        propertiesRes.json(),
        chartRes.json(),
      ]);

      if (!rulesRes.ok) {
        throw new Error(rulesPayload?.error?.message ?? "Erro ao carregar");
      }

      setRules(rulesPayload.data ?? []);
      setCategories(categoriesPayload.data ?? []);
      setAccounts(accountsPayload.data ?? []);
      setSuppliers(suppliersPayload.data ?? []);
      setProperties(propertiesPayload.data ?? []);
      setChartAccounts(chartPayload.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canEdit) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/accounting/mapping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          supplierId: form.supplierId || null,
          propertyId: form.propertyId || null,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Erro ao salvar");
      }
      setForm({
        financialCategoryId: "",
        financialAccountId: "",
        supplierId: "",
        propertyId: "",
        debitAccountId: "",
        creditAccountId: "",
      });
      setCreating(false);
      await loadAll();
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
      const response = await fetch(`/api/accounting/mapping/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          supplierId: editForm.supplierId || null,
          propertyId: editForm.propertyId || null,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Erro ao atualizar");
      }
      setEditingId(null);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta regra?")) return;
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/accounting/mapping/${id}`, {
        method: "DELETE",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Erro ao remover");
      }
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover");
    } finally {
      setSaving(false);
    }
  };

  const selectOptions = useMemo(
    () => ({
      categories,
      accounts,
      suppliers,
      properties,
      chartAccounts,
    }),
    [categories, accounts, suppliers, properties, chartAccounts],
  );

  const formatAccount = (account: AccountOption) =>
    `${account.code} - ${account.name}`;

  const startEditing = (rule: MappingRule) => {
    setEditingId(rule.id);
    setEditForm({
      financialCategoryId: rule.financialCategory.id,
      financialAccountId: rule.financialAccount.id,
      supplierId: rule.supplier?.id ?? "",
      propertyId: rule.property?.id ?? "",
      debitAccountId: rule.debitAccount.id,
      creditAccountId: rule.creditAccount.id,
    });
    setCreating(false);
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <PageHeader
        title="Regras de Mapeamento"
        description="Automatize a contabilidade associando transações financeiras a contas contábeis."
        action={
          <div className="flex gap-3">
            <Link href="/app/accounting/issues">
              <Button variant="secondary">Ver Pendências</Button>
            </Link>
            {canEdit && (
              <Button onClick={() => {
                setCreating(!creating);
                setEditingId(null);
              }}>
                {creating ? <><ArrowLeft className="mr-2 h-4 w-4" /> Cancelar</> : <><Plus className="mr-2 h-4 w-4" /> Nova Regra</>}
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
            <CardTitle>{editingId ? "Editar Regra" : "Nova Regra"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={editingId ? handleUpdate : handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-4 border-r pr-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Origem (Financeiro)</h4>
                  <Select
                    label="Categoria Financeira"
                    value={editingId ? editForm.financialCategoryId : form.financialCategoryId}
                    onChange={(e) => editingId ? setEditForm(prev => ({ ...prev, financialCategoryId: e.target.value })) : setForm(prev => ({ ...prev, financialCategoryId: e.target.value }))}
                    options={[{ label: "Selecione", value: "" }, ...selectOptions.categories.map(c => ({ label: c.name, value: c.id }))]}
                    required
                  />
                  <Select
                    label="Conta Financeira"
                    value={editingId ? editForm.financialAccountId : form.financialAccountId}
                    onChange={(e) => editingId ? setEditForm(prev => ({ ...prev, financialAccountId: e.target.value })) : setForm(prev => ({ ...prev, financialAccountId: e.target.value }))}
                    options={[{ label: "Selecione", value: "" }, ...selectOptions.accounts.map(c => ({ label: c.name, value: c.id }))]}
                    required
                  />
                  <Select
                    label="Fornecedor (Opicional)"
                    value={editingId ? editForm.supplierId : form.supplierId}
                    onChange={(e) => editingId ? setEditForm(prev => ({ ...prev, supplierId: e.target.value })) : setForm(prev => ({ ...prev, supplierId: e.target.value }))}
                    options={[{ label: "Todos", value: "" }, ...selectOptions.suppliers.map(c => ({ label: c.name, value: c.id }))]}
                  />
                  <Select
                    label="Imóvel (Opicional)"
                    value={editingId ? editForm.propertyId : form.propertyId}
                    onChange={(e) => editingId ? setEditForm(prev => ({ ...prev, propertyId: e.target.value })) : setForm(prev => ({ ...prev, propertyId: e.target.value }))}
                    options={[{ label: "Todos", value: "" }, ...selectOptions.properties.map(c => ({ label: c.name, value: c.id }))]}
                  />
                </div>
                <div className="space-y-4 pl-4">
                  <h4 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Destino (Contábil)</h4>
                  <Select
                    label="Conta Débito"
                    value={editingId ? editForm.debitAccountId : form.debitAccountId}
                    onChange={(e) => editingId ? setEditForm(prev => ({ ...prev, debitAccountId: e.target.value })) : setForm(prev => ({ ...prev, debitAccountId: e.target.value }))}
                    options={[{ label: "Selecione", value: "" }, ...selectOptions.chartAccounts.map(c => ({ label: formatAccount(c), value: c.id }))]}
                    required
                  />
                  <Select
                    label="Conta Crédito"
                    value={editingId ? editForm.creditAccountId : form.creditAccountId}
                    onChange={(e) => editingId ? setEditForm(prev => ({ ...prev, creditAccountId: e.target.value })) : setForm(prev => ({ ...prev, creditAccountId: e.target.value }))}
                    options={[{ label: "Selecione", value: "" }, ...selectOptions.chartAccounts.map(c => ({ label: formatAccount(c), value: c.id }))]}
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-4 border-t mt-4">
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
                  {editingId ? "Salvar Alterações" : "Criar Regra"}
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
            Carregando regras...
          </div>
        ) : rules.length === 0 ? (
          <EmptyState
            title="Nenhuma regra de mapeamento"
            description="Crie regras para automatizar a geração de lançamentos contábeis a partir do financeiro."
            icon={GitMerge}
            action={canEdit ? (
              <Button onClick={() => setCreating(true)}>
                <Plus className="mr-2 h-4 w-4" /> Criar Primeira Regra
              </Button>
            ) : undefined}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Origem (Financeiro)</TableHead>
                <TableHead>Condições Adicionais</TableHead>
                <TableHead>Destino (Contábil)</TableHead>
                {canEdit && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <div className="text-sm font-medium">{rule.financialCategory.name}</div>
                    <div className="text-xs text-muted-foreground">{rule.financialAccount.name}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">Fornecedor: <span className="font-medium">{rule.supplier?.name ?? "Todos"}</span></div>
                    <div className="text-sm">Imóvel: <span className="font-medium">{rule.property?.name ?? "Todos"}</span></div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm font-mono text-emerald-600">D: {formatAccount(rule.debitAccount)}</div>
                    <div className="text-sm font-mono text-amber-600">C: {formatAccount(rule.creditAccount)}</div>
                  </TableCell>
                  {canEdit && (
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => startEditing(rule)}
                          title="Editar"
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-red-500 hover:text-red-600 hover:bg-red-50"
                          onClick={() => handleDelete(rule.id)}
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
