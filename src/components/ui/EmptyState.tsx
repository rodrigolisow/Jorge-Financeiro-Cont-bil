import React from 'react';
import { Button } from './Button';
import { PackageOpen } from 'lucide-react';

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
        <div className="flex flex-col items-center justify-center p-8 sm:p-12 text-center rounded-lg border border-dashed border-slate-300 bg-slate-50">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-slate-100 mb-4 text-slate-400">
                <Icon size={24} />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-1">{title}</h3>
            <p className="text-sm text-slate-500 max-w-sm mb-6">{description}</p>

            {action ? (
                action
            ) : (
                actionLabel && onAction && (
                    <Button variant="primary" onClick={onAction}>
                        {actionLabel}
                    </Button>
                )
            )}
        </div>
    );
};
