import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function startOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}
function endOfDay(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
}
function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

export async function GET() {
  try {
    const now = new Date();
    const todayStart = startOfDay(now);
    const todayEnd = endOfDay(now);
    const monthStart = startOfMonth(now);

    


    // ---- Real DB path ----

    const currentMonthNum = now.getMonth() + 1;
    const currentYearNum = now.getFullYear();
    const expenseStartOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Construct chart date ranges
    const chartRanges = [];
    for (let m = 5; m >= 0; m--) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const mLabel = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
      chartRanges.push({ start: d, end: mEnd, label: mLabel });
    }

    const [
      todaysSalesResult,
      todaysCollectionsResult,
      monthlySalesResult,
      pendingInvoices,
      totalRevenueResult,
      recentInvoices,
      allInvoicesForTop,
      allActiveProducts,
      monthlyExpensesResult,
      currentMonthSlips,
      leaveAttendance,
      inactiveWorkers,
      totalWorkersCount,
      presentWorkersCount,
      activeSitesCount,
      sitesList,
      chartS1, chartC1,
      chartS2, chartC2,
      chartS3, chartC3,
      chartS4, chartC4,
      chartS5, chartC5,
      chartS6, chartC6,
    ] = await Promise.all([
      // 1. Today's sales
      prisma.invoice.aggregate({
        _sum: { grandTotal: true },
        where: {
          invoiceDate: { gte: todayStart, lte: todayEnd },
          status: { not: "CANCELLED" },
        },
      }),
      // 2. Today's collections
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { paymentDate: { gte: todayStart, lte: todayEnd } },
      }),
      // 3. Monthly sales
      prisma.invoice.aggregate({
        _sum: { grandTotal: true },
        where: {
          invoiceDate: { gte: monthStart, lte: todayEnd },
          status: { not: "CANCELLED" },
        },
      }),
      // 4. Pending count & outstanding
      prisma.invoice.findMany({
        where: {
          status: { not: "CANCELLED" },
          paymentStatus: { in: ["UNPAID", "PARTIAL"] },
        },
        include: { payments: true },
      }),
      // 5. Total revenue
      prisma.invoice.aggregate({
        _sum: { grandTotal: true },
        _count: true,
        where: { status: { not: "CANCELLED" } },
      }),
      // 6. Recent invoices
      prisma.invoice.findMany({
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { customer: true },
      }),
      // 7. Top customers & products
      prisma.invoice.findMany({
        where: { status: { not: "CANCELLED" } },
        include: { customer: true, items: { include: { product: true } } },
      }),
      // 8. Low stock alert
      prisma.product.findMany({ where: { status: "ACTIVE" } }),
      // 9. Monthly expenses
      prisma.expense.aggregate({
        _sum: { amount: true },
        where: { date: { gte: expenseStartOfMonth } }
      }),
      // 10. Payroll stats
      prisma.salarySlip.findMany({
        where: { month: currentMonthNum, year: currentYearNum }
      }),
      // 11. Leave attendance
      prisma.attendance.findMany({
        where: {
          date: { gte: todayStart, lte: todayEnd },
          status: { in: ["ABSENT", "LEAVE"] }
        }
      }),
      // 12. Inactive workers count
      prisma.worker.count({
        where: { status: "ON_LEAVE" }
      }),
      // 13. Total workers count
      prisma.worker.count(),
      // 14. Present workers today count
      prisma.attendance.count({
        where: { date: { gte: todayStart, lte: todayEnd }, status: "PRESENT" }
      }),
      // 15. Active sites count
      prisma.site.count(),
      // 16. Real sites list from DB
      prisma.site.findMany({
        take: 5,
        include: { contract: true },
        orderBy: { createdAt: "desc" }
      }),

      // 6 month chart queries
      prisma.invoice.aggregate({
        _sum: { grandTotal: true },
        where: { invoiceDate: { gte: chartRanges[0].start, lte: chartRanges[0].end }, status: { not: "CANCELLED" } },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { paymentDate: { gte: chartRanges[0].start, lte: chartRanges[0].end } },
      }),
      prisma.invoice.aggregate({
        _sum: { grandTotal: true },
        where: { invoiceDate: { gte: chartRanges[1].start, lte: chartRanges[1].end }, status: { not: "CANCELLED" } },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { paymentDate: { gte: chartRanges[1].start, lte: chartRanges[1].end } },
      }),
      prisma.invoice.aggregate({
        _sum: { grandTotal: true },
        where: { invoiceDate: { gte: chartRanges[2].start, lte: chartRanges[2].end }, status: { not: "CANCELLED" } },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { paymentDate: { gte: chartRanges[2].start, lte: chartRanges[2].end } },
      }),
      prisma.invoice.aggregate({
        _sum: { grandTotal: true },
        where: { invoiceDate: { gte: chartRanges[3].start, lte: chartRanges[3].end }, status: { not: "CANCELLED" } },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { paymentDate: { gte: chartRanges[3].start, lte: chartRanges[3].end } },
      }),
      prisma.invoice.aggregate({
        _sum: { grandTotal: true },
        where: { invoiceDate: { gte: chartRanges[4].start, lte: chartRanges[4].end }, status: { not: "CANCELLED" } },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { paymentDate: { gte: chartRanges[4].start, lte: chartRanges[4].end } },
      }),
      prisma.invoice.aggregate({
        _sum: { grandTotal: true },
        where: { invoiceDate: { gte: chartRanges[5].start, lte: chartRanges[5].end }, status: { not: "CANCELLED" } },
      }),
      prisma.payment.aggregate({
        _sum: { amount: true },
        where: { paymentDate: { gte: chartRanges[5].start, lte: chartRanges[5].end } },
      }),
    ]);

    const todaysSales = Number(todaysSalesResult._sum.grandTotal || 0);
    const todaysCollections = Number(todaysCollectionsResult._sum.amount || 0);
    const monthlySales = Number(monthlySalesResult._sum.grandTotal || 0);

    const pendingCount = pendingInvoices.length;
    const outstandingAmount = pendingInvoices.reduce((sum, inv) => {
      const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
      return sum + (Number(inv.grandTotal) - paid);
    }, 0);

    const totalRevenue = Number(totalRevenueResult._sum.grandTotal || 0);
    const totalInvoices = totalRevenueResult._count;

    // Assemble chart data
    const chartData = [
      { month: chartRanges[0].label, sales: Number(chartS1._sum.grandTotal || 0), collections: Number(chartC1._sum.amount || 0) },
      { month: chartRanges[1].label, sales: Number(chartS2._sum.grandTotal || 0), collections: Number(chartC2._sum.amount || 0) },
      { month: chartRanges[2].label, sales: Number(chartS3._sum.grandTotal || 0), collections: Number(chartC3._sum.amount || 0) },
      { month: chartRanges[3].label, sales: Number(chartS4._sum.grandTotal || 0), collections: Number(chartC4._sum.amount || 0) },
      { month: chartRanges[4].label, sales: Number(chartS5._sum.grandTotal || 0), collections: Number(chartC5._sum.amount || 0) },
      { month: chartRanges[5].label, sales: Number(chartS6._sum.grandTotal || 0), collections: Number(chartC6._sum.amount || 0) },
    ];

    // Top customers (real DB)
    const customerTotals: Record<string, { id: string; name: string; total: number }> = {};
    allInvoicesForTop.forEach((inv) => {
      const key = inv.customerId;
      if (!customerTotals[key]) customerTotals[key] = { id: key, name: inv.customer.companyName || inv.customer.name, total: 0 };
      customerTotals[key].total += Number(inv.grandTotal);
    });
    const topCustomers = Object.values(customerTotals).sort((a, b) => b.total - a.total).slice(0, 5);

    const productTotals: Record<string, { id: string; name: string; qty: number; revenue: number }> = {};
    allInvoicesForTop.forEach((inv) => {
      inv.items.forEach((item) => {
        const key = item.productId || item.description;
        if (!productTotals[key]) productTotals[key] = { id: key, name: item.product?.name || item.description, qty: 0, revenue: 0 };
        productTotals[key].qty += Number(item.qty);
        productTotals[key].revenue += Number(item.amount);
      });
    });
    const topProducts = Object.values(productTotals).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

    // Low stock products alert (real DB)
    const lowStockProducts = allActiveProducts
      .filter((p) => Number(p.stockQty) < Number(p.minStock))
      .map((p) => ({ id: p.id, name: p.name, stockQty: Number(p.stockQty), minStock: Number(p.minStock) }));

    // Monthly expenses (real DB)
    const monthlyExpenses = Number(monthlyExpensesResult._sum.amount || 0);

    // Payroll stats (real DB)
    let payrollPaid = 0;
    let payrollPending = 0;
    currentMonthSlips.forEach(s => {
      const net = Number(s.netPay);
      if (s.paymentStatus === "PAID") {
        payrollPaid += net;
      } else if (s.paymentStatus === "PARTIAL") {
        payrollPaid += net / 2;
        payrollPending += net / 2;
      } else {
        payrollPending += net;
      }
    });

    const workersOnLeaveToday = leaveAttendance.length + inactiveWorkers;

    return NextResponse.json({
      todaysSales,
      todaysCollections,
      monthlySales,
      pendingCount,
      outstandingAmount,
      totalRevenue,
      totalInvoices,
      chartData,
      recentInvoices,
      topCustomers,
      topProducts,
      lowStockProducts,
      monthlyExpenses,
      payrollPaid,
      payrollPending,
      workersOnLeaveToday,
      totalWorkersCount,
      presentWorkersCount,
      activeSitesCount,
      sitesList,
    });
  } catch (error: any) {

    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
