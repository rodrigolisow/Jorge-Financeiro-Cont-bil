import Link from "next/link";
import { redirect } from "next/navigation";
import { getOrCreateDbUser, requireAuth } from "@/lib/auth";
import {
  Wallet,
  Building2,
  Users,
  ArrowUpRight,
  Activity,
  AlertCircle,
  BookOpen,
  FileText,
  WrapText,
  Tags,
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  Sparkles,
} from "lucide-react";
import { getDashboardKPIs } from "@/server/dashboard/kpis";
import styles from "./dashboard.module.css";

const formatRole = (role: string) => {
  const map: Record<string, string> = {
    ADMIN: "Administrador",
    FINANCE: "Financeiro",
    ACCOUNTING: "Contabilidade",
    VIEWER: "Visualizador",
  };
  return map[role] || role;
};

export default async function AppHome() {
  const { userId } = await requireAuth();

  if (!userId) {
    redirect("/sign-in");
  }

  const dbUser = await getOrCreateDbUser();
  const role = dbUser.role;

  const kpis = await getDashboardKPIs();

  const formatMoney = (value: number) =>
    new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);

  const formatTrend = (value: number) => {
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}% este mês`;
  };

  return (
    <div className={styles.dashboard}>
      {/* Welcome Section */}
      <div className={styles.welcomeSection}>
        <div className={styles.welcomeText}>
          <div className={styles.greeting}>
            <Sparkles size={20} className={styles.sparkle} />
            <span>Olá, bem-vindo de volta!</span>
          </div>
          <h1 className={styles.title}>Painel de Controle</h1>
        </div>
        <div className={styles.roleTag}>
          <span className={styles.roleDot}></span>
          {formatRole(role)}
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className={styles.kpiGrid}>
        <div className={`${styles.kpiCard} ${styles.kpiGreen}`}>
          <div className={styles.kpiIcon}>
            <TrendingUp size={24} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Receitas (Mês)</span>
            <span className={styles.kpiValue}>{formatMoney(kpis.income.value)}</span>
            <span className={styles.kpiTrend}>{formatTrend(kpis.income.trend)}</span>
          </div>
        </div>

        <div className={`${styles.kpiCard} ${styles.kpiRed}`}>
          <div className={styles.kpiIcon}>
            <TrendingDown size={24} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Despesas (Mês)</span>
            <span className={styles.kpiValue}>{formatMoney(kpis.expense.value)}</span>
            <span className={styles.kpiTrend}>{formatTrend(kpis.expense.trend)}</span>
          </div>
        </div>

        <div className={`${styles.kpiCard} ${styles.kpiCyan}`}>
          <div className={styles.kpiIcon}>
            <DollarSign size={24} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Saldo Total</span>
            <span className={styles.kpiValue}>{formatMoney(kpis.balance.value)}</span>
            <span className={styles.kpiTrend}>Acumulado</span>
          </div>
        </div>

        <div className={`${styles.kpiCard} ${styles.kpiAmber}`}>
          <div className={styles.kpiIcon}>
            <AlertCircle size={24} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiLabel}>Pendências Contábeis</span>
            <span className={styles.kpiValue}>{kpis.pendingIssues.count}</span>
            <span className={styles.kpiTrend}>Requer atenção</span>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className={styles.mainGrid}>
        {/* Finance Module */}
        <div className={styles.moduleCard}>
          <div className={styles.moduleHeader}>
            <div className={styles.moduleIconWrapper}>
              <PieChart size={20} />
            </div>
            <div>
              <h2 className={styles.moduleTitle}>Módulo Financeiro</h2>
              <p className={styles.moduleDesc}>Gerencie seu fluxo de caixa</p>
            </div>
          </div>
          <div className={styles.moduleLinks}>
            <Link href="/app/finance/transactions" className={styles.moduleLink}>
              <div className={styles.linkIconBox}><Wallet size={18} /></div>
              <div className={styles.linkText}>
                <span className={styles.linkTitle}>Lançamentos</span>
                <span className={styles.linkDesc}>Receitas e despesas</span>
              </div>
              <ArrowUpRight size={16} className={styles.linkArrow} />
            </Link>
            <Link href="/app/finance/suppliers" className={styles.moduleLink}>
              <div className={styles.linkIconBox}><Users size={18} /></div>
              <div className={styles.linkText}>
                <span className={styles.linkTitle}>Fornecedores</span>
                <span className={styles.linkDesc}>Base de credores</span>
              </div>
              <ArrowUpRight size={16} className={styles.linkArrow} />
            </Link>
            <Link href="/app/finance/properties" className={styles.moduleLink}>
              <div className={styles.linkIconBox}><Building2 size={18} /></div>
              <div className={styles.linkText}>
                <span className={styles.linkTitle}>Imóveis</span>
                <span className={styles.linkDesc}>Centros de custo</span>
              </div>
              <ArrowUpRight size={16} className={styles.linkArrow} />
            </Link>
            <Link href="/app/finance/accounts" className={styles.moduleLink}>
              <div className={styles.linkIconBox}><CreditCard size={18} /></div>
              <div className={styles.linkText}>
                <span className={styles.linkTitle}>Contas</span>
                <span className={styles.linkDesc}>Bancos e caixas</span>
              </div>
              <ArrowUpRight size={16} className={styles.linkArrow} />
            </Link>
            <Link href="/app/finance/categories" className={styles.moduleLink}>
              <div className={styles.linkIconBox}><Tags size={18} /></div>
              <div className={styles.linkText}>
                <span className={styles.linkTitle}>Categorias</span>
                <span className={styles.linkDesc}>Classificações</span>
              </div>
              <ArrowUpRight size={16} className={styles.linkArrow} />
            </Link>
          </div>
        </div>

        {/* Accounting Module */}
        <div className={styles.moduleCard}>
          <div className={styles.moduleHeader}>
            <div className={`${styles.moduleIconWrapper} ${styles.moduleIconAccounting}`}>
              <BarChart3 size={20} />
            </div>
            <div>
              <h2 className={styles.moduleTitle}>Módulo Contábil</h2>
              <p className={styles.moduleDesc}>Escrituração integrada</p>
            </div>
          </div>
          <div className={styles.moduleLinks}>
            <Link href="/app/accounting/chart" className={styles.moduleLink}>
              <div className={styles.linkIconBox}><BookOpen size={18} /></div>
              <div className={styles.linkText}>
                <span className={styles.linkTitle}>Plano de Contas</span>
                <span className={styles.linkDesc}>Estrutura contábil</span>
              </div>
              <ArrowUpRight size={16} className={styles.linkArrow} />
            </Link>
            <Link href="/app/accounting/journal" className={styles.moduleLink}>
              <div className={styles.linkIconBox}><FileText size={18} /></div>
              <div className={styles.linkText}>
                <span className={styles.linkTitle}>Livro Diário</span>
                <span className={styles.linkDesc}>Partidas dobradas</span>
              </div>
              <ArrowUpRight size={16} className={styles.linkArrow} />
            </Link>
            <Link href="/app/accounting/mapping" className={styles.moduleLink}>
              <div className={styles.linkIconBox}><WrapText size={18} /></div>
              <div className={styles.linkText}>
                <span className={styles.linkTitle}>Mapeamento</span>
                <span className={styles.linkDesc}>Regras de integração</span>
              </div>
              <ArrowUpRight size={16} className={styles.linkArrow} />
            </Link>
            <Link href="/app/accounting/issues" className={`${styles.moduleLink} ${styles.moduleLinkAlert}`}>
              <div className={styles.linkIconBox}><AlertCircle size={18} /></div>
              <div className={styles.linkText}>
                <span className={styles.linkTitle}>Pendências</span>
                <span className={styles.linkDesc}>3 itens aguardando</span>
              </div>
              <div className={styles.alertBadge}>3</div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
