"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

type Option = {
  id: string;
  name: string;
};

type AccountOption = Option & { code: string };

type MappingRule = {
  id: string;
  financialCategory: Option;
  financialAccount: Option;
  supplier: Option | null;
  property: Option | null;
  debitAccount: AccountOption;
  creditAccount: AccountOption;
};

type MappingRulesProps = {
  canEdit: boolean;
};

export default function MappingRules({ canEdit }: MappingRulesProps) {
  const [rules, setRules] = useState<MappingRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<Option[]>([]);
  const [accounts, setAccounts] = useState<Option[]>([]);
  const [suppliers, setSuppliers] = useState<Option[]>([]);
  const [properties, setProperties] = useState<Option[]>([]);
  const [chartAccounts, setChartAccounts] = useState<AccountOption[]>([]);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    financialCategoryId: "",
    financialAccountId: "",
    supplierId: "",
    propertyId: "",
    debitAccountId: "",
    creditAccountId: "",
  });
  const [editForm, setEditForm] = useState({
    financialCategoryId: "",
    financialAccountId: "",
    supplierId: "",
    propertyId: "",
    debitAccountId: "",
    creditAccountId: "",
  });

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [
        rulesRes,
        categoriesRes,
        accountsRes,
        suppliersRes,
        propertiesRes,
        chartRes,
      ] = await Promise.all([
        fetch("/api/accounting/mapping", { cache: "no-store" }),
        fetch("/api/finance/categories", { cache: "no-store" }),
        fetch("/api/finance/accounts", { cache: "no-store" }),
        fetch("/api/finance/suppliers", { cache: "no-store" }),
        fetch("/api/finance/properties", { cache: "no-store" }),
        fetch("/api/accounting/chart", { cache: "no-store" }),
      ]);

      const [
        rulesPayload,
        categoriesPayload,
        accountsPayload,
        suppliersPayload,
        propertiesPayload,
        chartPayload,
      ] = await Promise.all([
        rulesRes.json(),
        categoriesRes.json(),
        accountsRes.json(),
        suppliersRes.json(),
        propertiesRes.json(),
        chartRes.json(),
      ]);

      if (!rulesRes.ok) {
        throw new Error(rulesPayload?.error?.message ?? "Erro ao carregar");
      }

      setRules(rulesPayload.data ?? []);
      setCategories(categoriesPayload.data ?? []);
      setAccounts(accountsPayload.data ?? []);
      setSuppliers(suppliersPayload.data ?? []);
      setProperties(propertiesPayload.data ?? []);
      setChartAccounts(chartPayload.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao carregar");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAll();
  }, [loadAll]);

  const handleCreate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!canEdit) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch("/api/accounting/mapping", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          supplierId: form.supplierId || null,
          propertyId: form.propertyId || null,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Erro ao salvar");
      }
      setForm({
        financialCategoryId: "",
        financialAccountId: "",
        supplierId: "",
        propertyId: "",
        debitAccountId: "",
        creditAccountId: "",
      });
      setCreating(false);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao salvar");
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!editingId) {
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/accounting/mapping/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          supplierId: editForm.supplierId || null,
          propertyId: editForm.propertyId || null,
        }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Erro ao atualizar");
      }
      setEditingId(null);
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao atualizar");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    setSaving(true);
    setError(null);
    try {
      const response = await fetch(`/api/accounting/mapping/${id}`, {
        method: "DELETE",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error?.message ?? "Erro ao remover");
      }
      await loadAll();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao remover");
    } finally {
      setSaving(false);
    }
  };

  const selectOptions = useMemo(
    () => ({
      categories,
      accounts,
      suppliers,
      properties,
      chartAccounts,
    }),
    [categories, accounts, suppliers, properties, chartAccounts],
  );

  const formatAccount = (account: AccountOption) =>
    `${account.code} - ${account.name}`;

  return (
    <main style={{ padding: 32 }}>
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <h1>Regras de mapeamento</h1>
        <div style={{ display: "flex", gap: 12 }}>
          <Link href="/app/accounting/issues">Pendências</Link>
          {canEdit && (
            <button type="button" onClick={() => setCreating((prev) => !prev)}>
              {creating ? "Fechar" : "Nova regra"}
            </button>
          )}
        </div>
      </header>

      {!canEdit && <p style={{ marginTop: 8 }}>Acesso somente leitura.</p>}
      {error && <p style={{ marginTop: 12, color: "crimson" }}>{error}</p>}

      {creating && canEdit && (
        <form onSubmit={handleCreate} style={{ marginTop: 16 }}>
          <h2>Nova regra</h2>
          <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
            <label>
              <div>Categoria financeira</div>
              <select
                value={form.financialCategoryId}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    financialCategoryId: event.target.value,
                  }))
                }
              >
                <option value="">Selecione</option>
                {selectOptions.categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <div>Conta financeira</div>
              <select
                value={form.financialAccountId}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    financialAccountId: event.target.value,
                  }))
                }
              >
                <option value="">Selecione</option>
                {selectOptions.accounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <div>Fornecedor (opcional)</div>
              <select
                value={form.supplierId}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    supplierId: event.target.value,
                  }))
                }
              >
                <option value="">Todos</option>
                {selectOptions.suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <div>Imóvel (opcional)</div>
              <select
                value={form.propertyId}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    propertyId: event.target.value,
                  }))
                }
              >
                <option value="">Todos</option>
                {selectOptions.properties.map((property) => (
                  <option key={property.id} value={property.id}>
                    {property.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <div>Conta débito</div>
              <select
                value={form.debitAccountId}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    debitAccountId: event.target.value,
                  }))
                }
              >
                <option value="">Selecione</option>
                {selectOptions.chartAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {formatAccount(account)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <div>Conta crédito</div>
              <select
                value={form.creditAccountId}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    creditAccountId: event.target.value,
                  }))
                }
              >
                <option value="">Selecione</option>
                {selectOptions.chartAccounts.map((account) => (
                  <option key={account.id} value={account.id}>
                    {formatAccount(account)}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button type="submit" disabled={saving} style={{ marginTop: 12 }}>
            Salvar
          </button>
        </form>
      )}

      <section style={{ marginTop: 24 }}>
        {loading ? (
          <p>Carregando...</p>
        ) : rules.length === 0 ? (
          <p>Nenhuma regra cadastrada.</p>
        ) : (
          <ul style={{ display: "grid", gap: 16, listStyle: "none" }}>
            {rules.map((rule) => (
              <li
                key={rule.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: 8,
                  padding: 16,
                }}
              >
                {editingId === rule.id ? (
                  <form onSubmit={handleUpdate}>
                    <div style={{ display: "grid", gap: 12 }}>
                      <label>
                        <div>Categoria financeira</div>
                        <select
                          value={editForm.financialCategoryId}
                          onChange={(event) =>
                            setEditForm((prev) => ({
                              ...prev,
                              financialCategoryId: event.target.value,
                            }))
                          }
                        >
                          <option value="">Selecione</option>
                          {selectOptions.categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <div>Conta financeira</div>
                        <select
                          value={editForm.financialAccountId}
                          onChange={(event) =>
                            setEditForm((prev) => ({
                              ...prev,
                              financialAccountId: event.target.value,
                            }))
                          }
                        >
                          <option value="">Selecione</option>
                          {selectOptions.accounts.map((account) => (
                            <option key={account.id} value={account.id}>
                              {account.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <div>Fornecedor (opcional)</div>
                        <select
                          value={editForm.supplierId}
                          onChange={(event) =>
                            setEditForm((prev) => ({
                              ...prev,
                              supplierId: event.target.value,
                            }))
                          }
                        >
                          <option value="">Todos</option>
                          {selectOptions.suppliers.map((supplier) => (
                            <option key={supplier.id} value={supplier.id}>
                              {supplier.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <div>Imóvel (opcional)</div>
                        <select
                          value={editForm.propertyId}
                          onChange={(event) =>
                            setEditForm((prev) => ({
                              ...prev,
                              propertyId: event.target.value,
                            }))
                          }
                        >
                          <option value="">Todos</option>
                          {selectOptions.properties.map((property) => (
                            <option key={property.id} value={property.id}>
                              {property.name}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <div>Conta débito</div>
                        <select
                          value={editForm.debitAccountId}
                          onChange={(event) =>
                            setEditForm((prev) => ({
                              ...prev,
                              debitAccountId: event.target.value,
                            }))
                          }
                        >
                          <option value="">Selecione</option>
                          {selectOptions.chartAccounts.map((account) => (
                            <option key={account.id} value={account.id}>
                              {formatAccount(account)}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label>
                        <div>Conta crédito</div>
                        <select
                          value={editForm.creditAccountId}
                          onChange={(event) =>
                            setEditForm((prev) => ({
                              ...prev,
                              creditAccountId: event.target.value,
                            }))
                          }
                        >
                          <option value="">Selecione</option>
                          {selectOptions.chartAccounts.map((account) => (
                            <option key={account.id} value={account.id}>
                              {formatAccount(account)}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                      <button type="submit" disabled={saving}>
                        Atualizar
                      </button>
                      <button type="button" onClick={() => setEditingId(null)}>
                        Cancelar
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <strong>
                      {rule.financialCategory.name} / {rule.financialAccount.name}
                    </strong>
                    <div>
                      Fornecedor: {rule.supplier?.name ?? "Todos"} | Imóvel:{" "}
                      {rule.property?.name ?? "Todos"}
                    </div>
                    <div>
                      Débito: {formatAccount(rule.debitAccount)} | Crédito:{" "}
                      {formatAccount(rule.creditAccount)}
                    </div>
                    {canEdit && (
                      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingId(rule.id);
                            setEditForm({
                              financialCategoryId: rule.financialCategory.id,
                              financialAccountId: rule.financialAccount.id,
                              supplierId: rule.supplier?.id ?? "",
                              propertyId: rule.property?.id ?? "",
                              debitAccountId: rule.debitAccount.id,
                              creditAccountId: rule.creditAccount.id,
                            });
                          }}
                        >
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(rule.id)}
                          disabled={saving}
                        >
                          Remover
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
