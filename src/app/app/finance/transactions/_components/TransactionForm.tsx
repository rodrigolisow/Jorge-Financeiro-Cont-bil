"use client";

import { useCallback, useEffect, useState } from "react";

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
        setForm((prev) => ({
          ...prev,
          amount: "",
          competenceDate: "",
          settlementDate: "",
          description: "",
          accountId: "",
          categoryId: "",
          supplierId: "",
          propertyId: "",
        }));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleSettle = async () => {
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
    return <p>Carregando...</p>;
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
      {!canEdit && <p>Acesso somente leitura.</p>}
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      {success && <p style={{ color: "green" }}>{success}</p>}
      <div style={{ display: "grid", gap: 12 }}>
        <label>
          <div>Tipo</div>
          <select
            value={form.type}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, type: event.target.value }))
            }
            disabled={!canEdit}
          >
            {typeOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {mode === "edit" && (
          <label>
            <div>Status</div>
            <select
              value={form.status}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, status: event.target.value }))
              }
              disabled={!canEdit}
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          <div>Valor</div>
          <input
            type="number"
            step="0.01"
            value={form.amount}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, amount: event.target.value }))
            }
            disabled={!canEdit}
          />
        </label>
        <label>
          <div>Competência</div>
          <input
            type="date"
            value={form.competenceDate}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                competenceDate: event.target.value,
              }))
            }
            disabled={!canEdit}
          />
        </label>
        <label>
          <div>Liquidação</div>
          <input
            type="date"
            value={form.settlementDate}
            onChange={(event) =>
              setForm((prev) => ({
                ...prev,
                settlementDate: event.target.value,
              }))
            }
            disabled={!canEdit}
          />
        </label>
        <label>
          <div>Fornecedor</div>
          <select
            value={form.supplierId}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, supplierId: event.target.value }))
            }
            disabled={!canEdit}
          >
            <option value="">Selecione</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <div>Imóvel</div>
          <select
            value={form.propertyId}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, propertyId: event.target.value }))
            }
            disabled={!canEdit}
          >
            <option value="">Selecione</option>
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <div>Categoria</div>
          <select
            value={form.categoryId}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, categoryId: event.target.value }))
            }
            disabled={!canEdit}
          >
            <option value="">Selecione</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <div>Conta financeira</div>
          <select
            value={form.accountId}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, accountId: event.target.value }))
            }
            disabled={!canEdit}
          >
            <option value="">Selecione</option>
            {accounts.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </select>
        </label>
        <label>
          <div>Descrição</div>
          <input
            type="text"
            value={form.description}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, description: event.target.value }))
            }
            disabled={!canEdit}
          />
        </label>
      </div>
      {canEdit && (
        <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
          <button type="submit" disabled={saving}>
            {saving ? "Salvando..." : "Salvar"}
          </button>
          {mode === "edit" && form.status !== "SETTLED" && form.status !== "CANCELED" && (
            <button type="button" onClick={handleSettle} disabled={settling}>
              {settling ? "Liquidando..." : "Marcar como realizado"}
            </button>
          )}
          {mode === "edit" && form.status !== "CANCELED" && (
            <button type="button" onClick={handleCancel} disabled={canceling}>
              {canceling ? "Cancelando..." : "Cancelar"}
            </button>
          )}
        </div>
      )}
    </form>
  );
}
