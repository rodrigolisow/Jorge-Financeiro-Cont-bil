import React from 'react';
import styles from './PageHeader.module.css';

interface PageHeaderProps {
    title: string;
    description?: string;
    action?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({ title, description, action }) => {
    return (
        <div className={styles.pageHeader}>
            <div className={styles.pageTitleGroup}>
                <h1 className={styles.pageTitle}>{title}</h1>
                {description && <p className={styles.pageDescription}>{description}</p>}
            </div>
            {action && <div>{action}</div>}
        </div>
    );
};
