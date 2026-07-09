import { z } from "zod";

// Helper regexes for Indian tax and banking fields
export const GSTIN_REGEX = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
export const PAN_REGEX = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
export const IFSC_REGEX = /^[A-Z]{4}0[A-Z0-9]{6}$/;

export const CompanySchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Company name is required"),
  gstin: z.string().regex(GSTIN_REGEX, "Invalid GSTIN format").or(z.literal("")).nullable().optional(),
  pan: z.string().regex(PAN_REGEX, "Invalid PAN format").or(z.literal("")).nullable().optional(),
  address: z.string().nullable().optional(),
  email: z.string().email("Invalid email address").or(z.literal("")).nullable().optional(),
  phone: z.string().nullable().optional(),
  website: z.string().url("Invalid website URL").or(z.literal("")).nullable().optional(),
  logoUrl: z.string().nullable().optional(),
  signatureUrl: z.string().nullable().optional(),
  sealUrl: z.string().nullable().optional(),
  bankName: z.string().nullable().optional(),
  bankAccount: z.string().nullable().optional(),
  ifsc: z.string().regex(IFSC_REGEX, "Invalid IFSC format").or(z.literal("")).nullable().optional(),
  upiId: z.string().nullable().optional(),
  invoicePrefix: z.string().min(1, "Invoice prefix is required").default("BK"),
  termsDefault: z.string().nullable().optional(),
});

export type CompanyType = z.infer<typeof CompanySchema>;

export const CustomerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Customer name is required"),
  companyName: z.string().nullable().optional(),
  gstin: z.string().regex(GSTIN_REGEX, "Invalid GSTIN format").or(z.literal("")).nullable().optional(),
  pan: z.string().regex(PAN_REGEX, "Invalid PAN format").or(z.literal("")).nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email("Invalid email address").or(z.literal("")).nullable().optional(),
  state: z.string().min(1, "State is required (critical for GST logic)"),
  address: z.string().nullable().optional(),
  pinCode: z.string().length(6, "PIN code must be 6 digits").or(z.literal("")).nullable().optional(),
  contactPerson: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "BLOCKED"]).default("ACTIVE"),
  termsDefault: z.string().nullable().optional(),
});

export type CustomerType = z.infer<typeof CustomerSchema>;

export const ProductSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Product name is required"),
  description: z.string().nullable().optional(),
  hsnCode: z.string().nullable().optional(),
  gstPercent: z.number().min(0).max(100).default(18),
  unit: z.string().min(1, "Unit of measurement (e.g. Nos, KG) is required"),
  price: z.number().min(0, "Price must be non-negative"),
  purchasePrice: z.number().min(0).nullable().optional(),
  weight: z.number().nullable().optional(),
  stockQty: z.number().default(0),
  minStock: z.number().default(0),
  category: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

export type ProductType = z.infer<typeof ProductSchema>;

export const InvoiceItemSchema = z.object({
  id: z.string().optional(),
  productId: z.string().nullable().optional(),
  description: z.string().min(1, "Description is required"),
  qty: z.number().gt(0, "Quantity must be greater than 0"),
  unit: z.string().min(1, "Unit is required"),
  rate: z.number().min(0, "Rate must be non-negative"),
  discount: z.number().min(0).default(0),
  gstPercent: z.number().min(0).max(100),
  cgst: z.number().default(0),
  sgst: z.number().default(0),
  igst: z.number().default(0),
  amount: z.number().default(0),
});

export type InvoiceItemType = z.infer<typeof InvoiceItemSchema>;

export const InvoiceSchema = z.object({
  id: z.string().optional(),
  invoiceNumber: z.string().optional(), // Server-generated typically
  customerId: z.string().min(1, "Customer is required"),
  invoiceDate: z.union([z.date(), z.string()]),
  dueDate: z.union([z.date(), z.string()]).nullable().optional(),
  items: z.array(InvoiceItemSchema).min(1, "Invoice must contain at least one item"),
  subTotal: z.number().default(0),
  discountTotal: z.number().default(0),
  cgstTotal: z.number().default(0),
  sgstTotal: z.number().default(0),
  igstTotal: z.number().default(0),
  grandTotal: z.number().default(0),
  amountInWords: z.string().default(""),
  notes: z.string().nullable().optional(),
  terms: z.string().nullable().optional(),
  status: z.enum(["DRAFT", "FINAL", "CANCELLED"]).default("DRAFT"),
  paymentStatus: z.enum(["PAID", "UNPAID", "PARTIAL"]).default("UNPAID"),
  cancelledAt: z.union([z.date(), z.string()]).nullable().optional(),
  quotationId: z.string().nullable().optional(),
});

export type InvoiceType = z.infer<typeof InvoiceSchema>;

export const PaymentSchema = z.object({
  id: z.string().optional(),
  invoiceId: z.string().min(1, "Invoice ID is required"),
  amount: z.number().gt(0, "Amount must be greater than 0"),
  mode: z.enum(["CASH", "CHEQUE", "BANK_TRANSFER", "UPI", "ONLINE"]),
  transactionId: z.string().nullable().optional(),
  paymentDate: z.union([z.date(), z.string()]),
});

export type PaymentType = z.infer<typeof PaymentSchema>;

export const VendorSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Vendor name is required"),
  gstin: z.string().regex(GSTIN_REGEX, "Invalid GSTIN format").or(z.literal("")).nullable().optional(),
  phone: z.string().nullable().optional(),
  email: z.string().email("Invalid email address").or(z.literal("")).nullable().optional(),
  address: z.string().nullable().optional(),
  bankDetails: z.string().nullable().optional(),
});

export type VendorType = z.infer<typeof VendorSchema>;

export const WorkOrderSchema = z.object({
  id: z.string().optional(),
  woNumber: z.string().optional(),
  customerId: z.string().min(1, "Customer is required"),
  siteName: z.string().min(1, "Site name is required"),
  location: z.string().nullable().optional(),
  startDate: z.union([z.date(), z.string()]).nullable().optional(),
  completionDate: z.union([z.date(), z.string()]).nullable().optional(),
  projectManager: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "COMPLETED", "CANCELLED"]).default("OPEN"),
  estimatedCost: z.number().min(0).nullable().optional(),
  actualCost: z.number().min(0).nullable().optional(),
});

export type WorkOrderType = z.infer<typeof WorkOrderSchema>;

export const ExpenseSchema = z.object({
  id: z.string().optional(),
  category: z.string().min(1, "Category is required"),
  amount: z.number().gt(0, "Amount must be greater than 0"),
  date: z.union([z.date(), z.string()]),
  notes: z.string().nullable().optional(),
});

export type ExpenseType = z.infer<typeof ExpenseSchema>;

export const StockMovementSchema = z.object({
  id: z.string().optional(),
  productId: z.string().min(1, "Product ID is required"),
  type: z.enum(["IN", "OUT", "ADJUSTMENT", "OPENING"]),
  qty: z.number(),
  reason: z.string().nullable().optional(),
});

export type StockMovementType = z.infer<typeof StockMovementSchema>;

export const PurchaseSchema = z.object({
  id: z.string().optional(),
  vendorId: z.string().min(1, "Vendor ID is required"),
  purchaseDate: z.union([z.date(), z.string()]),
  items: z.any(),
  gstTotal: z.number().min(0),
  grandTotal: z.number().min(0),
  paymentStatus: z.enum(["PAID", "UNPAID", "PARTIAL"]).default("UNPAID"),
});

export type PurchaseType = z.infer<typeof PurchaseSchema>;

export const WorkerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, "Name is required"),
  fatherName: z.string().nullable().optional(),
  designation: z.string().min(1, "Designation is required"),
  department: z.string().nullable().optional(),
  phone: z.string().min(1, "Phone number is required"),
  email: z.string().email("Invalid email").or(z.literal("")).nullable().optional(),
  address: z.string().nullable().optional(),
  aadharNumber: z.string().nullable().optional(),
  panNumber: z.string().nullable().optional(),
  photoUrl: z.string().nullable().optional(),
  idProofUrl: z.string().nullable().optional(),
  joiningDate: z.union([z.date(), z.string()]),
  status: z.enum(["ACTIVE", "INACTIVE", "ON_LEAVE", "TERMINATED"]).default("ACTIVE"),
  salaryType: z.enum(["MONTHLY", "DAILY", "CONTRACT"]),
  basicSalary: z.number().min(0, "Basic salary must be non-negative"),
  bankName: z.string().nullable().optional(),
  bankAccount: z.string().nullable().optional(),
  ifsc: z.string().nullable().optional(),
  upiId: z.string().nullable().optional(),
});

export type WorkerType = z.infer<typeof WorkerSchema>;

export const AttendanceSchema = z.object({
  id: z.string().optional(),
  workerId: z.string().min(1, "Worker ID is required"),
  date: z.union([z.date(), z.string()]),
  status: z.enum(["PRESENT", "ABSENT", "HALF_DAY", "LEAVE", "HOLIDAY"]),
  overtimeHours: z.number().default(0),
  notes: z.string().nullable().optional(),
});

export type AttendanceType = z.infer<typeof AttendanceSchema>;

export const SalarySlipSchema = z.object({
  id: z.string().optional(),
  slipNumber: z.string().optional(),
  workerId: z.string().min(1, "Worker ID is required"),
  month: z.number().min(1).max(12),
  year: z.number().min(2000),
  daysPresent: z.number().min(0),
  daysAbsent: z.number().min(0),
  overtimeHours: z.number().default(0),
  basicSalary: z.number().min(0),
  overtimeAmount: z.number().default(0),
  allowances: z.number().default(0),
  bonus: z.number().default(0),
  deductions: z.number().default(0),
  deductionNotes: z.string().nullable().optional(),
  netPay: z.number().min(0),
  paymentStatus: z.enum(["PAID", "UNPAID", "PARTIAL"]).default("UNPAID"),
  paymentDate: z.union([z.date(), z.string()]).nullable().optional(),
  paymentMode: z.enum(["CASH", "CHEQUE", "BANK_TRANSFER", "UPI", "ONLINE"]).nullable().optional(),
  generatedAt: z.union([z.date(), z.string()]).optional(),
});

export type SalarySlipType = z.infer<typeof SalarySlipSchema>;


