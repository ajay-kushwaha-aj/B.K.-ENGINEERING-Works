const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Starting data import from physical invoice #27...");

  // 1. Create/Update Company Settings
  const company = await prisma.company.upsert({
    where: { id: "company_settings" }, // We can use a deterministic ID or find first
    create: {
      id: "company_settings",
      name: "B.K. ENGINEERING WORKS",
      gstin: "29LOWPS6575M1Z6",
      pan: "LOWPS6575M",
      address: "No.06/1, Indira Nagar, Koppa, Mandya, Karnataka-571425.",
      email: "bksinghakbk9890@gmail.com",
      phone: "9890990036",
      website: "https://bkengineering.com",
      bankName: "State Bank of India",
      bankAccount: "30001010101",
      ifsc: "SBIN0000213",
      upiId: "bksinghakbk9890@sbi",
      invoicePrefix: "BK",
      termsDefault: "1. Interest @ 18% p.a. will be charged for delayed payment beyond 30 days.\n2. Any dispute subject to local jurisdiction only.\n3. Goods once sold will not be taken back."
    },
    update: {
      name: "B.K. ENGINEERING WORKS",
      gstin: "29LOWPS6575M1Z6",
      pan: "LOWPS6575M",
      address: "No.06/1, Indira Nagar, Koppa, Mandya, Karnataka-571425.",
      email: "bksinghakbk9890@gmail.com",
      phone: "9890990036",
      website: "https://bkengineering.com",
      bankName: "State Bank of India",
      bankAccount: "30001010101",
      ifsc: "SBIN0000213",
      upiId: "bksinghakbk9890@sbi",
      invoicePrefix: "BK",
      termsDefault: "1. Interest @ 18% p.a. will be charged for delayed payment beyond 30 days.\n2. Any dispute subject to local jurisdiction only.\n3. Goods once sold will not be taken back."
    }
  });
  console.log("Company settings updated:", company.name);

  // 2. Create/Update Customer Profile
  const customer = await prisma.customer.upsert({
    where: { id: "cust_jk_enterprises" },
    create: {
      id: "cust_jk_enterprises",
      name: "JK Enterprises Sugar & Ltd",
      companyName: "JK Enterprises Sugar & Ltd",
      gstin: "29AARFJ2351E1Z8",
      pan: "AARFJ2351E",
      phone: "+91 9890990036",
      email: "jkenterprises@gmail.com",
      state: "Karnataka",
      address: "mannapur to Curtorgi Road, yargal B.K Tq: Sindagi Dist Vijayapur",
      pinCode: "586123",
      contactPerson: "Manager",
      notes: "Imported from physical invoice #27",
      status: "ACTIVE"
    },
    update: {
      name: "JK Enterprises Sugar & Ltd",
      companyName: "JK Enterprises Sugar & Ltd",
      gstin: "29AARFJ2351E1Z8",
      pan: "AARFJ2351E",
      phone: "+91 9890990036",
      email: "jkenterprises@gmail.com",
      state: "Karnataka",
      address: "mannapur to Curtorgi Road, yargal B.K Tq: Sindagi Dist Vijayapur",
      pinCode: "586123",
      contactPerson: "Manager",
      notes: "Imported from physical invoice #27"
    }
  });
  console.log("Customer profile updated:", customer.name);

  // 3. Create Invoice #27
  const invoiceNumber = "BK-2025-000027";
  const existingInvoice = await prisma.invoice.findUnique({
    where: { invoiceNumber }
  });

  if (existingInvoice) {
    // Delete existing invoice items first to prevent duplicates
    await prisma.invoiceItem.deleteMany({
      where: { invoiceId: existingInvoice.id }
    });
    await prisma.invoice.delete({
      where: { id: existingInvoice.id }
    });
    console.log("Deleted existing invoice to re-insert clean values.");
  }

  const invoice = await prisma.invoice.create({
    data: {
      id: "inv_27",
      invoiceNumber,
      customerId: customer.id,
      invoiceDate: new Date("2025-02-08T00:00:00.000Z"),
      dueDate: new Date("2025-03-10T00:00:00.000Z"),
      subTotal: 1596117.70,
      discountTotal: 0.00,
      cgstTotal: 175183.65,
      sgstTotal: 175183.65,
      igstTotal: 0.00,
      grandTotal: 1946485.00,
      amountInWords: "Nineteen Lakh Forty Six Thousand Four Hundred and Eighty Five Rupees Only",
      notes: "Imported from handwritten Bill No. 27",
      terms: company.termsDefault,
      status: "FINAL",
      paymentStatus: "UNPAID",
      items: {
        create: [
          {
            id: "item_27_1",
            description: "Industrial Engineering Works / MS Pipeline Fabrication",
            qty: 1,
            unit: "Nos",
            rate: 1596117.70,
            discount: 0.00,
            gstPercent: 18,
            cgst: 175183.65,
            sgst: 175183.65,
            igst: 0.00,
            amount: 1946485.00
          }
        ]
      }
    }
  });

  console.log("Invoice #27 imported successfully!");
}

main()
  .catch((e) => {
    console.error("Error executing db script:", e.message);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
