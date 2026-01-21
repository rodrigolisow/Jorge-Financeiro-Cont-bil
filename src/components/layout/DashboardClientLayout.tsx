"use client";

import React, { useState } from "react";
import { AppSidebar, AppHeader } from "@/components/layout/DashboardRefactored";
import styles from "@/components/layout/DashboardLayout.module.css";

export default function DashboardClientLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className={styles.layout}>
            <AppSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
            <div className={styles.mainContent}>
                <AppHeader onMenuClick={() => setSidebarOpen(true)} />
                <main className={styles.pageContent}>
                    {children}
                </main>
            </div>
        </div>
    );
}
