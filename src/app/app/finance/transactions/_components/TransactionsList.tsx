"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardContent } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Plus, Filter, X, ArrowLeft, ArrowRight, CheckCircle, Ban, Search, FileEdit } from "lucide-react";

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

const StatusBadge = ({ status }: { status: string }) => {
  switch (status) {
    case "PLANNED":
      return <Badge variant="outline">Previsto</Badge>;
    case "SETTLED":
      return <Badge variant="success">Realizado</Badge>;
    case "CANCELED":
      return <Badge variant="destructive">Cancelado</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const TypeBadge = ({ type }: { type: string }) => {
  return type === "INCOME" ?
    <span className="text-emerald-600 font-medium text-sm">Receita</span> :
    <span className="text-red-600 font-medium text-sm">Despesa</span>;
}

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
  const [showFilters, setShowFilters] = useState(false);

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

  const updateFilter = (key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Lançamentos Financeiros"
        description="Gestão de receitas e despesas da operação."
        action={
          canEdit && (
            <Link href="/app/finance/transactions/new">
              <Button variant="primary">
                <Plus size={16} className="mr-2" /> Novo Lançamento
              </Button>
            </Link>
          )
        }
      />

      {error && <div className="bg-red-50 text-red-600 p-4 rounded-md">{error}</div>}

      <div className="flex flex-col gap-4">
        {/* Actions Bar */}
        <div className="flex justify-between items-center bg-white p-2 rounded-lg border border-slate-200">
          <Button variant="ghost" size="sm" onClick={() => setShowFilters(!showFilters)}>
            <Filter size={16} className="mr-2" /> Filtros
          </Button>

          <div className="flex gap-4 text-sm font-medium pr-4">
            <span className="text-muted-foreground">Entradas: <span className="text-emerald-600">{formatCurrency(totals.income)}</span></span>
            <span className="text-muted-foreground">Saídas: <span className="text-red-600">{formatCurrency(totals.expense)}</span></span>
            <span className="text-muted-foreground">Total: <span className="text-foreground">{formatCurrency(totals.total)}</span></span>
          </div>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <Card className="animate-in fade-in slide-in-from-top-2 duration-200">
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <Input type="date" label="De" value={filters.startDate} onChange={e => updateFilter('startDate', e.target.value)} />
                <Input type="date" label="Até" value={filters.endDate} onChange={e => updateFilter('endDate', e.target.value)} />
                <Select
                  label="Status"
                  value={filters.status}
                  onChange={e => updateFilter('status', e.target.value)}
                  options={statusOptions}
                />
                <Select
                  label="Fornecedor"
                  value={filters.supplierId}
                  onChange={e => updateFilter('supplierId', e.target.value)}
                  options={[{ label: "Todos", value: "" }, ...suppliers.map(s => ({ label: s.name, value: s.id }))]}
                />
                <Select
                  label="Imóvel"
                  value={filters.propertyId}
                  onChange={e => updateFilter('propertyId', e.target.value)}
                  options={[{ label: "Todos", value: "" }, ...properties.map(s => ({ label: s.name, value: s.id }))]}
                />
                <Select
                  label="Categoria"
                  value={filters.categoryId}
                  onChange={e => updateFilter('categoryId', e.target.value)}
                  options={[{ label: "Todos", value: "" }, ...categories.map(s => ({ label: s.name, value: s.id }))]}
                />
                <Select
                  label="Conta"
                  value={filters.accountId}
                  onChange={e => updateFilter('accountId', e.target.value)}
                  options={[{ label: "Todas", value: "" }, ...accounts.map(s => ({ label: s.name, value: s.id }))]}
                />
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      <Card>
        {loading ? (
          <div className="p-12 text-center text-muted-foreground">Carregando lançamentos...</div>
        ) : items.length === 0 ? (
          <div className="p-2">
            <EmptyState
              title="Nenhum lançamento encontrado"
              description="Tente ajustar os filtros ou crie um novo lançamento."
              actionLabel={canEdit ? "Criar Lançamento" : undefined}
              onAction={() => window.location.href = '/app/finance/transactions/new'}
            />
          </div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Descrição/Entidade</TableHead>
                  <TableHead>Competência</TableHead>
                  <TableHead>Categoria/Conta</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Valor</TableHead>
                  <TableHead>Status</TableHead>
                  {canEdit && <TableHead className="text-right">Ações</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((item) => (
                  <TableRow key={item.id} className="group">
                    <TableCell>
                      <div className="font-medium">{item.description || "Sem descrição"}</div>
                      <div className="text-xs text-muted-foreground">{item.supplier.name} • {item.property.name}</div>
                    </TableCell>
                    <TableCell className="text-sm">{new Date(item.competenceDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <div className="text-sm">{item.category.name}</div>
                      <div className="text-xs text-muted-foreground">{item.account.name}</div>
                    </TableCell>
                    <TableCell>
                      <TypeBadge type={item.type} />
                    </TableCell>
                    <TableCell className="font-medium">
                      {formatCurrency(item.amount)}
                    </TableCell>
                    <TableCell>
                      <StatusBadge status={item.status} />
                    </TableCell>
                    {canEdit && (
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          {item.status !== "SETTLED" && item.status !== "CANCELED" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-emerald-600"
                              title="Liquidar"
                              onClick={() => settleTransaction(item.id)}
                              disabled={settlingId === item.id}
                            >
                              <CheckCircle size={16} />
                            </Button>
                          )}
                          <Link href={`/app/finance/transactions/${item.id}`}>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0" title="Editar">
                              <FileEdit size={16} />
                            </Button>
                          </Link>
                          {item.status !== "CANCELED" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-red-500"
                              title="Cancelar"
                              onClick={() => cancelTransaction(item.id)}
                              disabled={cancelingId === item.id}
                            >
                              <Ban size={16} />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="flex items-center justify-between p-4 border-t border-slate-200">
              <div className="text-sm text-muted-foreground">
                Página {page} de {Math.max(1, Math.ceil(totalCount / pageSize))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  <ArrowLeft size={16} />
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page >= Math.ceil(totalCount / pageSize) || loading}
                >
                  <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
