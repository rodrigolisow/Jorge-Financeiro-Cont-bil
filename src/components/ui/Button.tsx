import React from 'react';
import styles from './Button.module.css';
import { Loader2 } from 'lucide-react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'success' | 'link';
export type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className = '', variant = 'primary', size = 'md', isLoading, children, disabled, ...props }, ref) => {

        const classNames = [
            styles.button,
            styles[variant],
            styles[size],
            isLoading ? styles.loading : '',
            className
        ].filter(Boolean).join(' ');

        return (
            <button
                ref={ref}
                className={classNames}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading && <Loader2 className={`${styles.spinner} animate-spin`} size={16} />}
                {children}
            </button>
        );
    }
);
Button.displayName = "Button";
