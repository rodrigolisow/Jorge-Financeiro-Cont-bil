import { auth } from "@clerk/nextjs/server";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";

import styles from "./page.module.css";

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    redirect("/app");
  }

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <Image
          className={styles.logo}
          src="/next.svg"
          alt="Next.js logo"
          width={100}
          height={20}
          priority
        />
        <div className={styles.intro}>
          <h1>Financeiro e Contábil</h1>
          <p>
            Faça login com sua conta Clerk para acessar o painel e os módulos
            financeiros e contábeis.
          </p>
        </div>
        <div className={styles.ctas}>
          <Link className={styles.primary} href="/sign-in">
            Entrar com Clerk
          </Link>
        </div>
      </main>
    </div>
  );
}
