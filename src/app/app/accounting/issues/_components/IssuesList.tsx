"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/Table";
import { Select } from "@/components/ui/Select";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { Loader2, CheckCircle2, AlertCircle, ArrowRight } from "lucide-react";

type Transaction = {
  id: string;
  amount: string;
  competenceDate: string;
  supplier: { name: string };
  property: { name: string };
  account: { name: string };
  category: { name: string };
};

type Issue = {
  id: string;
  status: string;
  reason: string;
  createdAt: string;
  resolvedAt: string | null;
  resolvedBy: { id: string; clerkUserId: string } | null;
  financialTransaction: Transaction;
};

type IssuesListProps = {
  canResolve: boolean;
};

const statusOptions = [
  { label: "Todas", value: "" },
  { label: "Abertas", value: "OPEN" },
  { label: "Resolvidas", value: "RESOLVED" },
  { label: "Ignoradas", value: "IGNORED" },
];

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
    case "OPEN": return <Badge variant="destructive">Aberta</Badge>;
    case "RESOLVED": return <Badge variant="success">Resolvida</Badge>;
    case "IGNORED": return <Badge variant="secondary">Ignorada</Badge>;
    default: return <Badge variant="outline">{status}</Badge>;
  }
};

export default function IssuesList({ canResolve }: IssuesListProps) {
  const [status, setStatus] = useState("OPEN"); // Default to showing open issues
  const [items, setItems] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    if (status) {
      params.set("status", status);
    }
    const value = params.toString();
    return value ? `?${value}` : "";
  }, [status]);

  const loadIssues = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/accounting/issues${queryString}`, {
        cache: "no-store",
      });
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
  }, [queryString]);

  useEffect(() => {
    void loadIssues();
  }, [loadIssues]);

  const resolveIssue = async (id: string, reason: string) => {
    if (!canResolve) return;
    if (!confirm(`Tem certeza que deseja resolver esta pendência: "${reason}"?`)) return;

    setSaving(true);
    setResolvingId(id);
    setError(null);
    try {
      const response = await fetch(`/api/accounting/issues/${id}/resolve`, {
        method: "POST",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Erro ao resolver");
      }
      await loadIssues();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao resolver");
    } finally {
      setSaving(false);
      setResolvingId(null);
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <PageHeader
        title="Pendências Contábeis"
        description="Gerencie exceções e pendências de conciliação entre o financeiro e o contábil."
        action={
          <div className="flex gap-3">
            <Link href="/app/accounting/mapping">
              <Button variant="outline">
                Ver Regras de Mapeamento <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
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
          <CardTitle className="text-lg">Filtros</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-w-xs">
            <Select
              label="Status da Pendência"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              options={statusOptions}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        {loading ? (
          <div className="flex justify-center items-center p-12 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            Carregando pendências...
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            title="Nenhuma pendência encontrada"
            description="Tudo parece estar em ordem para o filtro selecionado."
            icon={CheckCircle2}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data / Competência</TableHead>
                <TableHead>Motivo / Detalhes</TableHead>
                <TableHead>Transação Financeira</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Status</TableHead>
                {canResolve && status !== "RESOLVED" && <TableHead className="text-right">Ações</TableHead>}
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((issue) => (
                <TableRow key={issue.id} className="align-top">
                  <TableCell>
                    <div className="text-sm font-medium">Criada: {formatDate(issue.createdAt)}</div>
                    <div className="text-xs text-muted-foreground">Comp: {formatDate(issue.financialTransaction.competenceDate)}</div>
                  </TableCell>
                  <TableCell>
                    <div className="font-medium text-amber-700 flex items-center gap-1">
                      <AlertCircle className="h-4 w-4" />
                      {issue.reason}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {issue.resolvedBy ? `Resolvido por: ${issue.resolvedBy.clerkUserId}` : ""}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <div><span className="font-semibold">{issue.financialTransaction.supplier.name}</span></div>
                      <div className="text-muted-foreground text-xs">{issue.financialTransaction.category.name}</div>
                      <div className="text-muted-foreground text-xs">{issue.financialTransaction.account.name}</div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono">
                    {formatCurrency(issue.financialTransaction.amount)}
                  </TableCell>
                  <TableCell>
                    {getStatusBadge(issue.status)}
                  </TableCell>
                  {canResolve && status !== "RESOLVED" && issue.status !== "RESOLVED" && (
                    <TableCell className="text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => resolveIssue(issue.id, issue.reason)}
                        isLoading={resolvingId === issue.id}
                        disabled={saving}
                      >
                        Resolver
                      </Button>
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
