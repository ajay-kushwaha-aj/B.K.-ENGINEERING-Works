# B.K. Engineering Works — ERP & GST Billing System
### Complete PRD + Phase-Wise Development Plan (Web-First → Mobile, Shared Schema)

**Version:** 2.0 (Refined for real-world build)
**Prepared:** July 2026
**Core Priority:** GST Invoice Generation & Billing (everything else is built around this core)

---

## 1. Executive Summary

B.K. Engineering Works currently runs on handwritten invoices. This document defines a **web-first, mobile-second** ERP and GST Billing platform, built so that the web app and the future mobile app share **one database, one schema, and one API** — no duplicate business logic, no sync conflicts.

**Build order:** Web App (Next.js, mobile-first responsive UI) → validated in real use for 4–6 weeks → Mobile App (React Native) consuming the same backend API.

**Design direction:** Premium, modern, professional — steel-gray/gold industrial theme, custom SVG iconography (no generic icon packs), mobile-first responsive layouts down to 360px width.

---

## 2. Company Context

| | |
|---|---|
| **Company** | B.K. Engineering Works |
| **Industry** | Industrial Engineering Contractor |
| **Core Work** | Sugar factory maintenance, plant erection, structural/pipeline fabrication (SS/MS), mechanical maintenance, welding, shutdown maintenance |
| **Users** | Single user — Owner (full access, no roles/staff logins in v1) |
| **Primary Goal** | Replace handwritten invoice book with fast, GST-correct, professional digital invoicing |

---

## 3. Real-World Refinements to Original Scope

| Original PRD Item | Refinement | Reason |
|---|---|---|
| JWT + refresh token + role middleware + audit logs from day one | Basic email/password auth in Phase 0; audit logs added only in Phase 6 (multi-tenant) | Single-owner app doesn't need SaaS-grade auth infra yet |
| AI Features (OCR, voice billing, prediction) in Phase 4 | Moved to Phase 6, entirely optional | Zero invoicing value early; large build cost |
| Mobile app in Phase 4 | Moved to Phase 5, after web is proven in real use | Avoid building two frontends before one is validated |
| 3 PDF themes from day one | 1 premium theme in Phase 1, more themes in Phase 5 | Ship the core faster |
| Full inventory + purchase + work order in Phase 2 | Split to Phase 4, after invoicing/payments/GST are stable | Real usage should decide if inventory tracking is even needed at this volume |
| Separate customer ledger as manual entry | Auto-derived from Invoice + Payment tables | Avoids double data entry and drift |

**Guiding rule for every phase:** ship something the owner can actually use for real invoices before moving to the next phase.

---

## 4. Shared Architecture (Web + Mobile)

```
┌─────────────────────┐     ┌─────────────────────┐
│   Web App (Next.js)  │     │  Mobile App (RN)     │
│   Mobile-first UI     │     │  Phase 5             │
└──────────┬───────────┘     └──────────┬───────────┘
           │                            │
           └────────────┬───────────────┘
                         │  REST/tRPC API (single source of truth)
                ┌────────▼────────┐
                │  Node.js/Express  │
                │  or Next.js API   │
                │  Routes (Phase 0-4)│
                └────────┬────────┘
                         │
                ┌────────▼────────┐
                │  Prisma ORM       │
                └────────┬────────┘
                         │
                ┌────────▼────────┐
                │ Supabase Postgres │
                │ (single shared DB) │
                └────────┬────────┘
                         │
              ┌──────────┴──────────┐
              │ Supabase Storage /   │
              │ Cloudinary (files,   │
              │ logos, signatures)   │
              └───────────────────────┘
```

**Key decision:** Business logic (GST calculation, invoice numbering, totals, amount-in-words) lives **only in the backend API**, never duplicated in web or mobile frontend code. Both clients call the same endpoints. This is what makes "shared schema and database" actually safe — one calculation engine, two UIs.

---

## 5. Technology Stack (Finalized)

### Web Frontend
- Next.js 14+ (App Router)
- Tailwind CSS
- Shadcn UI (base components, customized — not default look)
- React Hook Form + Zod (form validation)
- React Query (server state/caching)
- Zustand or Redux Toolkit (lightweight — Zustand preferred for single-user app simplicity)
- Framer Motion (micro-interactions only, not decorative overload)
- Recharts (dashboard graphs)

### Backend
- Next.js API Routes (Phase 0–3) → can be extracted into standalone Express service later if mobile load demands it (Phase 5)
- Prisma ORM
- Zod (shared validation schemas between frontend and backend)

### Database & Infra
- Supabase PostgreSQL (single database — shared by web and mobile from day one)
- Supabase Auth (email/password now; OTP/biometric added Phase 5)
- Supabase Storage (documents, logos, signatures) or Cloudinary for image transforms

### PDF & Documents
- `@react-pdf/renderer` (React-based PDF generation — easiest to theme, works well with custom SVG assets)

### Mobile (Phase 5)
- React Native (Expo) — chosen over Flutter to **reuse Zod schemas, API types, and business-logic contracts** from the Next.js codebase via a shared `packages/shared` folder in a monorepo
- Same Supabase Auth session model as web

### Monorepo Structure (recommended from Phase 0)
```
/bk-erp
  /apps
    /web          → Next.js app
    /mobile        → React Native app (added Phase 5)
  /packages
    /shared        → Zod schemas, TypeScript types, GST calculation logic, constants
    /ui            → (optional, Phase 5+) shared design tokens
  /prisma
    schema.prisma  → single schema, single source of truth
```
Using a monorepo (Turborepo or Nx) from day one — even before mobile exists — costs almost nothing and means Phase 5 mobile work starts by importing `packages/shared` instead of reimplementing GST logic in Dart/RN from scratch.

### Deployment
- Vercel (web + API routes)
- Supabase (DB, Auth, Storage)
- EAS Build (Expo) for mobile, Phase 5

---

## 6. Design System — Premium, Mobile-First, Professional

### 6.1 Visual Identity

| Token | Value | Usage |
|---|---|---|
| Primary | Steel Gray `#4B5563` | Headers, primary buttons, nav |
| Secondary | Metallic Gold `#D4AF37` | Accents, active states, premium highlights (used sparingly) |
| Tertiary | Royal Blue `#1E3A8A` | Links, secondary actions, charts |
| Success | `#16A34A` | Paid status, positive indicators |
| Warning | `#D97706` | Partial payment, low stock |
| Danger | `#DC2626` | Overdue, cancelled |
| Background | `#FFFFFF` / `#0F1115` (dark mode) | Base surfaces |
| Surface | `#F8F9FA` / `#1A1D23` (dark mode) | Cards |

- **Typography:** `Inter` or `Plus Jakarta Sans` for UI text; `Space Grotesk` or similar for numerals/invoice totals (tabular figures, clean digit alignment — matters a lot for financial data)
- **Corner radius:** 12–16px cards, 8px buttons/inputs — consistent, not mixed
- **Elevation:** subtle shadows, no heavy skeuomorphism; light glassmorphism only on dashboard summary cards, not on data-dense tables
- **Iconography:** Custom-built SVG icon set matching the industrial theme (gear, pipeline, valve, welding motifs) — not generic Lucide/Feather defaults for brand-critical screens (dashboard, invoice header, empty states). Utility icons (edit, delete, search) can use a standard icon library for speed.

### 6.2 Mobile-First Rules (applies to the **website**, not just future app)

- Design and build every screen starting at **360px width first**, then scale up to tablet (768px) and desktop (1280px+) — not the reverse
- Primary actions (Create Invoice, Record Payment) always reachable with a thumb — bottom-anchored floating action button on mobile viewports, top-right button on desktop
- Tables (invoice list, customer list) **collapse into cards** below 768px — never horizontal-scroll a data table on mobile
- Forms: single-column on mobile, max 2-column on desktop; large touch targets (min 44×44px)
- Invoice creation on mobile: step-based flow (Customer → Items → Review) instead of one long scrolling form
- Dashboard charts: swipeable/stacked on mobile instead of squeezed side-by-side

### 6.3 SVG Asset List (build once, reuse everywhere)

- Logo mark (as specified: B.K. initials + half gear + industrial silhouette + pipeline/valve, gold/silver metallic finish, transparent background)
- Empty-state illustrations: "No invoices yet," "No customers yet," "All caught up" (payments) — custom, on-brand, not stock illustrations
- Status badges: Paid / Unpaid / Partial / Overdue / Draft (as small SVG pill icons, not just colored text)
- Dashboard icon set: Sales, Collection, Outstanding, GST, Customers, Products, Stock (custom industrial-themed line icons)
- Invoice PDF header ornament (subtle gear/pipeline motif watermark, low opacity)

---

## 7. Database Schema (Prisma) — Shared by Web & Mobile

This is the **single source of truth**. Every phase below only adds to this schema; nothing is redesigned mid-project.

```prisma
model Company {
  id            String   @id @default(cuid())
  name          String
  gstin         String?
  pan           String?
  address       String?
  email         String?
  phone         String?
  website       String?
  logoUrl       String?
  signatureUrl  String?
  sealUrl       String?
  bankName      String?
  bankAccount   String?
  ifsc          String?
  upiId         String?
  invoicePrefix String   @default("BK")
  termsDefault  String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  role      Role     @default(OWNER)
  createdAt DateTime @default(now())
}
enum Role { OWNER } // extendable in Phase 6

model Customer {
  id            String   @id @default(cuid())
  name          String
  companyName   String?
  gstin         String?
  pan           String?
  phone         String?
  email         String?
  state         String
  address       String?
  pinCode       String?
  contactPerson String?
  notes         String?
  status        CustomerStatus @default(ACTIVE)
  invoices      Invoice[]
  quotations    Quotation[]
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
}
enum CustomerStatus { ACTIVE INACTIVE BLOCKED }

model Vendor {
  id           String    @id @default(cuid())
  name         String
  gstin        String?
  phone        String?
  email        String?
  address      String?
  bankDetails  String?
  purchases    Purchase[]
  createdAt    DateTime  @default(now())
}

model Product {
  id           String   @id @default(cuid())
  name         String
  description  String?
  hsnCode      String?
  gstPercent   Decimal
  unit         String
  price        Decimal
  purchasePrice Decimal?
  weight       Decimal?
  stockQty     Decimal  @default(0)
  minStock     Decimal  @default(0)
  category     String?
  imageUrl     String?
  status       ProductStatus @default(ACTIVE)
  invoiceItems InvoiceItem[]
  createdAt    DateTime @default(now())
  updatedAt    DateTime @updatedAt
}
enum ProductStatus { ACTIVE INACTIVE }

model Invoice {
  id             String   @id @default(cuid())
  invoiceNumber  String   @unique   // BK-2026-000001, sequential
  customerId     String
  customer       Customer @relation(fields: [customerId], references: [id])
  invoiceDate    DateTime
  dueDate        DateTime?
  items          InvoiceItem[]
  subTotal       Decimal
  discountTotal  Decimal  @default(0)
  cgstTotal      Decimal  @default(0)
  sgstTotal      Decimal  @default(0)
  igstTotal      Decimal  @default(0)
  grandTotal     Decimal
  amountInWords  String
  notes          String?
  terms          String?
  status         InvoiceStatus @default(UNPAID)
  paymentStatus  PaymentStatus @default(UNPAID)
  cancelledAt    DateTime?
  quotationId    String?
  quotation      Quotation? @relation(fields: [quotationId], references: [id])
  payments       Payment[]
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
enum InvoiceStatus { DRAFT FINAL CANCELLED }
enum PaymentStatus { PAID UNPAID PARTIAL }

model InvoiceItem {
  id          String   @id @default(cuid())
  invoiceId   String
  invoice     Invoice  @relation(fields: [invoiceId], references: [id])
  productId   String?
  product     Product? @relation(fields: [productId], references: [id])
  description String
  qty         Decimal
  unit        String
  rate        Decimal
  discount    Decimal  @default(0)
  gstPercent  Decimal
  cgst        Decimal  @default(0)
  sgst        Decimal  @default(0)
  igst        Decimal  @default(0)
  amount      Decimal
}

model Quotation {
  id            String   @id @default(cuid())
  quotationNumber String @unique
  customerId    String
  customer      Customer @relation(fields: [customerId], references: [id])
  date          DateTime
  items         Json      // mirrors InvoiceItem shape
  grandTotal    Decimal
  status        QuotationStatus @default(DRAFT)
  invoices      Invoice[]
  createdAt     DateTime @default(now())
}
enum QuotationStatus { DRAFT SENT APPROVED REJECTED CONVERTED }

model WorkOrder {
  id             String   @id @default(cuid())
  woNumber       String   @unique
  customerId     String
  siteName       String
  location       String?
  startDate      DateTime?
  completionDate DateTime?
  projectManager String?
  description    String?
  status         WOStatus @default(OPEN)
  estimatedCost  Decimal?
  actualCost     Decimal?
  createdAt      DateTime @default(now())
}
enum WOStatus { OPEN IN_PROGRESS COMPLETED CANCELLED }

model Payment {
  id            String   @id @default(cuid())
  invoiceId     String
  invoice       Invoice  @relation(fields: [invoiceId], references: [id])
  amount        Decimal
  mode          PaymentMode
  transactionId String?
  paymentDate   DateTime
  createdAt     DateTime @default(now())
}
enum PaymentMode { CASH CHEQUE BANK_TRANSFER UPI ONLINE }

model Purchase {
  id            String   @id @default(cuid())
  vendorId      String
  vendor        Vendor   @relation(fields: [vendorId], references: [id])
  purchaseDate  DateTime
  items         Json
  gstTotal      Decimal
  grandTotal    Decimal
  paymentStatus PaymentStatus @default(UNPAID)
  createdAt     DateTime @default(now())
}

model Expense {
  id          String   @id @default(cuid())
  category    String
  amount      Decimal
  date        DateTime
  notes       String?
  createdAt   DateTime @default(now())
}

model StockMovement {
  id         String   @id @default(cuid())
  productId  String
  type       StockMoveType
  qty        Decimal
  reason     String?
  createdAt  DateTime @default(now())
}
enum StockMoveType { IN OUT ADJUSTMENT OPENING }

model Document {
  id          String   @id @default(cuid())
  customerId  String?
  type        String   // Agreement, Drawing, PO, GST Certificate, Photo, etc.
  fileUrl     String
  fileName    String
  uploadedAt  DateTime @default(now())
}
```

**Notes for Prisma/Postgres setup:**
- All money fields use `Decimal`, never `Float` — floating point rounding errors in GST math are unacceptable
- `invoiceNumber` generation must be a transaction-safe sequence (row lock or Postgres sequence), not "count + 1" in application code, to avoid duplicate numbers under concurrent requests
- Add indexes on `Invoice.customerId`, `Invoice.invoiceDate`, `Invoice.paymentStatus` early — dashboard and search queries depend on them

---

## 8. Phase-Wise Development Plan

### Phase 0 — Foundation (Week 1–2)

**Goal:** Empty but real skeleton — nothing user-facing yet except login and company setup.

- Monorepo setup (Turborepo), `apps/web`, `packages/shared`
- Supabase project + Prisma schema (models above) migrated
- Supabase Auth: email/password login, protected routes
- Company Settings screen: logo upload, GSTIN, PAN, address, bank details, UPI ID, invoice prefix, terms & conditions default text
- Base design system: Tailwind theme config with color tokens, typography scale, Shadcn components re-themed (not default gray)
- Custom SVG logo integrated into header/login screen

**Exit criteria:** Owner logs in on a phone browser at 360px width, sees a clean dashboard shell, and company profile is saved correctly.

---

### Phase 1 — Core Invoicing (Week 3–6) — **The Product**

This phase alone should already beat the handwritten book. Ship and start using it before building further.

**Customer module (minimal viable)**
- Fields: Name, Company Name, GSTIN, Phone, Email, State (critical for CGST/SGST vs IGST), Address, PIN
- List, search, add, edit (mobile: card list; desktop: table)

**Product module (minimal viable)**
- Fields: Name, HSN Code, GST %, Unit, Rate
- List, search, add, edit

**Invoice creation flow (mobile-first, step-based)**
1. Select/add customer
2. Add line items (product picker with inline "add new product" option) → qty, rate, discount auto-fills GST % from product
3. Review screen: auto-calculated subtotal, CGST/SGST or IGST split (based on customer state vs company state), grand total, amount in words (Indian numbering system — lakhs/crores)
4. Notes & Terms (pre-filled from company settings, editable)
5. Finalize → generates sequential invoice number (`BK-2026-000001`)

**GST split logic (single most important business rule — build with unit tests):**
```
if customer.state === company.state:
    cgst = gstAmount / 2
    sgst = gstAmount / 2
    igst = 0
else:
    cgst = 0
    sgst = 0
    igst = gstAmount
```

**Invoice PDF (one premium theme)**
- `@react-pdf/renderer` template: logo, custom watermark motif, company details, GST breakdown table, amount in words, digital signature image, company seal image, QR code (UPI payment QR or invoice-verification QR), terms & conditions
- Download PDF
- Share via WhatsApp using `wa.me` deep link with the PDF (no API integration needed for v1)

**Invoice list**
- Filter: customer, date range, payment status
- Actions: duplicate, cancel (soft-delete — required for GST audit trail), view PDF

**Exit criteria:** A real invoice for an actual job can be created and sent via WhatsApp in under 2 minutes, with correct GST math, from a phone.

---

### Phase 2 — Payments & Dashboard (Week 7–9)

- Payment recording against an invoice: amount, mode, date, transaction ID
- Partial payment support → auto-updates `Invoice.paymentStatus`
- Outstanding/pending payments list, sortable by age
- Dashboard cards: Today's Sales, Today's Collection, Monthly Sales, Pending Payments, Outstanding Amount, Recent Invoices
- Dashboard chart: Monthly Sales (Recharts, swipeable on mobile)
- Manual "Send Reminder" WhatsApp link per overdue invoice

**Exit criteria:** Owner opens the app each morning and sees exact cash position within 5 seconds.

---

### Phase 3 — GST Reporting & Quotations (Week 10–13)

- GSTR summary, HSN summary, monthly GST report — Export Excel & PDF
- Quotation module: mirrors invoice UI, adds Draft → Sent → Approved → **Convert to Invoice** (reuses invoice creation logic entirely — highest-leverage feature in this phase)
- Customer ledger — auto-derived view (not manual entry) from Invoice + Payment tables, with running balance
- Top customers / top products widgets on dashboard

**Exit criteria:** Owner can hand a GST report to their CA with zero manual compilation.

---

### Phase 4 — Inventory, Work Orders, Expenses (Week 14–18)

Only start this phase after 3–4 weeks of real invoicing usage — real data should confirm whether stock tracking is actually needed at current volume.

- Stock In / Stock Out / Opening Stock / Adjustment, tied to `StockMovement`
- Low stock & out-of-stock alerts (dashboard notification)
- Vendor module + Purchase Entry (vendor, GST, items, payment status)
- Work Order module (WO number, site, dates, project manager, estimated vs actual cost)
- Expense tracking (Fuel, Transport, Salary, Electricity, Rent, Custom) + expense report
- Inventory & Purchase reports

**Exit criteria:** Full purchase-to-invoice cycle tracked, not just the sales side.

---

### Phase 5 — Mobile App & Polish (Week 19–26)

**This is where the shared-schema investment pays off.**

- `apps/mobile` (React Native + Expo) added to the monorepo
- Imports `packages/shared` for: Zod validation schemas, GST calculation functions, TypeScript types, constants (invoice statuses, payment modes, categories) — **zero business logic rewritten**
- Mobile screens mirror web flows: Dashboard, Invoice creation (step-based, same as mobile-web), Customer list, Payment recording
- Offline invoice drafting with local queue → sync when online
- Camera-based document capture (POs, drawings, GST certificates) → uploaded to same Supabase Storage bucket used by web
- Barcode/QR scanner for product lookup
- Push notifications: payment due, low stock

**Web polish (parallel track):**
- Second PDF theme option
- Dark mode
- OTP / biometric login (Supabase Auth + WebAuthn or native biometric)
- Document storage UI (customer-linked file manager)
- Automated cloud backup + one-click database export

**Exit criteria:** Owner can create an invoice equally fast on phone browser or native app, backed by the same data, same numbering sequence, same GST logic — no discrepancies possible because there's one backend.

---

### Phase 6 — AI & Multi-Tenant SaaS (Future, Optional)

Only pursue if the plan shifts toward licensing this to other contractors/fabrication shops.

- Invoice OCR (digitize old paper invoices)
- AI expense categorization
- Voice billing
- Sales prediction / business insights
- Multi-branch, multi-company support
- Employee logins with role-based permissions, audit logs
- JWT refresh-token auth upgrade, GPS attendance, payroll

---

## 9. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Performance** | Invoice PDF generation < 2s; dashboard load < 1.5s on 4G |
| **Data integrity** | All monetary values as `Decimal`; invoice numbers via DB-level sequence, never race-condition-prone app logic |
| **Security** | HTTPS everywhere; Supabase Row Level Security scoped to single owner in v1 (future-ready for multi-tenant in Phase 6); encrypted backups |
| **Availability** | Daily automated Supabase backup from Phase 2 onward (don't wait until Phase 5) |
| **Compliance** | Cancelled invoices soft-deleted, never hard-deleted — required for GST audit trail |
| **Accessibility** | Minimum 44×44px touch targets; WCAG AA color contrast on all status badges |
| **Responsiveness** | Fully functional and visually polished from 360px to 1920px, tested at 360, 768, 1024, 1440 breakpoints |

---

## 10. Success Metrics (per phase)

| Phase | Metric |
|---|---|
| 1 | Owner stops using the handwritten book entirely within first week of Phase 1 launch |
| 2 | Owner checks the dashboard daily without prompting |
| 3 | GST filing time reduced from manual compilation (hours) to one export (minutes) |
| 4 | Stock discrepancies caught before they cause a missed job |
| 5 | Mobile app used for at least 50% of invoices within a month of launch |

---

## 11. Immediate Next Step

Start Phase 0: scaffold the monorepo, migrate the Prisma schema above, and build the Company Settings screen with the design tokens in Section 6. Once that's verified, move straight into Phase 1's invoice creation flow — that's the screen the entire business depends on.
