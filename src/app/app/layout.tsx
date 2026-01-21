import Link from "next/link";

import Topbar from "@/app/app/_components/Topbar";

const navigation = [
  {
    title: "Financeiro",
    items: [
      { label: "Lançamentos", href: "/app/finance/transactions" },
      { label: "Fornecedores", href: "/app/finance/suppliers" },
      { label: "Imóveis", href: "/app/finance/properties" },
      { label: "Contas", href: "/app/finance/accounts" },
      { label: "Categorias", href: "/app/finance/categories" },
    ],
  },
  {
    title: "Contábil",
    items: [
      { label: "Plano de contas", href: "/app/accounting/chart" },
      { label: "Diário", href: "/app/accounting/journal" },
      { label: "Mapeamento", href: "/app/accounting/mapping" },
      { label: "Pendências", href: "/app/accounting/issues" },
    ],
  },
];

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#fafafa" }}>
      <Topbar />
      <div style={{ display: "grid", gridTemplateColumns: "260px 1fr" }}>
        <aside
          style={{
            borderRight: "1px solid #e5e5e5",
            padding: 24,
            backgroundColor: "#fff",
            minHeight: "calc(100vh - 57px)",
          }}
        >
          {navigation.map((section) => (
            <div key={section.title} style={{ marginBottom: 24 }}>
              <div style={{ fontWeight: 600, marginBottom: 8 }}>
                {section.title}
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                {section.items.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    style={{ textDecoration: "none", color: "inherit" }}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </aside>
        <div style={{ minWidth: 0 }}>{children}</div>
      </div>
    </div>
  );
}
