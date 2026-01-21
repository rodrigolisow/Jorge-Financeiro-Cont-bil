import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { Button } from "@/components/ui/Button";
import styles from "./landing.module.css";
import { LayoutDashboard } from "lucide-react";

export default async function Home() {
  const { userId } = await auth();

  return (
    <div className={styles.main}>
      <header className={styles.header}>
        <nav className={styles.navbar}>
          <div className={styles.logo}>
            <LayoutDashboard size={32} className={styles.logoAccent} />
            <span>Fluxo<span className={styles.logoAccent}>Ideal</span></span>
          </div>

          <div className="flex items-center gap-4">
            <Link href={userId ? "/app" : "/sign-in"}>
              <Button className={styles.ctaButton}>
                {userId ? "Ir para Dashboard" : "Entrar"}
              </Button>
            </Link>
          </div>
        </nav>
      </header>

      <main className={styles.heroWrapper}>
        {/* Hero Section */}
        <section className={styles.hero}>
          <div className="container relative z-10">
            <h1 className={styles.heroTitle}>
              Gestão Financeira e Contábil <br />
              <span className="text-cyan-400">Integrada e Inteligente</span>
            </h1>
          </div>
        </section>
      </main>
    </div>
  );
}
