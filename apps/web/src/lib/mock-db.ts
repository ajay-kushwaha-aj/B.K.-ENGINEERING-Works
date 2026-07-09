// In-memory mock database fallback for local sandbox testing
export interface MockCustomer {
  id: string;
  name: string;
  companyName: string | null;
  gstin: string | null;
  pan: string | null;
  phone: string | null;
  email: string | null;
  state: string;
  address: string | null;
  pinCode: string | null;
  contactPerson: string | null;
  notes: string | null;
  status: "ACTIVE" | "INACTIVE" | "BLOCKED";
  createdAt: string;
  updatedAt: string;
}

export interface MockProduct {
  id: string;
  name: string;
  description: string | null;
  hsnCode: string | null;
  gstPercent: number;
  unit: string;
  price: number;
  purchasePrice: number | null;
  weight: number | null;
  stockQty: number;
  minStock: number;
  category: string | null;
  imageUrl: string | null;
  status: "ACTIVE" | "INACTIVE";
  createdAt: string;
  updatedAt: string;
}

export interface MockInvoiceItem {
  id: string;
  productId: string | null;
  description: string;
  qty: number;
  unit: string;
  rate: number;
  discount: number;
  gstPercent: number;
  cgst: number;
  sgst: number;
  igst: number;
  amount: number;
}

export interface MockInvoice {
  id: string;
  invoiceNumber: string;
  customerId: string;
  invoiceDate: string;
  dueDate: string | null;
  items: MockInvoiceItem[];
  subTotal: number;
  discountTotal: number;
  cgstTotal: number;
  sgstTotal: number;
  igstTotal: number;
  grandTotal: number;
  amountInWords: string;
  notes: string | null;
  terms: string | null;
  status: "DRAFT" | "FINAL" | "CANCELLED";
  paymentStatus: "PAID" | "UNPAID" | "PARTIAL";
  cancelledAt: string | null;
  quotationId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MockPayment {
  id: string;
  invoiceId: string;
  amount: number;
  mode: "CASH" | "CHEQUE" | "BANK_TRANSFER" | "UPI" | "ONLINE";
  transactionId: string | null;
  paymentDate: string;
  createdAt: string;
}

export interface MockQuotation {
  id: string;
  quotationNumber: string;
  customerId: string;
  date: string;
  items: any; // mirrors InvoiceItem shape
  grandTotal: number;
  status: "DRAFT" | "SENT" | "APPROVED" | "REJECTED" | "CONVERTED";
  createdAt: string;
}

export interface MockVendor {
  id: string;
  name: string;
  gstin: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  bankDetails: string | null;
  createdAt: string;
}

export interface MockPurchase {
  id: string;
  vendorId: string;
  purchaseDate: string;
  items: any;
  gstTotal: number;
  grandTotal: number;
  paymentStatus: "PAID" | "UNPAID" | "PARTIAL";
  createdAt: string;
}

export interface MockExpense {
  id: string;
  category: string;
  amount: number;
  date: string;
  notes: string | null;
  createdAt: string;
}

export interface MockWorkOrder {
  id: string;
  woNumber: string;
  customerId: string;
  siteName: string;
  location: string | null;
  startDate: string | null;
  completionDate: string | null;
  projectManager: string | null;
  description: string | null;
  status: "OPEN" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED";
  estimatedCost: number | null;
  actualCost: number | null;
  createdAt: string;
}

export interface MockStockMovement {
  id: string;
  productId: string;
  type: "IN" | "OUT" | "ADJUSTMENT" | "OPENING";
  qty: number;
  reason: string | null;
  createdAt: string;
}

export interface MockDocument {
  id: string;
  customerId: string | null;
  type: string;
  fileUrl: string;
  fileName: string;
  uploadedAt: string;
}

export interface MockWorker {
  id: string;
  name: string;
  fatherName: string | null;
  designation: string;
  department: string | null;
  phone: string;
  email: string | null;
  address: string | null;
  aadharNumber: string | null;
  panNumber: string | null;
  photoUrl: string | null;
  idProofUrl: string | null;
  joiningDate: string;
  status: "ACTIVE" | "INACTIVE" | "ON_LEAVE" | "TERMINATED";
  salaryType: "MONTHLY" | "DAILY" | "CONTRACT";
  basicSalary: number;
  bankName: string | null;
  bankAccount: string | null;
  ifsc: string | null;
  upiId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MockAttendance {
  id: string;
  workerId: string;
  date: string;
  status: "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE" | "HOLIDAY";
  overtimeHours: number;
  notes: string | null;
  createdAt: string;
}

export interface MockSalarySlip {
  id: string;
  slipNumber: string;
  workerId: string;
  month: number;
  year: number;
  daysPresent: number;
  daysAbsent: number;
  overtimeHours: number;
  basicSalary: number;
  overtimeAmount: number;
  allowances: number;
  bonus: number;
  deductions: number;
  deductionNotes: string | null;
  netPay: number;
  paymentStatus: "PAID" | "UNPAID" | "PARTIAL";
  paymentDate: string | null;
  paymentMode: "CASH" | "CHEQUE" | "BANK_TRANSFER" | "UPI" | "ONLINE" | null;
  generatedAt: string;
}


// Initial Sample Data
const initialCustomers: MockCustomer[] = [
  {
    id: "cust_1",
    name: "Godavari Sugar Mills",
    companyName: "Somaiya Group",
    gstin: "27AAAAA1111A1Z1",
    pan: "ABCDE1234F",
    phone: "+91 9823012345",
    email: "purchase@godavarisugar.com",
    state: "Maharashtra",
    address: "Sameerwadi, Bagalkot District",
    pinCode: "587316",
    contactPerson: "Mr. R. K. Patil",
    notes: "Primary shutdown maintenance client",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cust_2",
    name: "Baramati Agro Industries",
    companyName: "Baramati Agro Ltd.",
    gstin: "27BBBBB2222B2Z2",
    pan: "FGHIJ5678K",
    phone: "+91 9890123456",
    email: "procurement@baramatiagro.com",
    state: "Maharashtra",
    address: "Pimpali, Baramati, Pune",
    pinCode: "413102",
    contactPerson: "Mr. Suresh Pawar",
    notes: "Sugar plant erection works",
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "cust_3",
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
    status: "ACTIVE",
    createdAt: new Date("2025-02-08T00:00:00.000Z").toISOString(),
    updatedAt: new Date("2025-02-08T00:00:00.000Z").toISOString(),
  },
];

const initialProducts: MockProduct[] = [
  {
    id: "prod_1",
    name: "MS Pipeline Fabrication (Heavy Duty)",
    description: "Mild steel pipeline fabrication and laydown service per meter",
    hsnCode: "7305",
    gstPercent: 18,
    unit: "Mtr",
    price: 4500,
    purchasePrice: 3200,
    weight: 12.5,
    stockQty: 500,
    minStock: 50,
    category: "Fabrication",
    imageUrl: null,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod_2",
    name: "SS 304 Pipeline Welding Service",
    description: "Stainless steel TIG welding service per joint",
    hsnCode: "8311",
    gstPercent: 18,
    unit: "Joint",
    price: 1200,
    purchasePrice: 600,
    weight: 0.2,
    stockQty: 1000,
    minStock: 100,
    category: "Welding",
    imageUrl: null,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "prod_3",
    name: "Industrial Gear Shaft (Standard)",
    description: "Half-gear and shaft system component for plant machinery",
    hsnCode: "8483",
    gstPercent: 18,
    unit: "Nos",
    price: 25000,
    purchasePrice: 18000,
    weight: 85,
    stockQty: 15,
    minStock: 2,
    category: "Machinery",
    imageUrl: null,
    status: "ACTIVE",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const initialInvoices: MockInvoice[] = [
  {
    id: "inv_27",
    invoiceNumber: "BK-2025-000027",
    customerId: "cust_3",
    invoiceDate: "2025-02-08T00:00:00.000Z",
    dueDate: "2025-03-10T00:00:00.000Z",
    items: [
      {
        id: "item_27_1",
        productId: null,
        description: "Industrial Engineering Works / MS Pipeline Fabrication",
        qty: 1,
        unit: "Nos",
        rate: 1596117.70,
        discount: 0,
        gstPercent: 18,
        cgst: 175183.65,
        sgst: 175183.65,
        igst: 0,
        amount: 1946485.00
      }
    ],
    subTotal: 1596117.70,
    discountTotal: 0,
    cgstTotal: 175183.65,
    sgstTotal: 175183.65,
    igstTotal: 0,
    grandTotal: 1946485.00,
    amountInWords: "Nineteen Lakh Forty Six Thousand Four Hundred and Eighty Five Rupees Only",
    notes: "Imported from handwritten Bill No. 27",
    terms: "1. Payment should be made within 30 days.\n2. All disputes subject to local jurisdiction.",
    status: "FINAL",
    paymentStatus: "UNPAID",
    cancelledAt: null,
    quotationId: null,
    createdAt: new Date("2025-02-08T00:00:00.000Z").toISOString(),
    updatedAt: new Date("2025-02-08T00:00:00.000Z").toISOString(),
  }
];
const initialPayments: MockPayment[] = [];
const initialQuotations: MockQuotation[] = [];
const initialVendors: MockVendor[] = [
  {
    id: "vend_1",
    name: "Steel Authority of India Ltd (SAIL)",
    gstin: "27AAACS1234A1Z1",
    phone: "+91 22 22020101",
    email: "mumbai@sail.in",
    address: "Expression Towers, Nariman Point, Mumbai",
    bankDetails: "SBI A/C: 100020003000, IFSC: SBIN0000213",
    createdAt: new Date().toISOString(),
  }
];
const initialPurchases: MockPurchase[] = [];
const initialExpenses: MockExpense[] = [];
const initialWorkOrders: MockWorkOrder[] = [];
const initialStockMovements: MockStockMovement[] = [];
const initialDocuments: MockDocument[] = [];

const initialWorkers: MockWorker[] = [
  {
    id: "work_1",
    name: "Ramesh Kumar",
    fatherName: "Sohan Lal",
    designation: "Welder",
    department: "Fabrication",
    phone: "+91 9876543211",
    email: "ramesh.welder@gmail.com",
    address: "Room 10, Chawl No 3, Dharavi, Mumbai",
    aadharNumber: "123456789012",
    panNumber: "ABCDE1234E",
    photoUrl: null,
    idProofUrl: null,
    joiningDate: "2025-01-15T00:00:00.000Z",
    status: "ACTIVE",
    salaryType: "DAILY",
    basicSalary: 800,
    bankName: "State Bank of India",
    bankAccount: "30001010101",
    ifsc: "SBIN0000213",
    upiId: "ramesh@upi",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "work_2",
    name: "Sunil Verma",
    fatherName: "Vijay Verma",
    designation: "Supervisor",
    department: "Erection",
    phone: "+91 9876543212",
    email: "sunil.verma@bk.com",
    address: "B-202, Sector 15, Vashi, Navi Mumbai",
    aadharNumber: "987654321098",
    panNumber: "XYZWV9876A",
    photoUrl: null,
    idProofUrl: null,
    joiningDate: "2024-06-01T00:00:00.000Z",
    status: "ACTIVE",
    salaryType: "MONTHLY",
    basicSalary: 28000,
    bankName: "HDFC Bank",
    bankAccount: "501001010202",
    ifsc: "HDFC0000060",
    upiId: "sunilverma@hdfc",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

// Global stores mapped to NodeJS global to persist across Next.js dev server reloads
const globalStore = global as any;
if (!globalStore.mockCustomers) globalStore.mockCustomers = initialCustomers;
if (!globalStore.mockProducts) globalStore.mockProducts = initialProducts;
if (!globalStore.mockInvoices) globalStore.mockInvoices = initialInvoices;
if (!globalStore.mockPayments) globalStore.mockPayments = initialPayments;
if (!globalStore.mockQuotations) globalStore.mockQuotations = initialQuotations;
if (!globalStore.mockVendors) globalStore.mockVendors = initialVendors;
if (!globalStore.mockPurchases) globalStore.mockPurchases = initialPurchases;
if (!globalStore.mockExpenses) globalStore.mockExpenses = initialExpenses;
if (!globalStore.mockWorkOrders) globalStore.mockWorkOrders = initialWorkOrders;
if (!globalStore.mockStockMovements) globalStore.mockStockMovements = initialStockMovements;
if (!globalStore.mockDocuments) globalStore.mockDocuments = initialDocuments;
if (!globalStore.mockWorkers) globalStore.mockWorkers = initialWorkers;
if (!globalStore.mockAttendance) globalStore.mockAttendance = [];
if (!globalStore.mockSalarySlips) globalStore.mockSalarySlips = [];

export const mockDb = {

  getCustomers: () => globalStore.mockCustomers as MockCustomer[],
  getCustomerById: (id: string) => (globalStore.mockCustomers as MockCustomer[]).find(c => c.id === id),
  addCustomer: (customer: Omit<MockCustomer, "id" | "createdAt" | "updatedAt">) => {
    const newCust: MockCustomer = {
      ...customer,
      id: `cust_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    globalStore.mockCustomers.push(newCust);
    return newCust;
  },
  updateCustomer: (id: string, customer: Partial<MockCustomer>) => {
    const idx = globalStore.mockCustomers.findIndex((c: any) => c.id === id);
    if (idx === -1) return null;
    const updated = {
      ...globalStore.mockCustomers[idx],
      ...customer,
      updatedAt: new Date().toISOString(),
    };
    globalStore.mockCustomers[idx] = updated;
    return updated;
  },

  getProducts: () => globalStore.mockProducts as MockProduct[],
  getProductById: (id: string) => (globalStore.mockProducts as MockProduct[]).find(p => p.id === id),
  addProduct: (product: Omit<MockProduct, "id" | "createdAt" | "updatedAt">) => {
    const newProd: MockProduct = {
      ...product,
      id: `prod_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    globalStore.mockProducts.push(newProd);
    return newProd;
  },
  updateProduct: (id: string, product: Partial<MockProduct>) => {
    const idx = globalStore.mockProducts.findIndex((p: any) => p.id === id);
    if (idx === -1) return null;
    const updated = {
      ...globalStore.mockProducts[idx],
      ...product,
      updatedAt: new Date().toISOString(),
    };
    globalStore.mockProducts[idx] = updated;
    return updated;
  },

  getInvoices: () => globalStore.mockInvoices as MockInvoice[],
  getInvoiceById: (id: string) => (globalStore.mockInvoices as MockInvoice[]).find(i => i.id === id),
  addInvoice: (invoice: Omit<MockInvoice, "id" | "invoiceNumber" | "createdAt" | "updatedAt">) => {
    const seq = String(globalStore.mockInvoices.length + 1).padStart(6, "0");
    const year = new Date().getFullYear();
    const invoiceNumber = `BK-${year}-${seq}`;
    const newInv: MockInvoice = {
      ...invoice,
      id: `inv_${Date.now()}`,
      invoiceNumber,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    globalStore.mockInvoices.push(newInv);
    return newInv;
  },
  updateInvoice: (id: string, invoice: Partial<MockInvoice>) => {
    const idx = globalStore.mockInvoices.findIndex((i: any) => i.id === id);
    if (idx === -1) return null;
    const updated = {
      ...globalStore.mockInvoices[idx],
      ...invoice,
      updatedAt: new Date().toISOString(),
    };
    globalStore.mockInvoices[idx] = updated;
    return updated;
  },

  // Payment methods
  getPayments: () => globalStore.mockPayments as MockPayment[],
  getPaymentsByInvoiceId: (invoiceId: string) =>
    (globalStore.mockPayments as MockPayment[]).filter(p => p.invoiceId === invoiceId),
  addPayment: (payment: Omit<MockPayment, "id" | "createdAt">) => {
    const newPayment: MockPayment = {
      ...payment,
      id: `pay_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    globalStore.mockPayments.push(newPayment);

    // Auto-update invoice paymentStatus
    const invoice = (globalStore.mockInvoices as MockInvoice[]).find(i => i.id === payment.invoiceId);
    if (invoice) {
      const allPayments = (globalStore.mockPayments as MockPayment[]).filter(p => p.invoiceId === payment.invoiceId);
      const totalPaid = allPayments.reduce((sum: number, p: MockPayment) => sum + p.amount, 0);
      const idx = globalStore.mockInvoices.findIndex((i: any) => i.id === payment.invoiceId);
      if (idx !== -1) {
        if (totalPaid >= invoice.grandTotal) {
          globalStore.mockInvoices[idx].paymentStatus = "PAID";
        } else if (totalPaid > 0) {
          globalStore.mockInvoices[idx].paymentStatus = "PARTIAL";
        }
        globalStore.mockInvoices[idx].updatedAt = new Date().toISOString();
      }
    }
    return newPayment;
  },
  getTotalPaidForInvoice: (invoiceId: string) => {
    const payments = (globalStore.mockPayments as MockPayment[]).filter(p => p.invoiceId === invoiceId);
    return payments.reduce((sum: number, p: MockPayment) => sum + p.amount, 0);
  },

  // Quotation methods
  getQuotations: () => globalStore.mockQuotations as MockQuotation[],
  getQuotationById: (id: string) => (globalStore.mockQuotations as MockQuotation[]).find(q => q.id === id),
  addQuotation: (quotation: Omit<MockQuotation, "id" | "quotationNumber" | "createdAt">) => {
    const seq = String((globalStore.mockQuotations as MockQuotation[]).length + 1).padStart(6, "0");
    const year = new Date().getFullYear();
    const quotationNumber = `QT-${year}-${seq}`;
    const newQ: MockQuotation = {
      ...quotation,
      id: `qt_${Date.now()}`,
      quotationNumber,
      createdAt: new Date().toISOString(),
    };
    globalStore.mockQuotations.push(newQ);
    return newQ;
  },
  updateQuotation: (id: string, data: Partial<MockQuotation>) => {
    const idx = globalStore.mockQuotations.findIndex((q: any) => q.id === id);
    if (idx === -1) return null;
    globalStore.mockQuotations[idx] = { ...globalStore.mockQuotations[idx], ...data };
    return globalStore.mockQuotations[idx];
  },
  convertQuotationToInvoice: (quotationId: string) => {
    const quotation = (globalStore.mockQuotations as MockQuotation[]).find(q => q.id === quotationId);
    if (!quotation || quotation.status !== "APPROVED") return null;

    // Create invoice from quotation data
    const items = Array.isArray(quotation.items) ? quotation.items : JSON.parse(quotation.items);
    const seq = String((globalStore.mockInvoices as MockInvoice[]).length + 1).padStart(6, "0");
    const year = new Date().getFullYear();
    const invoiceNumber = `BK-${year}-${seq}`;

    const subTotal = items.reduce((s: number, i: any) => s + Number(i.amount || 0), 0);
    const cgstTotal = items.reduce((s: number, i: any) => s + Number(i.cgst || 0), 0);
    const sgstTotal = items.reduce((s: number, i: any) => s + Number(i.sgst || 0), 0);
    const igstTotal = items.reduce((s: number, i: any) => s + Number(i.igst || 0), 0);

    const newInv: MockInvoice = {
      id: `inv_${Date.now()}`,
      invoiceNumber,
      customerId: quotation.customerId,
      invoiceDate: new Date().toISOString().split("T")[0],
      dueDate: null,
      items,
      subTotal,
      discountTotal: 0,
      cgstTotal,
      sgstTotal,
      igstTotal,
      grandTotal: Number(quotation.grandTotal),
      amountInWords: "",
      notes: null,
      terms: null,
      status: "FINAL",
      paymentStatus: "UNPAID",
      cancelledAt: null,
      quotationId: quotationId,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    globalStore.mockInvoices.push(newInv);

    // Mark quotation as CONVERTED
    const idx = globalStore.mockQuotations.findIndex((q: any) => q.id === quotationId);
    if (idx !== -1) globalStore.mockQuotations[idx].status = "CONVERTED";

    return newInv;
  },

  // Vendor methods
  getVendors: () => globalStore.mockVendors as MockVendor[],
  getVendorById: (id: string) => (globalStore.mockVendors as MockVendor[]).find(v => v.id === id),
  addVendor: (vendor: Omit<MockVendor, "id" | "createdAt">) => {
    const newV: MockVendor = {
      ...vendor,
      id: `vend_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    globalStore.mockVendors.push(newV);
    return newV;
  },

  // Purchase methods
  getPurchases: () => globalStore.mockPurchases as MockPurchase[],
  addPurchase: (purchase: Omit<MockPurchase, "id" | "createdAt">) => {
    const newP: MockPurchase = {
      ...purchase,
      id: `purch_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    globalStore.mockPurchases.push(newP);
    
    // Auto-update stock quantities of line items in purchase (Stock In)
    const items = Array.isArray(purchase.items) ? purchase.items : JSON.parse(purchase.items || "[]");
    items.forEach((item: any) => {
      if (item.productId) {
        mockDb.addStockMovement({
          productId: item.productId,
          type: "IN",
          qty: Number(item.qty),
          reason: `Purchase entry ${newP.id}`,
        });
      }
    });
    return newP;
  },

  // Expense methods
  getExpenses: () => globalStore.mockExpenses as MockExpense[],
  addExpense: (expense: Omit<MockExpense, "id" | "createdAt">) => {
    const newE: MockExpense = {
      ...expense,
      id: `exp_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    globalStore.mockExpenses.push(newE);
    return newE;
  },

  // WorkOrder methods
  getWorkOrders: () => globalStore.mockWorkOrders as MockWorkOrder[],
  getWorkOrderById: (id: string) => (globalStore.mockWorkOrders as MockWorkOrder[]).find(w => w.id === id),
  addWorkOrder: (wo: Omit<MockWorkOrder, "id" | "woNumber" | "createdAt">) => {
    const seq = String((globalStore.mockWorkOrders as MockWorkOrder[]).length + 1).padStart(6, "0");
    const year = new Date().getFullYear();
    const woNumber = `WO-${year}-${seq}`;
    const newWO: MockWorkOrder = {
      ...wo,
      id: `wo_${Date.now()}`,
      woNumber,
      createdAt: new Date().toISOString(),
    };
    globalStore.mockWorkOrders.push(newWO);
    return newWO;
  },
  updateWorkOrder: (id: string, data: Partial<MockWorkOrder>) => {
    const idx = globalStore.mockWorkOrders.findIndex((w: any) => w.id === id);
    if (idx === -1) return null;
    globalStore.mockWorkOrders[idx] = { ...globalStore.mockWorkOrders[idx], ...data };
    return globalStore.mockWorkOrders[idx];
  },

  // StockMovement methods
  getStockMovements: () => globalStore.mockStockMovements as MockStockMovement[],
  getStockMovementsByProduct: (productId: string) => 
    (globalStore.mockStockMovements as MockStockMovement[]).filter(m => m.productId === productId),
  addStockMovement: (move: Omit<MockStockMovement, "id" | "createdAt">) => {
    const newMove: MockStockMovement = {
      ...move,
      id: `move_${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    globalStore.mockStockMovements.push(newMove);

    // Apply movement qty adjustment to product stockQty
    const products = globalStore.mockProducts as MockProduct[];
    const idx = products.findIndex(p => p.id === move.productId);
    if (idx !== -1) {
      const p = products[idx];
      const movementVal = Number(move.qty);
      if (move.type === "IN" || move.type === "OPENING") {
        p.stockQty = Number(p.stockQty || 0) + movementVal;
      } else if (move.type === "OUT") {
        p.stockQty = Number(p.stockQty || 0) - movementVal;
      } else if (move.type === "ADJUSTMENT") {
        p.stockQty = Number(p.stockQty || 0) + movementVal;
      }
      p.updatedAt = new Date().toISOString();
    }
    return newMove;
  },

  // Document methods
  getDocuments: () => globalStore.mockDocuments as MockDocument[],
  addDocument: (doc: Omit<MockDocument, "id" | "uploadedAt">) => {
    const newD: MockDocument = {
      ...doc,
      id: `doc_${Date.now()}`,
      uploadedAt: new Date().toISOString(),
    };
    globalStore.mockDocuments.push(newD);
    return newD;
  },
  deleteDocument: (id: string) => {
    const idx = globalStore.mockDocuments.findIndex((d: any) => d.id === id);
    if (idx === -1) return false;
    globalStore.mockDocuments.splice(idx, 1);
    return true;
  },

  // Worker methods
  getWorkers: () => globalStore.mockWorkers as MockWorker[],
  getWorkerById: (id: string) => (globalStore.mockWorkers as MockWorker[]).find(w => w.id === id),
  addWorker: (worker: Omit<MockWorker, "id" | "createdAt" | "updatedAt">) => {
    const newWorker: MockWorker = {
      ...worker,
      id: `work_${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    globalStore.mockWorkers.push(newWorker);
    return newWorker;
  },
  updateWorker: (id: string, worker: Partial<MockWorker>) => {
    const idx = globalStore.mockWorkers.findIndex((w: any) => w.id === id);
    if (idx === -1) return null;
    const updated = {
      ...globalStore.mockWorkers[idx],
      ...worker,
      updatedAt: new Date().toISOString(),
    };
    globalStore.mockWorkers[idx] = updated;
    return updated;
  },
  deleteWorker: (id: string) => {
    const idx = globalStore.mockWorkers.findIndex((w: any) => w.id === id);
    if (idx === -1) return false;
    globalStore.mockWorkers.splice(idx, 1);
    globalStore.mockAttendance = (globalStore.mockAttendance as MockAttendance[]).filter(a => a.workerId !== id);
    globalStore.mockSalarySlips = (globalStore.mockSalarySlips as MockSalarySlip[]).filter(s => s.workerId !== id);
    return true;
  },

  // Attendance methods
  getAttendance: (workerId: string, month: number, year: number) => {
    return (globalStore.mockAttendance as MockAttendance[]).filter(a => {
      const d = new Date(a.date);
      return a.workerId === workerId && (d.getMonth() + 1) === month && d.getFullYear() === year;
    });
  },
  getAttendanceForDate: (date: Date) => {
    return (globalStore.mockAttendance as MockAttendance[]).filter(a => {
      const d = new Date(a.date);
      return d.getDate() === date.getDate() &&
        d.getMonth() === date.getMonth() &&
        d.getFullYear() === date.getFullYear();
    });
  },
  saveAttendance: (data: Omit<MockAttendance, "id" | "createdAt">) => {
    const inputDate = new Date(data.date);
    const idx = (globalStore.mockAttendance as MockAttendance[]).findIndex(a => {
      const d = new Date(a.date);
      return a.workerId === data.workerId && 
        d.getDate() === inputDate.getDate() &&
        d.getMonth() === inputDate.getMonth() &&
        d.getFullYear() === inputDate.getFullYear();
    });
    if (idx !== -1) {
      globalStore.mockAttendance[idx] = {
        ...globalStore.mockAttendance[idx],
        status: data.status,
        overtimeHours: Number(data.overtimeHours),
        notes: data.notes || null,
      };
      return globalStore.mockAttendance[idx];
    } else {
      const newAtt: MockAttendance = {
        ...data,
        id: `att_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        overtimeHours: Number(data.overtimeHours),
        createdAt: new Date().toISOString(),
      };
      globalStore.mockAttendance.push(newAtt);
      return newAtt;
    }
  },
  bulkMarkPresent: (dateStr: string) => {
    const targetDate = new Date(dateStr);
    const activeWorkers = (globalStore.mockWorkers as MockWorker[]).filter(w => w.status === "ACTIVE");
    let count = 0;
    activeWorkers.forEach(w => {
      mockDb.saveAttendance({
        workerId: w.id,
        date: targetDate.toISOString(),
        status: "PRESENT",
        overtimeHours: 0,
        notes: "Bulk marked present",
      });
      count++;
    });
    return count;
  },

  // Salary Slip methods
  getSalarySlips: () => globalStore.mockSalarySlips as MockSalarySlip[],
  getSalarySlipById: (id: string) => (globalStore.mockSalarySlips as MockSalarySlip[]).find(s => s.id === id),
  addSalarySlip: (slip: Omit<MockSalarySlip, "id" | "slipNumber" | "generatedAt">) => {
    const seq = String((globalStore.mockSalarySlips as MockSalarySlip[]).length + 1).padStart(4, "0");
    const monthStr = String(slip.month).padStart(2, "0");
    const slipNumber = `BK-SAL-${slip.year}-${monthStr}-${seq}`;
    
    const newSlip: MockSalarySlip = {
      ...slip,
      id: `slip_${Date.now()}`,
      slipNumber,
      daysPresent: Number(slip.daysPresent),
      daysAbsent: Number(slip.daysAbsent),
      overtimeHours: Number(slip.overtimeHours),
      basicSalary: Number(slip.basicSalary),
      overtimeAmount: Number(slip.overtimeAmount),
      allowances: Number(slip.allowances),
      bonus: Number(slip.bonus),
      deductions: Number(slip.deductions),
      netPay: Number(slip.netPay),
      generatedAt: new Date().toISOString(),
    };
    globalStore.mockSalarySlips.push(newSlip);
    return newSlip;
  },
  updateSalarySlip: (id: string, slip: Partial<MockSalarySlip>) => {
    const idx = globalStore.mockSalarySlips.findIndex((s: any) => s.id === id);
    if (idx === -1) return null;
    const updated = {
      ...globalStore.mockSalarySlips[idx],
      ...slip,
      ...(slip.daysPresent !== undefined && { daysPresent: Number(slip.daysPresent) }),
      ...(slip.daysAbsent !== undefined && { daysAbsent: Number(slip.daysAbsent) }),
      ...(slip.overtimeHours !== undefined && { overtimeHours: Number(slip.overtimeHours) }),
      ...(slip.basicSalary !== undefined && { basicSalary: Number(slip.basicSalary) }),
      ...(slip.overtimeAmount !== undefined && { overtimeAmount: Number(slip.overtimeAmount) }),
      ...(slip.allowances !== undefined && { allowances: Number(slip.allowances) }),
      ...(slip.bonus !== undefined && { bonus: Number(slip.bonus) }),
      ...(slip.deductions !== undefined && { deductions: Number(slip.deductions) }),
      ...(slip.netPay !== undefined && { netPay: Number(slip.netPay) }),
    };
    globalStore.mockSalarySlips[idx] = updated;
    return updated;
  },

  // Dump and Restore full JSON backup
  dumpDatabase: () => {
    return {
      customers: globalStore.mockCustomers,
      products: globalStore.mockProducts,
      invoices: globalStore.mockInvoices,
      payments: globalStore.mockPayments,
      quotations: globalStore.mockQuotations,
      vendors: globalStore.mockVendors,
      purchases: globalStore.mockPurchases,
      expenses: globalStore.mockExpenses,
      workOrders: globalStore.mockWorkOrders,
      stockMovements: globalStore.mockStockMovements,
      documents: globalStore.mockDocuments,
      workers: globalStore.mockWorkers,
      attendance: globalStore.mockAttendance,
      salarySlips: globalStore.mockSalarySlips,
    };
  },
  restoreDatabase: (data: any) => {
    if (data.customers) globalStore.mockCustomers = data.customers;
    if (data.products) globalStore.mockProducts = data.products;
    if (data.invoices) globalStore.mockInvoices = data.invoices;
    if (data.payments) globalStore.mockPayments = data.payments;
    if (data.quotations) globalStore.mockQuotations = data.quotations;
    if (data.vendors) globalStore.mockVendors = data.vendors;
    if (data.purchases) globalStore.mockPurchases = data.purchases;
    if (data.expenses) globalStore.mockExpenses = data.expenses;
    if (data.workOrders) globalStore.mockWorkOrders = data.workOrders;
    if (data.stockMovements) globalStore.mockStockMovements = data.stockMovements;
    if (data.documents) globalStore.mockDocuments = data.documents;
    if (data.workers) globalStore.mockWorkers = data.workers;
    if (data.attendance) globalStore.mockAttendance = data.attendance;
    if (data.salarySlips) globalStore.mockSalarySlips = data.salarySlips;
    return true;
  },
};


// Check if we should fallback to mock mode
export function useMockDb(): boolean {
  return !process.env.DATABASE_URL || process.env.DATABASE_URL.includes("placeholder-url");
}
