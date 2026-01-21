"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Option = {
  id: string;
  name: string;
};

type Transaction = {
  id: string;
  type: string;
  status: string;
  amount: string;
  competenceDate: string;
  settlementDate: string | null;
  description: string | null;
  supplier: Option;
  property: Option;
  account: Option;
  category: Option;
};

type TransactionsListProps = {
  canEdit: boolean;
};

const statusOptions = [
  { label: "Todos", value: "" },
  { label: "Previsto", value: "PLANNED" },
  { label: "Realizado", value: "SETTLED" },
  { label: "Cancelado", value: "CANCELED" },
];

const typeLabel = (value: string) => (value === "INCOME" ? "Receita" : "Despesa");

const formatCurrency = (amount: string) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(amount));

const toStartIso = (value: string) =>
  value ? new Date(`${value}T00:00:00.000Z`).toISOString() : "";

const toEndIso = (value: string) =>
  value ? new Date(`${value}T23:59:59.999Z`).toISOString() : "";

export default function TransactionsList({ canEdit }: TransactionsListProps) {
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    supplierId: "",
    propertyId: "",
    categoryId: "",
    accountId: "",
    status: "",
  });
  const [items, setItems] = useState<Transaction[]>([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [totals, setTotals] = useState({
    total: "0",
    income: "0",
    expense: "0",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [settlingId, setSettlingId] = useState<string | null>(null);
  const [cancelingId, setCancelingId] = useState<string | null>(null);
  const [suppliers, setSuppliers] = useState<Option[]>([]);
  const [properties, setProperties] = useState<Option[]>([]);
  const [categories, setCategories] = useState<Option[]>([]);
  const [accounts, setAccounts] = useState<Option[]>([]);

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

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.startDate) {
      params.set("startDate", toStartIso(filters.startDate));
    }
    if (filters.endDate) {
      params.set("endDate", toEndIso(filters.endDate));
    }
    if (filters.supplierId) {
      params.set("supplierId", filters.supplierId);
    }
    if (filters.propertyId) {
      params.set("propertyId", filters.propertyId);
    }
    if (filters.categoryId) {
      params.set("categoryId", filters.categoryId);
    }
    if (filters.accountId) {
      params.set("accountId", filters.accountId);
    }
    if (filters.status) {
      params.set("status", filters.status);
    }
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    const value = params.toString();
    return value ? `?${value}` : "";
  }, [filters, page, pageSize]);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/finance/transactions${queryString}`, {
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Erro ao carregar");
      }
      setItems(payload.data?.items ?? []);
      setTotalCount(payload.data?.totalCount ?? 0);
      setTotals(
        payload.data?.totals ?? { total: "0", income: "0", expense: "0" },
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  const settleTransaction = useCallback(
    async (id: string) => {
      if (!canEdit) {
        return;
      }
      setSettlingId(id);
      setError(null);
      try {
        const response = await fetch(`/api/finance/transactions/${id}/settle`, {
          method: "POST",
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error?.message ?? "Erro ao liquidar");
        }
        await loadTransactions();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao liquidar");
      } finally {
        setSettlingId(null);
      }
    },
    [canEdit, loadTransactions],
  );

  const cancelTransaction = useCallback(
    async (id: string) => {
      if (!canEdit) {
        return;
      }
      setCancelingId(id);
      setError(null);
      try {
        const response = await fetch(`/api/finance/transactions/${id}/cancel`, {
          method: "POST",
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error?.message ?? "Erro ao cancelar");
        }
        await loadTransactions();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao cancelar");
      } finally {
        setCancelingId(null);
      }
    },
    [canEdit, loadTransactions],
  );

  useEffect(() => {
    setPage(1);
  }, [filters]);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  useEffect(() => {
    void loadTransactions();
  }, [loadTransactions]);

  return (
    <main style={{ padding: 32 }}>
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Lançamentos financeiros</h1>
        {canEdit && (
          <Link
            href="/app/finance/transactions/new"
            style={{
              padding: "6px 12px",
              borderRadius: 6,
              border: "1px solid #222",
              textDecoration: "none",
              color: "inherit",
            }}
          >
            Novo lançamento
          </Link>
        )}
      </header>

      {!canEdit && <p style={{ marginTop: 8 }}>Acesso somente leitura.</p>}

      {error && <p style={{ marginTop: 12, color: "crimson" }}>{error}</p>}

      <section style={{ marginTop: 16 }}>
        <h2>Filtros</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 12,
            marginTop: 12,
          }}
        >
          <label>
            <div>Competência de</div>
            <input
              type="date"
              value={filters.startDate}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  startDate: event.target.value,
                }))
              }
            />
          </label>
          <label>
            <div>Competência até</div>
            <input
              type="date"
              value={filters.endDate}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  endDate: event.target.value,
                }))
              }
            />
          </label>
          <label>
            <div>Status</div>
            <select
              value={filters.status}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  status: event.target.value,
                }))
              }
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            <div>Fornecedor</div>
            <select
              value={filters.supplierId}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  supplierId: event.target.value,
                }))
              }
            >
              <option value="">Todos</option>
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
              value={filters.propertyId}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  propertyId: event.target.value,
                }))
              }
            >
              <option value="">Todos</option>
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
              value={filters.categoryId}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  categoryId: event.target.value,
                }))
              }
            >
              <option value="">Todos</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
          <label>
            <div>Conta</div>
            <select
              value={filters.accountId}
              onChange={(event) =>
                setFilters((prev) => ({
                  ...prev,
                  accountId: event.target.value,
                }))
              }
            >
              <option value="">Todas</option>
              {accounts.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <div style={{ display: "flex", gap: 24, marginBottom: 16 }}>
          <div>Total: {formatCurrency(totals.total)}</div>
          <div>Receitas: {formatCurrency(totals.income)}</div>
          <div>Despesas: {formatCurrency(totals.expense)}</div>
        </div>
        {loading ? (
          <p>Carregando...</p>
        ) : items.length === 0 ? (
          <p>Nenhum lançamento encontrado.</p>
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
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <strong>{item.supplier.name}</strong>
                    <div>{item.property.name}</div>
                  </div>
                  <div>{formatCurrency(item.amount)}</div>
                </div>
                <div style={{ marginTop: 8, display: "grid", gap: 4 }}>
                  <div>Tipo: {typeLabel(item.type)}</div>
                  <div>Status: {item.status}</div>
                  <div>Competência: {item.competenceDate.slice(0, 10)}</div>
                  <div>
                    Conta: {item.account.name} | Categoria: {item.category.name}
                  </div>
                  <div>Descrição: {item.description ?? "-"}</div>
                </div>
                {canEdit && (
                  <div style={{ marginTop: 12, display: "flex", gap: 12 }}>
                    <Link href={`/app/finance/transactions/${item.id}`}>
                      Editar
                    </Link>
                    {item.status !== "SETTLED" && item.status !== "CANCELED" && (
                      <button
                        type="button"
                        onClick={() => settleTransaction(item.id)}
                        disabled={settlingId === item.id}
                      >
                        Marcar como realizado
                      </button>
                    )}
                    {item.status !== "CANCELED" && (
                      <button
                        type="button"
                        onClick={() => cancelTransaction(item.id)}
                        disabled={cancelingId === item.id}
                      >
                        Cancelar
                      </button>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
            disabled={page === 1 || loading}
          >
            Anterior
          </button>
          <div>
            Página {page} de {Math.max(1, Math.ceil(totalCount / pageSize))}
          </div>
          <button
            type="button"
            onClick={() =>
              setPage((prev) =>
                prev < Math.ceil(totalCount / pageSize) ? prev + 1 : prev,
              )
            }
            disabled={page >= Math.ceil(totalCount / pageSize) || loading}
          >
            Próxima
          </button>
        </div>
      </section>
    </main>
  );
}
