import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    
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
