"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

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
      if (!canEdit) {
        return;
      }
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
    <main style={{ padding: 32 }}>
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Diário contábil</h1>
        <div style={{ display: "flex", gap: 12 }}>
          <Link
            href="/app/accounting/chart"
            style={{ textDecoration: "none", color: "inherit" }}
          >
            Plano de contas
          </Link>
          {canEdit && (
            <Link
              href="/app/accounting/journal/new"
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
        </div>
      </header>

      {!canEdit && <p style={{ marginTop: 8 }}>Acesso somente leitura.</p>}
      {error && <p style={{ marginTop: 12, color: "crimson" }}>{error}</p>}

      <section style={{ marginTop: 16 }}>
        <h2>Filtros</h2>
        <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
          <label>
            <div>Data de</div>
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
            <div>Data até</div>
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
                  {account.code} - {account.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        {loading ? (
          <p>Carregando...</p>
        ) : items.length === 0 ? (
          <p>Nenhum lançamento contábil encontrado.</p>
        ) : (
          <ul style={{ display: "grid", gap: 16, listStyle: "none" }}>
            {items.map((entry) => {
              const debitTotal = entry.lines.reduce(
                (sum, line) => sum + Number(line.debit),
                0,
              );

              return (
                <li
                  key={entry.id}
                  style={{
                    border: "1px solid #ddd",
                    borderRadius: 8,
                    padding: 16,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div>
                      <strong>{entry.date.slice(0, 10)}</strong>
                      <div>{entry.description ?? "-"}</div>
                    </div>
                    <div>{formatCurrency(String(debitTotal))}</div>
                  </div>
                  <div style={{ marginTop: 12 }}>
                    <ul style={{ display: "grid", gap: 8, listStyle: "none" }}>
                      {entry.lines.map((line) => (
                        <li key={line.id}>
                          {line.account.code} - {line.account.name} |{" "}
                          {line.debit !== "0"
                            ? `Débito ${formatCurrency(line.debit)}`
                            : `Crédito ${formatCurrency(line.credit)}`}{" "}
                          {line.memo ? `- ${line.memo}` : ""}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div style={{ marginTop: 8 }}>Status: {entry.status}</div>
                  <div style={{ marginTop: 8 }}>
                    <Link href={`/app/accounting/journal/${entry.id}`}>
                      Ver detalhes
                    </Link>
                  </div>
                  {canEdit && entry.status === "POSTED" && (
                    <button
                      type="button"
                      onClick={() => reverseEntry(entry.id)}
                      disabled={reversingId === entry.id}
                      style={{ marginTop: 12 }}
                    >
                      Estornar
                    </button>
                  )}
                </li>
              );
            })}
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
