"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import {
    LayoutDashboard,
    Wallet,
    Users,
    Building2,
    CreditCard,
    Tags,
    BookOpen,
    FileText,
    WrapText,
    AlertCircle,
    Menu,
    ChevronRight,
    LogOut
} from "lucide-react";
import styles from "./DashboardLayout.module.css";

const navigation = [
    {
        title: "Geral",
        items: [
            { label: "Dashboard", href: "/app", icon: LayoutDashboard },
        ]
    },
    {
        title: "Financeiro",
        items: [
            { label: "Lançamentos", href: "/app/finance/transactions", icon: Wallet },
            { label: "Fornecedores", href: "/app/finance/suppliers", icon: Users },
            { label: "Imóveis", href: "/app/finance/properties", icon: Building2 },
            { label: "Contas", href: "/app/finance/accounts", icon: CreditCard },
            { label: "Categorias", href: "/app/finance/categories", icon: Tags },
        ],
    },
    {
        title: "Contábil",
        items: [
            { label: "Plano de contas", href: "/app/accounting/chart", icon: BookOpen },
            { label: "Diário", href: "/app/accounting/journal", icon: FileText },
            { label: "Mapeamento", href: "/app/accounting/mapping", icon: WrapText },
            { label: "Pendências", href: "/app/accounting/issues", icon: AlertCircle },
        ],
    },
];

export function AppSidebar({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
    const pathname = usePathname();

    return (
        <>
            <div
                className={`${styles.overlay} ${isOpen ? styles.open : ''}`}
                onClick={onClose}
            />
            <aside className={`${styles.sidebar} ${isOpen ? styles.open : ''}`}>
                <div className={styles.logoContainer}>
                    <LayoutDashboard size={20} className={styles.logoAccent} />
                    <span>Fluxo<span className={styles.logoAccent}>Ideal</span></span>
                </div>

                <nav className={styles.nav}>
                    {navigation.map((group) => (
                        <div key={group.title} className={styles.navGroup}>
                            <div className={styles.navGroupTitle}>{group.title}</div>
                            {group.items.map((item) => {
                                const Icon = item.icon;
                                const isActive = pathname === item.href;

                                return (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        className={`${styles.navItem} ${isActive ? styles.navItemActive : ''}`}
                                        onClick={() => onClose()} // Close mobile sidebar on navigate
                                    >
                                        <Icon size={18} />
                                        <span>{item.label}</span>
                                    </Link>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                {/* User Footer could go here if we wanted custom user info at bottom */}
            </aside>
        </>
    );
}

export function AppHeader({ onMenuClick }: { onMenuClick: () => void }) {
    const pathname = usePathname();
    const { user } = useUser();

    // Simple breadcrumb logic based on pathname
    const getBreadcrumbs = () => {
        // Find matching nav item
        const allItems = navigation.flatMap(g => g.items);
        const currentItem = allItems.find(i => i.href === pathname);

        // Find section title
        const currentSection = navigation.find(g => g.items.some(i => i.href === pathname));

        if (pathname === "/app") {
            return <span className={styles.breadcrumbActive}>Dashboard</span>;
        }

        if (currentItem && currentSection) {
            return (
                <>
                    <span>{currentSection.title}</span>
                    <ChevronRight size={14} />
                    <span className={styles.breadcrumbActive}>{currentItem.label}</span>
                </>
            );
        }

        // Fallback
        const parts = pathname.split('/').filter(Boolean).slice(1);
        return (
            <>
                {parts.map((part, index) => (
                    <React.Fragment key={part}>
                        {index > 0 && <ChevronRight size={14} />}
                        <span className={index === parts.length - 1 ? styles.breadcrumbActive : ''}>
                            {part.charAt(0).toUpperCase() + part.slice(1)}
                        </span>
                    </React.Fragment>
                ))}
            </>
        );
    };

    return (
        <header className={styles.topbar}>
            <div className={styles.topbarLeft}>
                <button className={styles.menuButton} onClick={onMenuClick}>
                    <Menu size={20} />
                </button>
                <div className={styles.breadcrumbs}>
                    {getBreadcrumbs()}
                </div>
            </div>

            <div>
                <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                        elements: {
                            avatarBox: "width: 32px; height: 32px;"
                        }
                    }}
                />
            </div>
        </header>
    );
}
