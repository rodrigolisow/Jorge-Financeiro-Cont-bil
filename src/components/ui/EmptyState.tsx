import React from 'react';
import { Button } from './Button';
import { PackageOpen } from 'lucide-react';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    action?: React.ReactNode;
    icon?: React.ElementType;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
    title,
    description,
    actionLabel,
    onAction,
    action,
    icon: Icon = PackageOpen
}) => {
    return (
        <div className={styles.emptyState}>
            <div className={styles.iconWrapper}>
                <Icon size={28} />
            </div>
            <h3 className={styles.title}>{title}</h3>
            <p className={styles.description}>{description}</p>

            {action ? (
                <div className={styles.actionWrapper}>{action}</div>
            ) : (
                actionLabel && onAction && (
                    <div className={styles.actionWrapper}>
                        <Button variant="primary" onClick={onAction}>
                            {actionLabel}
                        </Button>
                    </div>
                )
            )}
        </div>
    );
};
