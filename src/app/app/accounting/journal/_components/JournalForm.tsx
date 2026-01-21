"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Account = {
  id: string;
  code: string;
  name: string;
};

type Line = {
  id: string;
  accountId: string;
  debit: string;
  credit: string;
  memo: string;
};

type JournalFormProps = {
  canEdit: boolean;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(amount);

const toIsoDate = (value: string) =>
  value ? new Date(`${value}T00:00:00.000Z`).toISOString() : "";

const emptyLine = (): Line => ({
  id: crypto.randomUUID(),
  accountId: "",
  debit: "",
  credit: "",
  memo: "",
});

export default function JournalForm({ canEdit }: JournalFormProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<Line[]>([emptyLine(), emptyLine()]);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loadAccounts = useCallback(async () => {
    const response = await fetch("/api/accounting/chart", { cache: "no-store" });
    const payload = await response.json();
    setAccounts(payload.data ?? []);
  }, []);

  useEffect(() => {
    void loadAccounts();
  }, [loadAccounts]);

  const totals = useMemo(() => {
    const debitTotal = lines.reduce((sum, line) => sum + Number(line.debit || 0), 0);
    const creditTotal = lines.reduce((sum, line) => sum + Number(line.credit || 0), 0);
    return { debitTotal, creditTotal };
  }, [lines]);

  const updateLine = (id: string, patch: Partial<Line>) => {
    setLines((prev) =>
      prev.map((line) => (line.id === id ? { ...line, ...patch } : line)),
    );
  };

  const addLine = () => {
    setLines((prev) => [...prev, emptyLine()]);
  };

  const removeLine = (id: string) => {
    setLines((prev) => prev.filter((line) => line.id !== id));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canEdit) {
      return;
    }
    setError(null);
    setSuccess(null);
    setSaving(true);

    try {
      const response = await fetch("/api/accounting/journal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: toIsoDate(date),
          description: description.trim() || null,
          lines: lines.map((line) => ({
            accountId: line.accountId,
            debit: Number(line.debit || 0),
            credit: Number(line.credit || 0),
            memo: line.memo.trim() || null,
          })),
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Erro ao salvar");
      }
      setSuccess("Lançamento salvo.");
      setDate("");
      setDescription("");
      setLines([emptyLine(), emptyLine()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  return (
    <main style={{ padding: 32 }}>
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Novo lançamento manual</h1>
        <Link href="/app/accounting/journal">Voltar</Link>
      </header>

      {!canEdit && <p style={{ marginTop: 8 }}>Acesso somente leitura.</p>}
      {error && <p style={{ marginTop: 12, color: "crimson" }}>{error}</p>}
      {success && <p style={{ marginTop: 12, color: "green" }}>{success}</p>}

      <form onSubmit={handleSubmit} style={{ marginTop: 16 }}>
        <div style={{ display: "grid", gap: 12 }}>
          <label>
            <div>Data</div>
            <input
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              disabled={!canEdit}
            />
          </label>
          <label>
            <div>Descrição</div>
            <input
              type="text"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={!canEdit}
            />
          </label>
        </div>

        <section style={{ marginTop: 16 }}>
          <h2>Linhas</h2>
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            {lines.map((line, index) => (
              <div
                key={line.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: 12,
                }}
              >
                <div style={{ display: "grid", gap: 8 }}>
                  <label>
                    <div>Conta</div>
                    <select
                      value={line.accountId}
                      onChange={(event) =>
                        updateLine(line.id, { accountId: event.target.value })
                      }
                      disabled={!canEdit}
                    >
                      <option value="">Selecione</option>
                      {accounts.map((account) => (
                        <option key={account.id} value={account.id}>
                          {account.code} - {account.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <div>Débito</div>
                    <input
                      type="number"
                      step="0.01"
                      value={line.debit}
                      onChange={(event) =>
                        updateLine(line.id, {
                          debit: event.target.value,
                          credit: event.target.value ? "" : line.credit,
                        })
                      }
                      disabled={!canEdit}
                    />
                  </label>
                  <label>
                    <div>Crédito</div>
                    <input
                      type="number"
                      step="0.01"
                      value={line.credit}
                      onChange={(event) =>
                        updateLine(line.id, {
                          credit: event.target.value,
                          debit: event.target.value ? "" : line.debit,
                        })
                      }
                      disabled={!canEdit}
                    />
                  </label>
                  <label>
                    <div>Memo</div>
                    <input
                      type="text"
                      value={line.memo}
                      onChange={(event) =>
                        updateLine(line.id, { memo: event.target.value })
                      }
                      disabled={!canEdit}
                    />
                  </label>
                </div>
                {canEdit && lines.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removeLine(line.id)}
                    style={{ marginTop: 8 }}
                  >
                    Remover linha
                  </button>
                )}
                <div style={{ marginTop: 8 }}>Linha #{index + 1}</div>
              </div>
            ))}
          </div>
          {canEdit && (
            <button type="button" onClick={addLine} style={{ marginTop: 12 }}>
              Adicionar linha
            </button>
          )}
        </section>

        <section style={{ marginTop: 16 }}>
          <strong>Débitos:</strong> {formatCurrency(totals.debitTotal)}{" "}
          <strong>Créditos:</strong> {formatCurrency(totals.creditTotal)}
        </section>

        {canEdit && (
          <button type="submit" disabled={saving} style={{ marginTop: 16 }}>
            {saving ? "Salvando..." : "Salvar lançamento"}
          </button>
        )}
      </form>
    </main>
  );
}
