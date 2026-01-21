"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type JournalLine = {
  id: string;
  debit: string;
  credit: string;
  memo: string | null;
  account: { code: string; name: string };
};

type JournalEntry = {
  id: string;
  date: string;
  description: string | null;
  status: string;
  lines: JournalLine[];
};

type JournalEntryDetailProps = {
  entryId: string;
};

const formatCurrency = (amount: string) =>
  new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(Number(amount));

export default function JournalEntryDetail({ entryId }: JournalEntryDetailProps) {
  const [entry, setEntry] = useState<JournalEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadEntry = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`/api/accounting/journal/${entryId}`, {
          cache: "no-store",
        });
        const payload = await response.json();
        if (!response.ok) {
          throw new Error(payload?.error?.message ?? "Erro ao carregar");
        }
        setEntry(payload.data ?? null);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro ao carregar");
      } finally {
        setLoading(false);
      }
    };

    void loadEntry();
  }, [entryId]);

  if (loading) {
    return <p>Carregando...</p>;
  }

  if (error) {
    return <p style={{ color: "crimson" }}>{error}</p>;
  }

  if (!entry) {
    return <p>Lançamento não encontrado.</p>;
  }

  const debitTotal = entry.lines.reduce(
    (sum, line) => sum + Number(line.debit),
    0,
  );

  return (
    <main style={{ padding: 32 }}>
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Detalhe do lançamento</h1>
        <Link href="/app/accounting/journal">Voltar</Link>
      </header>

      <section style={{ marginTop: 16 }}>
        <div>Data: {entry.date.slice(0, 10)}</div>
        <div>Status: {entry.status}</div>
        <div>Descrição: {entry.description ?? "-"}</div>
        <div>Total: {formatCurrency(String(debitTotal))}</div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h2>Linhas</h2>
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
      </section>
    </main>
  );
}
