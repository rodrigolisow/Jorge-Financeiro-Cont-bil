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
import { Loader2, Plus, Search, Eye, RotateCcw, ArrowRight, ArrowLeft } from "lucide-react";

type JournalLine = {
  id: string;
  debit: string;
  credit: string;
  memo: string | null;
  account: { id: string; code: string; name: string };
};

type JournalEntry = {
  id: string;
  date: string;
  description: string | null;
  status: string;
  lines: JournalLine[];
};

type JournalListProps = {
  canEdit: boolean;
};

const toStartIso = (value: string) =>
  value ? new Date(`${value}T00:00:00.000Z`).toISOString() : "";

const toEndIso = (value: string) =>
  value ? new Date(`${value}T23:59:59.999Z`).toISOString() : "";

const formatCurrency = (amount: string) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(amount));

const formatDate = (isoString: string) => {
  return new Date(isoString).toLocaleDateString("pt-BR", {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "POSTED": return <Badge variant="success">Lançado</Badge>;
    case "DRAFT": return <Badge variant="secondary">Rascunho</Badge>;
    case "VOIDED": return <Badge variant="destructive">Anulado</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

export default function JournalList({ canEdit }: JournalListProps) {
  const [filters, setFilters] = useState({
    startDate: "",
    endDate: "",
    accountId: "",
  });
  const [items, setItems] = useState<JournalEntry[]>([]);
  const [accounts, setAccounts] = useState<{ id: string; code: string; name: string }[]>(
    [],
  );
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [reversingId, setReversingId] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (filters.startDate) {
      params.set("startDate", toStartIso(filters.startDate));
    }
    if (filters.endDate) {
      params.set("endDate", toEndIso(filters.endDate));
    }
    if (filters.accountId) {
      params.set("accountId", filters.accountId);
    }
    params.set("page", String(page));
    params.set("pageSize", String(pageSize));
    const value = params.toString();
    return value ? `?${value}` : "";
  }, [filters, page, pageSize]);

  const loadAccounts = useCallback(async () => {
    const response = await fetch("/api/accounting/chart", { cache: "no-store" });
    const payload = await response.json();
    if (response.ok) {
      setAccounts(payload.data ?? []);
    }
  }, []);

  const loadEntries = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/accounting/journal${queryString}`, {
        cache: "no-store",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Erro ao carregar");
      }
      setItems(payload.data?.items ?? []);
      setTotalCount(payload.data?.totalCount ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, [queryString]);

  const reverseEntry = useCallback(
    async (id: string) => {
      if (!canEdit) return;
      if (!confirm("Tem certeza que deseja estornar este lançamento? Isso criará um lançamento de reversão.")) return;

      setReversingId(id);
      setError(null);
      try {
        const response = await fetch(`/api/accounting/journal/${id}/reverse`, {
          method: "POST",
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error?.message ?? "Erro ao estornar");
        }
        await loadEntries();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao estornar");
      } finally {
        setReversingId(null);
      }
    },
    [canEdit, loadEntries],
  );

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  useEffect(() => {
    setPage(1);
  }, [filters]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  return (
    <div className="container mx-auto py-8 space-y-8">
      <PageHeader
        title="Diário Contábil"
        description="Visualize e gerencie todos os lançamentos contábeis (débito e crédito)."
        action={
          <div className="flex gap-3">
            <Link href="/app/accounting/chart">
              <Button variant="secondary">Ver Plano de Contas</Button>
            </Link>
            {canEdit && (
              <Link href="/app/accounting/journal/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Novo Lançamento
                </Button>
              </Link>
            )}
          </div>
        }
      />

      {error && (
        <div className="bg-red-50 text-red-600 p-4 rounded-md border border-red-200">
          {error}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Search className="h-5 w-5 text-muted-foreground" />
            Filtros e Pesquisa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <Input
                label="Data Inicial"
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              />
            </div>
            <div className="flex-1">
              <Input
                label="Data Final"
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              />
            </div>
            <div className="flex-[2]">
              <Select
                label="Filtrar por Conta"
                value={filters.accountId}
                onChange={(e) => setFilters(prev => ({ ...prev, accountId: e.target.value }))}
                options={[
                  { label: "Todas as contas", value: "" },
                  ...accounts.map(acc => ({ label: `${acc.code} - ${acc.name}`, value: acc.id }))
                ]}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        {loading ? (
          <div className="flex justify-center items-center p-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            Carregando lançamentos...
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="Nenhum lançamento encontrado"
            description="Tente ajustar os filtros ou crie um novo lançamento."
            action={canEdit ? (
              <Link href="/app/accounting/journal/new">
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Novo Lançamento
                </Button>
              </Link>
            ) : undefined}
          />
        ) : (
          <div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Descrição / Lançamentos</TableHead>
                  <TableHead>Valor Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((entry) => {
                  const debitTotal = entry.lines.reduce(
                    (sum, line) => sum + Number(line.debit),
                    0,
                  );

                  return (
                    <TableRow key={entry.id} className="align-top">
                      <TableCell className="font-medium whitespace-nowrap">
                        {formatDate(entry.date)}
                      </TableCell>
                      <TableCell>
                        <div className="font-medium mb-1">{entry.description || "Sem descrição"}</div>
                        <div className="text-xs text-muted-foreground space-y-1">
                          {entry.lines.map(line => (
                            <div key={line.id} className="flex gap-2">
                              <span className={Number(line.debit) > 0 ? "text-emerald-600 font-mono" : "text-amber-600 font-mono"}>
                                {Number(line.debit) > 0 ? "D" : "C"}
                              </span>
                              <span className="font-mono text-xs">{line.account.code}</span>
                              <span>{line.account.name}</span>
                              <span className="ml-auto font-mono">
                                {Number(line.debit) > 0 ? formatCurrency(line.debit) : formatCurrency(line.credit)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono whitespace-nowrap">
                        {formatCurrency(String(debitTotal))}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(entry.status)}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex flex-col gap-2 items-end">
                          <Link href={`/app/accounting/journal/${entry.id}`}>
                            <Button variant="ghost" size="sm" className="w-full justify-end">
                              <Eye className="h-4 w-4 mr-2" /> Detalhes
                            </Button>
                          </Link>
                          {canEdit && entry.status === "POSTED" && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-amber-600 hover:text-amber-700 hover:bg-amber-50 w-full justify-end"
                              onClick={() => reverseEntry(entry.id)}
                              isLoading={reversingId === entry.id}
                            >
                              <RotateCcw className="h-4 w-4 mr-2" /> Estornar
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>

            <div className="p-4 border-t flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Página {page} de {Math.max(1, Math.ceil(totalCount / pageSize))}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={page === 1 || loading}
                >
                  <ArrowLeft className="h-4 w-4 mr-2" /> Anterior
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => p < Math.ceil(totalCount / pageSize) ? p + 1 : p)}
                  disabled={page >= Math.ceil(totalCount / pageSize) || loading}
                >
                  Próxima <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
