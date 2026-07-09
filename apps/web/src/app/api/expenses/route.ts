import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { mockDb, useMockDb } from "@/lib/mock-db";

export async function GET() {
  try {
    if (useMockDb()) {
      return NextResponse.json(mockDb.getExpenses());
    }
    const expenses = await prisma.expense.findMany({
      orderBy: { date: "desc" },
    });
    return NextResponse.json(expenses);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { category, amount, date, notes } = json;

    if (!category || amount === undefined) {
      return NextResponse.json({ error: "category and amount are required" }, { status: 400 });
    }

    if (useMockDb()) {
      const expense = mockDb.addExpense({
        category,
        amount: Number(amount),
        date: date || new Date().toISOString().split("T")[0],
        notes: notes || null,
      });
      return NextResponse.json(expense, { status: 201 });
    }

    const expense = await prisma.expense.create({
      data: {
        category,
        amount: Number(amount),
        date: new Date(date || new Date()),
        notes: notes || null,
      },
    });

    return NextResponse.json(expense, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
