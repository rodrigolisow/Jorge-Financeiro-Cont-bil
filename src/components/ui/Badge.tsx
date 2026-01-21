import React from 'react';
import styles from './Badge.module.css';

type BadgeVariant = 'primary' | 'secondary' | 'outline' | 'destructive' | 'success' | 'warning';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    variant?: BadgeVariant;
}

export const Badge = ({ className = '', variant = 'primary', ...props }: BadgeProps) => {
    const classNames = [
        styles.badge,
        styles[variant],
        className
    ].filter(Boolean).join(' ');

    return (
        <span className={classNames} {...props} />
    );
};
