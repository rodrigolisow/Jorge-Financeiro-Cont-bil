import React from 'react';
import styles from './Input.module.css'; // Reusing Input styles for consistency

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    label?: string;
    error?: string;
    options?: { label: string; value: string | number }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
    ({ className = '', label, error, options, children, id, ...props }, ref) => {
        const selectId = id || React.useId();

        return (
            <div className={`${styles.inputWrapper} ${className}`}>
                {label && (
                    <label htmlFor={selectId} className={styles.label}>
                        {label}
                    </label>
                )}
                <select
                    id={selectId}
                    ref={ref}
                    className={`${styles.input} ${error ? styles.error : ''}`}
                    style={{ appearance: 'none', backgroundImage: 'url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3e%3cpolyline points=\'6 9 12 15 18 9\'%3e%3c/polyline%3e%3c/svg%3e")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 0.7rem center', backgroundSize: '1em' }}
                    {...props}
                >
                    {options ? options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                            {opt.label}
                        </option>
                    )) : children}
                </select>
                {error && <span className={styles.errorMessage}>{error}</span>}
            </div>
        );
    }
);
Select.displayName = "Select";
