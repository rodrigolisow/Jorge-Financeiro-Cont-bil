"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { ArrowLeft, Save, CheckCircle, Ban, AlertCircle } from "lucide-react";
import Link from "next/link";

type Option = {
  id: string;
  name: string;
};

type TransactionPayload = {
  type: string;
  status?: string;
  amount: string;
  competenceDate: string;
  settlementDate: string;
  description: string;
  accountId: string;
  categoryId: string;
  supplierId: string;
  propertyId: string;
};

type TransactionFormProps = {
  mode: "create" | "edit";
  transactionId?: string;
  canEdit: boolean;
};

const typeOptions = [
  { label: "Receita", value: "INCOME" },
  { label: "Despesa", value: "EXPENSE" },
];

const statusOptions = [
  { label: "Previsto", value: "PLANNED" },
  { label: "Realizado", value: "SETTLED" },
  { label: "Cancelado", value: "CANCELED" },
];

const toIsoDate = (value: string) =>
  value ? new Date(`${value}T00:00:00.000Z`).toISOString() : "";

export default function TransactionForm({
  mode,
  transactionId,
  canEdit,
}: TransactionFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(mode === "edit");
  const [saving, setSaving] = useState(false);
  const [settling, setSettling] = useState(false);
  const [canceling, setCanceling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Option[]>([]);
  const [properties, setProperties] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [accounts, setAccounts] = useState<Option[]>([]);
  const [form, setForm] = useState<TransactionPayload>({
    type: "EXPENSE",
    status: "PLANNED",
    amount: "",
    competenceDate: "",
    settlementDate: "",
    description: "",
    accountId: "",
    categoryId: "",
    supplierId: "",
    propertyId: "",
  });

  const loadOptions = useCallback(async () => {
    const [suppliersRes, propertiesRes, categoriesRes, accountsRes] =
      await Promise.all([
        fetch("/api/finance/suppliers", { cache: "no-store" }),
        fetch("/api/finance/properties", { cache: "no-store" }),
        fetch("/api/finance/categories", { cache: "no-store" }),
        fetch("/api/finance/accounts", { cache: "no-store" }),
      ]);

    const [suppliersPayload, propertiesPayload, categoriesPayload, accountsPayload] =
      await Promise.all([
        suppliersRes.json(),
        propertiesRes.json(),
        categoriesRes.json(),
        accountsRes.json(),
      ]);

    setSuppliers(suppliersPayload.data ?? []);
    setProperties(propertiesPayload.data ?? []);
    setCategories(categoriesPayload.data ?? []);
    setAccounts(accountsPayload.data ?? []);
  }, []);

  const loadTransaction = useCallback(async () => {
    if (!transactionId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/finance/transactions/${transactionId}`, {
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Erro ao carregar");
      }
      const data = payload.data;
      setForm({
        type: data.type,
        status: data.status,
        amount: String(data.amount),
        competenceDate: data.competenceDate.slice(0, 10),
        settlementDate: data.settlementDate ? data.settlementDate.slice(0, 10) : "",
        description: data.description ?? "",
        accountId: data.accountId,
        categoryId: data.categoryId,
        supplierId: data.supplierId,
        propertyId: data.propertyId,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [transactionId]);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    void loadTransaction();
  }, [loadTransaction]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canEdit) {
      return;
    }
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const payload = {
        type: form.type,
        amount: Number(form.amount),
        competenceDate: toIsoDate(form.competenceDate),
        settlementDate: form.settlementDate ? toIsoDate(form.settlementDate) : null,
        description: form.description ? form.description.trim() : null,
        accountId: form.accountId,
        categoryId: form.categoryId,
        supplierId: form.supplierId,
        propertyId: form.propertyId,
        status: mode === "edit" ? form.status : undefined,
      };

      const response = await fetch(
        mode === "edit"
          ? `/api/finance/transactions/${transactionId}`
          : "/api/finance/transactions",
        {
          method: mode === "edit" ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result?.error?.message ?? "Erro ao salvar");
      }

      setSuccess("Salvo com sucesso.");
      if (mode === "create") {
        router.push("/app/finance/transactions");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleSettle = async () => {
    if (!confirm("Tem certeza que deseja marcar como realizado? Isso pode gerar lançamentos contábeis.")) return;

    if (!transactionId || !canEdit) {
      return;
    }
    setSettling(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(
        `/api/finance/transactions/${transactionId}/settle`,
        {
          method: "POST",
        },
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Erro ao liquidar");
      }
      const updated = payload.data?.transaction;
      if (updated) {
        setForm((prev) => ({
          ...prev,
          status: updated.status,
          settlementDate: updated.settlementDate
            ? updated.settlementDate.slice(0, 10)
            : prev.settlementDate,
        }));
      }
      setSuccess(
        payload.data?.issue
          ? "Lançamento liquidado, pendência criada."
          : "Lançamento liquidado.",
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao liquidar");
    } finally {
      setSettling(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Tem certeza que deseja cancelar este lançamento?")) return;

    if (!transactionId || !canEdit) {
      return;
    }
    setCanceling(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(
        `/api/finance/transactions/${transactionId}/cancel`,
        {
          method: "POST",
        },
      );
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Erro ao cancelar");
      }
      const updated = payload.data;
      if (updated) {
        setForm((prev) => ({
          ...prev,
          status: updated.status,
        }));
      }
      setSuccess("Lançamento cancelado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao cancelar");
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return <div className="p-12 text-center text-muted-foreground">Carregando dados do lançamento...</div>;
  }

  const handleFormChange = (key: keyof TransactionPayload, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col gap-6 max-w-5xl mx-auto">
      {/* Feedback Banners */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md flex items-center gap-2">
          <AlertCircle size={18} /> {error}
        </div>
      )}
      {success && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-600 px-4 py-3 rounded-md flex items-center gap-2">
          <CheckCircle size={18} /> {success}
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Left Column: Main Info */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Dados do Lançamento</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Tipo de Operação"
                    value={form.type}
                    onChange={e => handleFormChange('type', e.target.value)}
                    options={typeOptions}
                    disabled={!canEdit}
                    required
                  />
                  <Input
                    label="Valor (R$)"
                    type="number"
                    step="0.01"
                    placeholder="0,00"
                    value={form.amount}
                    onChange={e => handleFormChange('amount', e.target.value)}
                    disabled={!canEdit}
                    required
                  />
                </div>
                <Input
                  label="Descrição"
                  placeholder="Ex: Pagamento de serviços de TI"
                  value={form.description}
                  onChange={e => handleFormChange('description', e.target.value)}
                  disabled={!canEdit}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Classificação e Vínculos</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Select
                    label="Categoria"
                    value={form.categoryId}
                    onChange={e => handleFormChange('categoryId', e.target.value)}
                    options={[{ label: "Selecione...", value: "" }, ...categories.map(c => ({ label: c.name, value: c.id }))]}
                    disabled={!canEdit}
                    required
                  />
                  <Select
                    label="Conta Financeira"
                    value={form.accountId}
                    onChange={e => handleFormChange('accountId', e.target.value)}
                    options={[{ label: "Selecione...", value: "" }, ...accounts.map(a => ({ label: a.name, value: a.id }))]}
                    disabled={!canEdit}
                    required
                  />
                  <Select
                    label="Fornecedor / Parceiro"
                    value={form.supplierId}
                    onChange={e => handleFormChange('supplierId', e.target.value)}
                    options={[{ label: "Selecione...", value: "" }, ...suppliers.map(s => ({ label: s.name, value: s.id }))]}
                    disabled={!canEdit}
                    required
                  />
                  <Select
                    label="Imóvel / Centro de Custo"
                    value={form.propertyId}
                    onChange={e => handleFormChange('propertyId', e.target.value)}
                    options={[{ label: "Selecione...", value: "" }, ...properties.map(p => ({ label: p.name, value: p.id }))]}
                    disabled={!canEdit}
                    required
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Dates & Status */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Prazos e datas</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Input
                  label="Data de Competência"
                  type="date"
                  value={form.competenceDate}
                  onChange={e => handleFormChange('competenceDate', e.target.value)}
                  disabled={!canEdit}
                  required
                />
                <Input
                  label="Data de Liquidação (Prevista/Real)"
                  type="date"
                  value={form.settlementDate}
                  onChange={e => handleFormChange('settlementDate', e.target.value)}
                  disabled={!canEdit}
                />
              </CardContent>
            </Card>

            {mode === "edit" && (
              <Card>
                <CardHeader>
                  <CardTitle>Status Atual</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Select
                    label="Situação"
                    value={form.status}
                    onChange={e => handleFormChange('status', e.target.value)}
                    options={statusOptions}
                    disabled={!canEdit}
                  />
                  <div className="pt-2 flex flex-col gap-2">
                    {form.status !== "SETTLED" && form.status !== "CANCELED" && (
                      <Button
                        type="button"
                        variant="success"
                        className="w-full justify-center"
                        onClick={handleSettle}
                        disabled={settling || !canEdit}
                      >
                        <CheckCircle size={16} className="mr-2" />
                        {settling ? "Processando..." : "Marcar como Realizado"}
                      </Button>
                    )}
                    {form.status !== "CANCELED" && (
                      <Button
                        type="button"
                        variant="destructive"
                        className="w-full justify-center"
                        onClick={handleCancel}
                        disabled={canceling || !canEdit}
                      >
                        <Ban size={16} className="mr-2" />
                        {canceling ? "Processando..." : "Cancelar Lançamento"}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Sticky Footer for Actions */}
        <div className="mt-8 flex items-center justify-end gap-4 pb-12">
          <Link href="/app/finance/transactions">
            <Button type="button" variant="secondary">Cancelar e Voltar</Button>
          </Link>
          {canEdit && (
            <Button type="submit" variant="primary" size="lg" isLoading={saving}>
              <Save size={18} className="mr-2" /> Salvar Alterações
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
