"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ArrowLeft, Save, CheckCircle, Ban, AlertCircle } from "lucide-react";
import Link from "next/link";
import styles from "./TransactionForm.module.css";

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
    if (!confirm("Tem certeza que deseja marcar como realizado?")) return;
    if (!transactionId || !canEdit) return;
    setSettling(true);
    setError(null);
    try {
      const response = await fetch(`/api/finance/transactions/${transactionId}/settle`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message ?? "Erro");
      const updated = payload.data?.transaction;
      if (updated) {
        setForm((prev) => ({ ...prev, status: updated.status, settlementDate: updated.settlementDate?.slice(0, 10) || prev.settlementDate }));
      }
      setSuccess("Lançamento liquidado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setSettling(false);
    }
  };

  const handleCancel = async () => {
    if (!confirm("Tem certeza que deseja cancelar?")) return;
    if (!transactionId || !canEdit) return;
    setCanceling(true);
    setError(null);
    try {
      const response = await fetch(`/api/finance/transactions/${transactionId}/cancel`, { method: "POST" });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error?.message ?? "Erro");
      setForm((prev) => ({ ...prev, status: payload.data?.status || "CANCELED" }));
      setSuccess("Lançamento cancelado.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return <div className={styles.loading}>Carregando...</div>;
  }

  const handleFormChange = (key: keyof TransactionPayload, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className={styles.formContainer}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/app/finance/transactions" className={styles.backLink}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className={styles.title}>{mode === "create" ? "Novo Lançamento" : "Editar Lançamento"}</h1>
            <p className={styles.subtitle}>Preencha os dados abaixo</p>
          </div>
        </div>
        {canEdit && (
          <Button type="submit" form="transaction-form" variant="primary" isLoading={saving}>
            <Save size={18} /> Salvar
          </Button>
        )}
      </div>

      {/* Alerts */}
      {error && (
        <div className={styles.alertError}>
          <AlertCircle size={18} /> {error}
        </div>
      )}
      {success && (
        <div className={styles.alertSuccess}>
          <CheckCircle size={18} /> {success}
        </div>
      )}

      {/* Form */}
      <form id="transaction-form" onSubmit={handleSubmit} className={styles.form}>
        <div className={styles.grid}>
          {/* Row 1: Type, Amount, Dates */}
          <Select
            label="Tipo"
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
          <Input
            label="Data Competência"
            type="date"
            value={form.competenceDate}
            onChange={e => handleFormChange('competenceDate', e.target.value)}
            disabled={!canEdit}
            required
          />
          <Input
            label="Data Liquidação"
            type="date"
            value={form.settlementDate}
            onChange={e => handleFormChange('settlementDate', e.target.value)}
            disabled={!canEdit}
          />

          {/* Row 2: Classification */}
          <Select
            label="Categoria"
            value={form.categoryId}
            onChange={e => handleFormChange('categoryId', e.target.value)}
            options={[{ label: "Selecione...", value: "" }, ...categories.map(c => ({ label: c.name, value: c.id }))]}
            disabled={!canEdit}
            required
          />
          <Select
            label="Conta"
            value={form.accountId}
            onChange={e => handleFormChange('accountId', e.target.value)}
            options={[{ label: "Selecione...", value: "" }, ...accounts.map(a => ({ label: a.name, value: a.id }))]}
            disabled={!canEdit}
            required
          />
          <Select
            label="Fornecedor"
            value={form.supplierId}
            onChange={e => handleFormChange('supplierId', e.target.value)}
            options={[{ label: "Selecione...", value: "" }, ...suppliers.map(s => ({ label: s.name, value: s.id }))]}
            disabled={!canEdit}
            required
          />
          <Select
            label="Imóvel"
            value={form.propertyId}
            onChange={e => handleFormChange('propertyId', e.target.value)}
            options={[{ label: "Selecione...", value: "" }, ...properties.map(p => ({ label: p.name, value: p.id }))]}
            disabled={!canEdit}
            required
          />

          {/* Row 3: Description (full width) */}
          <div className={styles.fullWidth}>
            <Input
              label="Descrição"
              placeholder="Ex: Pagamento de serviços"
              value={form.description}
              onChange={e => handleFormChange('description', e.target.value)}
              disabled={!canEdit}
            />
          </div>

          {/* Edit mode: Status actions */}
          {mode === "edit" && (
            <div className={styles.fullWidth}>
              <div className={styles.statusRow}>
                <Select
                  label="Status"
                  value={form.status}
                  onChange={e => handleFormChange('status', e.target.value)}
                  options={statusOptions}
                  disabled={!canEdit}
                />
                {form.status !== "SETTLED" && form.status !== "CANCELED" && canEdit && (
                  <Button type="button" variant="success" onClick={handleSettle} disabled={settling}>
                    <CheckCircle size={16} /> Liquidar
                  </Button>
                )}
                {form.status !== "CANCELED" && canEdit && (
                  <Button type="button" variant="destructive" onClick={handleCancel} disabled={canceling}>
                    <Ban size={16} /> Cancelar
                  </Button>
                )}
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
