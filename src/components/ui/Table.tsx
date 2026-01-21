import React from 'react';
import styles from './Table.module.css';

export const Table = ({ className = '', children, ...props }: React.TableHTMLAttributes<HTMLTableElement>) => (
    <div className={styles.tableContainer}>
        <table className={`${styles.table} ${className}`} {...props}>
            {children}
        </table>
    </div>
);

export const TableHeader = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <thead className={`${styles.header} ${className}`} {...props}>
        {children}
    </thead>
);

export const TableBody = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLTableSectionElement>) => (
    <tbody className={className} {...props}>
        {children}
    </tbody>
);

export const TableRow = ({ className = '', children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) => (
    <tr className={`${styles.row} ${className}`} {...props}>
        {children}
    </tr>
);

export const TableHead = ({ className = '', children, ...props }: React.ThHTMLAttributes<HTMLTableCellElement>) => (
    <th className={`${styles.headCell} ${className}`} {...props}>
        {children}
    </th>
);

export const TableCell = ({ className = '', children, ...props }: React.TdHTMLAttributes<HTMLTableCellElement>) => (
    <td className={`${styles.cell} ${className}`} {...props}>
        {children}
    </td>
);
