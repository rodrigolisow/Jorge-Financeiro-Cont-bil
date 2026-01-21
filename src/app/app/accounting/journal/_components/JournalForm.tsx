"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { ArrowLeft, Save, Plus, Trash2, AlertCircle, CheckCircle } from "lucide-react";
import styles from "./JournalForm.module.css";

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
    const balanced = Math.abs(debitTotal - creditTotal) < 0.01;
    return { debitTotal, creditTotal, balanced };
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
    if (!canEdit) return;
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
      setSuccess("Lançamento salvo com sucesso!");
      setDate("");
      setDescription("");
      setLines([emptyLine(), emptyLine()]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const accountOptions = [
    { label: "Selecione a conta...", value: "" },
    ...accounts.map((a) => ({ label: `${a.code} - ${a.name}`, value: a.id })),
  ];

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <Link href="/app/accounting/journal" className={styles.backLink}>
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className={styles.title}>Novo Lançamento Contábil</h1>
            <p className={styles.subtitle}>Partida dobrada manual</p>
          </div>
        </div>
        {canEdit && (
          <Button type="submit" form="journal-form" variant="primary" isLoading={saving} disabled={!totals.balanced}>
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

      {!canEdit && (
        <div className={styles.alertWarning}>
          Acesso somente leitura.
        </div>
      )}

      {/* Form */}
      <form id="journal-form" onSubmit={handleSubmit} className={styles.form}>
        {/* Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle>Dados do Lançamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={styles.formGrid}>
              <Input
                label="Data"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                disabled={!canEdit}
                required
              />
              <Input
                label="Descrição"
                placeholder="Ex: Pagamento de fornecedor"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!canEdit}
              />
            </div>
          </CardContent>
        </Card>

        {/* Lines */}
        <Card>
          <CardHeader>
            <div className={styles.linesHeader}>
              <CardTitle>Linhas do Lançamento</CardTitle>
              {canEdit && (
                <Button type="button" variant="secondary" size="sm" onClick={addLine}>
                  <Plus size={16} /> Adicionar Linha
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className={styles.linesContainer}>
              {lines.map((line, index) => (
                <div key={line.id} className={styles.lineCard}>
                  <div className={styles.lineNumber}>#{index + 1}</div>
                  <div className={styles.lineGrid}>
                    <Select
                      label="Conta"
                      value={line.accountId}
                      onChange={(e) => updateLine(line.id, { accountId: e.target.value })}
                      options={accountOptions}
                      disabled={!canEdit}
                      required
                    />
                    <Input
                      label="Débito (R$)"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={line.debit}
                      onChange={(e) => updateLine(line.id, { debit: e.target.value, credit: e.target.value ? "" : line.credit })}
                      disabled={!canEdit || !!line.credit}
                    />
                    <Input
                      label="Crédito (R$)"
                      type="number"
                      step="0.01"
                      placeholder="0,00"
                      value={line.credit}
                      onChange={(e) => updateLine(line.id, { credit: e.target.value, debit: e.target.value ? "" : line.debit })}
                      disabled={!canEdit || !!line.debit}
                    />
                    <Input
                      label="Memo"
                      placeholder="Observação"
                      value={line.memo}
                      onChange={(e) => updateLine(line.id, { memo: e.target.value })}
                      disabled={!canEdit}
                    />
                  </div>
                  {canEdit && lines.length > 2 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLine(line.id)}
                      className={styles.removeButton}
                    >
                      <Trash2 size={16} />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Totals */}
        <div className={styles.totalsBar}>
          <div className={styles.totalItem}>
            <span className={styles.totalLabel}>Total Débitos:</span>
            <span className={styles.totalValueDebit}>{formatCurrency(totals.debitTotal)}</span>
          </div>
          <div className={styles.totalItem}>
            <span className={styles.totalLabel}>Total Créditos:</span>
            <span className={styles.totalValueCredit}>{formatCurrency(totals.creditTotal)}</span>
          </div>
          <div className={styles.totalItem}>
            <span className={styles.totalLabel}>Status:</span>
            {totals.balanced ? (
              <span className={styles.balanced}><CheckCircle size={16} /> Balanceado</span>
            ) : (
              <span className={styles.unbalanced}><AlertCircle size={16} /> Desbalanceado</span>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
