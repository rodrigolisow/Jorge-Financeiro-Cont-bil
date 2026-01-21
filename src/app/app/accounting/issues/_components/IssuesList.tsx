"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

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

export default function IssuesList({ canResolve }: IssuesListProps) {
  const [status, setStatus] = useState("");
  const [items, setItems] = useState<Issue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

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

  const resolveIssue = async (id: string) => {
    if (!canResolve) {
      return;
    }
    setSaving(true);
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
    }
  };

  return (
    <main style={{ padding: 32 }}>
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Pendências contábeis</h1>
        <div style={{ display: "flex", gap: 12 }}>
          <Link
            href="/app/accounting/mapping"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            Regras de mapeamento
          </Link>
          {canResolve && (
            <Link
              href="/app/accounting/mapping"
              style={{
                padding: "6px 12px",
                borderRadius: 6,
                border: "1px solid #222",
                textDecoration: "none",
                color: "inherit",
              }}
            >
              Cadastrar regra
            </Link>
          )}
        </div>
      </header>

      {!canResolve && <p style={{ marginTop: 8 }}>Acesso somente leitura.</p>}
      {error && <p style={{ marginTop: 12, color: "crimson" }}>{error}</p>}

      <section style={{ marginTop: 16 }}>
        <h2>Status</h2>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          style={{ marginTop: 8 }}
        >
          {statusOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </section>

      <section style={{ marginTop: 24 }}>
        {loading ? (
          <p>Carregando...</p>
        ) : items.length === 0 ? (
          <p>Nenhuma pendência encontrada.</p>
        ) : (
          <ul style={{ display: "grid", gap: 16, listStyle: "none" }}>
            {items.map((issue) => (
              <li
                key={issue.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <div>
                    <strong>{issue.reason}</strong>
                    <div>{issue.financialTransaction.supplier.name}</div>
                    <div>{issue.financialTransaction.property.name}</div>
                  </div>
                  <div>{formatCurrency(issue.financialTransaction.amount)}</div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <div>Status: {issue.status}</div>
                  <div>
                    Competência: {issue.financialTransaction.competenceDate.slice(0, 10)}
                  </div>
                  <div>
                    Conta: {issue.financialTransaction.account.name} | Categoria:{" "}
                    {issue.financialTransaction.category.name}
                  </div>
                </div>
                <div style={{ marginTop: 8 }}>
                  <div>Aberta em: {issue.createdAt.slice(0, 10)}</div>
                  <div>
                    Resolvida em: {issue.resolvedAt ? issue.resolvedAt.slice(0, 10) : "-"}
                  </div>
                  <div>
                    Resolvida por: {issue.resolvedBy?.clerkUserId ?? "-"}
                  </div>
                </div>
                {canResolve && issue.status !== "RESOLVED" && (
                  <button
                    type="button"
                    onClick={() => resolveIssue(issue.id)}
                    disabled={saving}
                    style={{ marginTop: 12 }}
                  >
                    Marcar como resolvida
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
