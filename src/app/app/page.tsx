import Link from "next/link";
import { redirect } from "next/navigation";

import { getOrCreateDbUser, requireAuth } from "@/lib/auth";

export default async function AppHome() {
  const { userId } = await requireAuth();

  if (!userId) {
    redirect("/sign-in");
  }

  const dbUser = await getOrCreateDbUser();
  const role = dbUser.role;

  return (
    <main style={{ padding: 32 }}>
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <div>
          <h1>Dashboard</h1>
          <div style={{ marginTop: 4 }}>Perfil: {role}</div>
        </div>
        <div style={{ color: "#666" }}>User ID: {userId}</div>
      </header>
      <section style={{ marginTop: 24 }}>
        <h2>Financeiro</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginTop: 12,
          }}
        >
          {[
            {
              title: "Lançamentos",
              description: "Previstos e realizados",
              href: "/app/finance/transactions",
            },
            {
              title: "Fornecedores",
              description: "Cadastro de fornecedores",
              href: "/app/finance/suppliers",
            },
            {
              title: "Imóveis",
              description: "Cadastro de imóveis",
              href: "/app/finance/properties",
            },
            {
              title: "Contas",
              description: "Contas financeiras",
              href: "/app/finance/accounts",
            },
            {
              title: "Categorias",
              description: "Receitas e despesas",
              href: "/app/finance/categories",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                border: "1px solid #ddd",
                borderRadius: 12,
                padding: 16,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div style={{ fontWeight: 600 }}>{item.title}</div>
              <div style={{ marginTop: 6, color: "#666" }}>
                {item.description}
              </div>
              <div style={{ marginTop: 12 }}>Abrir</div>
            </Link>
          ))}
        </div>
      </section>
      <section style={{ marginTop: 32 }}>
        <h2>Contábil</h2>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 16,
            marginTop: 12,
          }}
        >
          {[
            {
              title: "Plano de contas",
              description: "Estrutura contábil",
              href: "/app/accounting/chart",
            },
            {
              title: "Diário",
              description: "Lançamentos manuais",
              href: "/app/accounting/journal",
            },
            {
              title: "Mapeamento",
              description: "Regras de integração",
              href: "/app/accounting/mapping",
            },
            {
              title: "Pendências",
              description: "Issues contábeis",
              href: "/app/accounting/issues",
            },
          ].map((item) => (
            <Link
              key={item.href}
              href={item.href}
              style={{
                border: "1px solid #ddd",
                borderRadius: 12,
                padding: 16,
                textDecoration: "none",
                color: "inherit",
              }}
            >
              <div style={{ fontWeight: 600 }}>{item.title}</div>
              <div style={{ marginTop: 6, color: "#666" }}>
                {item.description}
              </div>
              <div style={{ marginTop: 12 }}>Abrir</div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
