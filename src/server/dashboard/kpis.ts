import { prisma } from "@/lib/prisma";
import { FinancialTransactionStatus, FinancialTransactionType, AccountingIssueStatus } from "@prisma/client";

export type KPIData = {
    income: {
        value: number;
        trend: number; // Percentage change vs previous month
    };
    expense: {
        value: number;
        trend: number;
    };
    balance: {
        value: number;
    };
    pendingIssues: {
        count: number;
    };
};

export async function getDashboardKPIs(): Promise<KPIData> {
    const now = new Date();

    // Current Month Range
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    // End of month is day 0 of next month
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Previous Month Range
    const startOfPrevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

    // Helper to fetch sums
    const getSum = async (
        type: FinancialTransactionType,
        startDate: Date,
        endDate: Date
    ) => {
        const result = await prisma.financialTransaction.aggregate({
            _sum: { amount: true },
            where: {
                type,
                status: FinancialTransactionStatus.SETTLED,
                settlementDate: { gte: startDate, lte: endDate },
            },
        });
        return Number(result._sum.amount ?? 0);
    };

    // 1. Income
    const incomeCurrent = await getSum(FinancialTransactionType.INCOME, startOfMonth, endOfMonth);
    const incomePrev = await getSum(FinancialTransactionType.INCOME, startOfPrevMonth, endOfPrevMonth);

    // 2. Expense
    const expenseCurrent = await getSum(FinancialTransactionType.EXPENSE, startOfMonth, endOfMonth);
    const expensePrev = await getSum(FinancialTransactionType.EXPENSE, startOfPrevMonth, endOfPrevMonth);

    // 3. Balance (All time settled)
    // Total Income All Time
    const totalIncomeAllTime = await prisma.financialTransaction.aggregate({
        _sum: { amount: true },
        where: {
            type: FinancialTransactionType.INCOME,
            status: FinancialTransactionStatus.SETTLED,
        },
    });
    // Total Expense All Time
    const totalExpenseAllTime = await prisma.financialTransaction.aggregate({
        _sum: { amount: true },
        where: {
            type: FinancialTransactionType.EXPENSE,
            status: FinancialTransactionStatus.SETTLED,
        },
    });

    const balanceValue = Number(totalIncomeAllTime._sum.amount ?? 0) - Number(totalExpenseAllTime._sum.amount ?? 0);

    // 4. Pending Issues
    const pendingCount = await prisma.accountingIssue.count({
        where: { status: AccountingIssueStatus.OPEN },
    });

    // Calculate trends
    const calculateTrend = (current: number, prev: number) => {
        if (prev === 0) return current > 0 ? 100 : 0;
        return ((current - prev) / prev) * 100;
    };

    return {
        income: {
            value: incomeCurrent,
            trend: calculateTrend(incomeCurrent, incomePrev),
        },
        expense: {
            value: expenseCurrent,
            trend: calculateTrend(expenseCurrent, expensePrev),
        },
        balance: {
            value: balanceValue,
        },
        pendingIssues: {
            count: pendingCount,
        },
    };
}
