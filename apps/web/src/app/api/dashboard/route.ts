import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockDb, useMockDb } from "@/lib/mock-db";

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

    if (useMockDb()) {
      const invoices = mockDb.getInvoices();
      const payments = mockDb.getPayments();

      // Today's sales
      const todaysSales = invoices
        .filter((i) => {
          const d = new Date(i.invoiceDate);
          return d >= todayStart && d <= todayEnd && i.status !== "CANCELLED";
        })
        .reduce((sum, i) => sum + i.grandTotal, 0);

      // Today's collections
      const todaysCollections = payments
        .filter((p) => {
          const d = new Date(p.paymentDate);
          return d >= todayStart && d <= todayEnd;
        })
        .reduce((sum, p) => sum + p.amount, 0);

      // Monthly sales
      const monthlySales = invoices
        .filter((i) => {
          const d = new Date(i.invoiceDate);
          return d >= monthStart && d <= todayEnd && i.status !== "CANCELLED";
        })
        .reduce((sum, i) => sum + i.grandTotal, 0);

      // Pending / outstanding
      const pendingInvoices = invoices.filter(
        (i) =>
          i.status !== "CANCELLED" &&
          (i.paymentStatus === "UNPAID" || i.paymentStatus === "PARTIAL")
      );
      const pendingCount = pendingInvoices.length;
      const outstandingAmount = pendingInvoices.reduce((sum, i) => {
        const paid = mockDb.getTotalPaidForInvoice(i.id);
        return sum + (i.grandTotal - paid);
      }, 0);

      // Monthly chart data (last 6 months)
      const chartData = [];
      for (let m = 5; m >= 0; m--) {
        const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
        const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
        const mLabel = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });
        const sales = invoices
          .filter((i) => {
            const id = new Date(i.invoiceDate);
            return id >= d && id <= mEnd && i.status !== "CANCELLED";
          })
          .reduce((sum, i) => sum + i.grandTotal, 0);
        const collections = payments
          .filter((p) => {
            const pd = new Date(p.paymentDate);
            return pd >= d && pd <= mEnd;
          })
          .reduce((sum, p) => sum + p.amount, 0);
        chartData.push({ month: mLabel, sales, collections });
      }

      // Recent invoices (last 5)
      const recentInvoices = [...invoices]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5)
        .map((inv) => ({
          ...inv,
          customer: mockDb.getCustomerById(inv.customerId),
        }));

      // Total invoices count & total revenue
      const activeInvoices = invoices.filter((i) => i.status !== "CANCELLED");
      const totalRevenue = activeInvoices.reduce((sum, i) => sum + i.grandTotal, 0);

      // Top customers by total invoice value
      const customerTotals: Record<string, { id: string; name: string; total: number }> = {};
      activeInvoices.forEach((inv) => {
        const cust = mockDb.getCustomerById(inv.customerId);
        const key = inv.customerId;
        if (!customerTotals[key]) customerTotals[key] = { id: key, name: cust?.companyName || cust?.name || "—", total: 0 };
        customerTotals[key].total += inv.grandTotal;
      });
      const topCustomers = Object.values(customerTotals).sort((a, b) => b.total - a.total).slice(0, 5);

      // Top products by quantity sold
      const productTotals: Record<string, { id: string; name: string; qty: number; revenue: number }> = {};
      activeInvoices.forEach((inv) => {
        const items = Array.isArray(inv.items) ? inv.items : [];
        items.forEach((item: any) => {
          const key = item.productId || item.description;
          const prod = item.productId ? mockDb.getProductById(item.productId) : null;
          if (!productTotals[key]) productTotals[key] = { id: key, name: prod?.name || item.description || "—", qty: 0, revenue: 0 };
          productTotals[key].qty += Number(item.qty || 0);
          productTotals[key].revenue += Number(item.amount || 0);
        });
      });
      const topProducts = Object.values(productTotals).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

      // Low stock products alert
      const lowStockProducts = mockDb.getProducts()
        .filter((p) => p.status === "ACTIVE" && Number(p.stockQty || 0) < Number(p.minStock || 0))
        .map((p) => ({ id: p.id, name: p.name, stockQty: p.stockQty, minStock: p.minStock }));

      // Monthly expenses sum
      const expenseStartOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const monthlyExpenses = mockDb.getExpenses()
        .filter((e) => new Date(e.date) >= expenseStartOfMonth)
        .reduce((sum, e) => sum + e.amount, 0);

      // Payroll stats (mock DB)
      const currentMonthNum = now.getMonth() + 1;
      const currentYearNum = now.getFullYear();
      const currentMonthSlips = mockDb.getSalarySlips().filter(s => s.month === currentMonthNum && s.year === currentYearNum);
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

      const todayStr = now.toDateString();
      const mockStore = global as any;
      const workersOnLeaveToday = mockDb.getWorkers().filter(w => {
        if (w.status === "ON_LEAVE" || w.status === "TERMINATED") return true;
        const att = (mockStore.mockAttendance || []).find((a: any) => 
          a.workerId === w.id && new Date(a.date).toDateString() === todayStr
        );
        return att && (att.status === "ABSENT" || att.status === "LEAVE");
      }).length;

      return NextResponse.json({
        todaysSales,
        todaysCollections,
        monthlySales,
        pendingCount,
        outstandingAmount,
        totalRevenue,
        totalInvoices: activeInvoices.length,
        chartData,
        recentInvoices,
        topCustomers,
        topProducts,
        lowStockProducts,
        monthlyExpenses,
        payrollPaid,
        payrollPending,
        workersOnLeaveToday,
      });
    }


    // ---- Real DB path ----

    // Today's sales
    const todaysSalesResult = await prisma.invoice.aggregate({
      _sum: { grandTotal: true },
      where: {
        invoiceDate: { gte: todayStart, lte: todayEnd },
        status: { not: "CANCELLED" },
      },
    });
    const todaysSales = Number(todaysSalesResult._sum.grandTotal || 0);

    // Today's collections
    const todaysCollectionsResult = await prisma.payment.aggregate({
      _sum: { amount: true },
      where: {
        paymentDate: { gte: todayStart, lte: todayEnd },
      },
    });
    const todaysCollections = Number(todaysCollectionsResult._sum.amount || 0);

    // Monthly sales
    const monthlySalesResult = await prisma.invoice.aggregate({
      _sum: { grandTotal: true },
      where: {
        invoiceDate: { gte: monthStart, lte: todayEnd },
        status: { not: "CANCELLED" },
      },
    });
    const monthlySales = Number(monthlySalesResult._sum.grandTotal || 0);

    // Pending count & outstanding
    const pendingInvoices = await prisma.invoice.findMany({
      where: {
        status: { not: "CANCELLED" },
        paymentStatus: { in: ["UNPAID", "PARTIAL"] },
      },
      include: { payments: true },
    });
    const pendingCount = pendingInvoices.length;
    const outstandingAmount = pendingInvoices.reduce((sum, inv) => {
      const paid = inv.payments.reduce((s, p) => s + Number(p.amount), 0);
      return sum + (Number(inv.grandTotal) - paid);
    }, 0);

    // Total revenue
    const totalRevenueResult = await prisma.invoice.aggregate({
      _sum: { grandTotal: true },
      _count: true,
      where: { status: { not: "CANCELLED" } },
    });
    const totalRevenue = Number(totalRevenueResult._sum.grandTotal || 0);
    const totalInvoices = totalRevenueResult._count;

    // Monthly chart (last 6 months)
    const chartData = [];
    for (let m = 5; m >= 0; m--) {
      const d = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const mEnd = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999);
      const mLabel = d.toLocaleDateString("en-IN", { month: "short", year: "2-digit" });

      const salesAgg = await prisma.invoice.aggregate({
        _sum: { grandTotal: true },
        where: {
          invoiceDate: { gte: d, lte: mEnd },
          status: { not: "CANCELLED" },
        },
      });
      const collectionsAgg = await prisma.payment.aggregate({
        _sum: { amount: true },
        where: { paymentDate: { gte: d, lte: mEnd } },
      });
      chartData.push({
        month: mLabel,
        sales: Number(salesAgg._sum.grandTotal || 0),
        collections: Number(collectionsAgg._sum.amount || 0),
      });
    }

    // Recent invoices
    const recentInvoices = await prisma.invoice.findMany({
      orderBy: { createdAt: "desc" },
      take: 5,
      include: { customer: true },
    });

    // Top customers (real DB)
    const allInvoicesForTop = await prisma.invoice.findMany({
      where: { status: { not: "CANCELLED" } },
      include: { customer: true, items: { include: { product: true } } },
    });
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
    const allActiveProducts = await prisma.product.findMany({ where: { status: "ACTIVE" } });
    const lowStockProducts = allActiveProducts
      .filter((p) => Number(p.stockQty) < Number(p.minStock))
      .map((p) => ({ id: p.id, name: p.name, stockQty: Number(p.stockQty), minStock: Number(p.minStock) }));

    // Monthly expenses (real DB)
    const expenseStartOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const monthlyExpensesResult = await prisma.expense.aggregate({
      _sum: { amount: true },
      where: { date: { gte: expenseStartOfMonth } }
    });
    const monthlyExpenses = Number(monthlyExpensesResult._sum.amount || 0);

    // Payroll stats (real DB)
    const currentMonthNum = now.getMonth() + 1;
    const currentYearNum = now.getFullYear();
    const currentMonthSlips = await prisma.salarySlip.findMany({
      where: { month: currentMonthNum, year: currentYearNum }
    });
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

    const leaveAttendance = await prisma.attendance.findMany({
      where: {
        date: { gte: todayStart, lte: todayEnd },
        status: { in: ["ABSENT", "LEAVE"] }
      }
    });
    const inactiveWorkers = await prisma.worker.count({
      where: { status: "ON_LEAVE" }
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
    });
  } catch (error: any) {

    console.error("Dashboard API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
