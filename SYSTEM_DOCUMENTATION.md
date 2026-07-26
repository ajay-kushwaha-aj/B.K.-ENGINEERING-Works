# B.K. ENGINEERING WORKS — Enterprise ERP & GST System
## Complete System Flow, Architecture & Feature Documentation

---

## 1. Executive Summary

**B.K. Engineering Works ERP** is an enterprise-grade industrial contractor software platform engineered for large-scale engineering, structural fabrication, and site contracting operations. 

The platform integrates core industrial operations: **GST-compliant Billing & Invoicing**, **Real-Time Attendance & Payroll**, **Multi-Site Inventory & Material Approvals**, **Financial Analytics**, and **Role-Based Access Control (RBAC)**.

---

## 2. System Architecture & Tech Stack

```
 ┌────────────────────────────────────────────────────────────────────────┐
 │                         FRONTEND LAYER (Next.js 14)                     │
 │  • App Router Page Views (/dashboard, /invoices, /workers, /profile)   │
 │  • High-Contrast Light/Dark Design System (Tailwind CSS Tokens)        │
 │  • Recharts Financial & Collection Data Visualizations                │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                           API ROUTE LAYER                              │
 │  • RESTful Endpoints (/api/dashboard, /api/users/profile, /api/invoices)│
 │  • RBAC Guards (ADMIN vs SITE_MANAGER)                                  │
 │  • GST Calculation & Aggregations Engine                               │
 └───────────────────────────────────┬────────────────────────────────────┘
                                     │
                                     ▼
 ┌────────────────────────────────────────────────────────────────────────┐
 │                          DATABASE LAYER (Prisma ORM)                   │
 │  • PostgreSQL Relational Database                                      │
 │  • Models: User, Contract, Site, Product, Invoice, Attendance, Worker │
 └────────────────────────────────────────────────────────────────────────┘
```

### Core Technologies
- **Framework**: Next.js 14 (React Server Components + Client Hooks)
- **Database ORM**: Prisma v6.2.1
- **Database Engine**: PostgreSQL (Hosted on Supabase/AWS)
- **Styling**: Tailwind CSS + Custom CSS Theme Tokens (`globals.css`)
- **Visuals & Charts**: Recharts, Lucide Icons

---

## 3. Core Modules & Feature Breakdown

### 3.1 Executive Dashboard (`/dashboard`)
The command center provides real-time operational visibility driven directly by PostgreSQL aggregations.

#### Features & Functionality:
1. **Live KPI Stat Cards**:
   - **Today's Attendance**: Live count of present workers vs total registered workforce (`presentWorkersCount / totalWorkersCount`).
   - **Active Sites**: Real-time count of active construction & engineering locations.
   - **Monthly Revenue**: Aggregated total of collected payments for the active billing cycle.
   - **Pending Invoices**: Total unpaid and partially paid B2B GST invoices.
2. **Revenue vs Collections Financial Chart**:
   - Interactive bar chart contrasting **Sales Revenue** (Blue `#3B82F6`) vs **Collections** (Amber `#F59E0B`).
   - Custom hover tooltip card (`CustomChartTooltip`) displaying month-by-month financial figures in Indian Rupee format (`₹ Lakhs`).
3. **Active Projects Ring & Progress Widget**:
   - Displays real-time site list and total active locations.
4. **Pending Material Approvals Bar**:
   - Triggers alert banners when site managers request material dispatches that require Admin approval.

---

### 3.2 GST Invoicing & B2B Billing Module (`/invoices`)
Full lifecycle GST invoicing compliant with Indian Tax Standards.

#### Features & Functionality:
- **Tax Calculation Engine**: Automatically calculates **CGST**, **SGST**, or **IGST** based on intra-state vs inter-state client locations.
- **HSN/SAC Code Support**: Maps materials and engineering services to standardized HSN codes with pre-configured GST tax slabs (e.g. 18%, 28%).
- **Automated Invoice Status**: Tracks invoice progression (`DRAFT` → `SENT` → `PARTIALLY_PAID` → `PAID` → `OVERDUE`).
- **PDF Generation & Export**: Generates printable GST tax invoices with company seal and digital signature placeholders.

---

### 3.3 Site Workforce, Attendance & Payroll Module (`/workers`)
Manages site laborers, technicians, daily attendance, and wage disbursements.

#### Features & Functionality:
- **Daily Attendance Marking**: Site Managers log daily attendance (`PRESENT`, `ABSENT`, `HALF_DAY`, `OVERTIME`) per project site.
- **Overtime & Wage Calculator**: Automatically computes daily base pay plus overtime hours.
- **Payroll Settlement**: Tracks paid vs pending wages with salary slip exports.

---

### 3.4 Multi-Site Material & Stock Management (`/material-issues`)
Controls inventory movement from central stores to active project sites.

#### Features & Functionality:
- **Material Issue Requests**: Site Managers initiate stock requests specifying project site, product ID, quantity, and work order reason.
- **Approval Workflow**: Admins review pending requests (`PENDING` → `APPROVED` / `REJECTED`). Upon approval, database stock quantity (`stockQty`) is updated atomically.

---

### 3.5 User Profile & Display Picture Management (`/profile`)
Personalized user profile management for both Admins and Site Managers.

#### Features & Functionality:
- **Display Picture (DP) Upload**: Allows uploading custom profile photos (PNG, JPG, WEBP) with instant circular preview.
- **Header Avatar Synchronization**: Instantly updates session state so the user avatar renders across the top navigation bar and dropdown menus.
- **Personal & Job Details**: Edit Full Name, Phone Number, Designation, Department, and Base Location.
- **Security & Password Management**: Integrated password change controls with show/hide password toggling.

---

## 4. End-to-End Data & Workflow Cycles

### Workflow 1: User Profile & Avatar Update
```
[User on /profile] ──> Selects Image File ──> Base64 Preview Rendered
       │
       ▼
[Clicks Save Profile] ──> PUT /api/users/profile ──> Prisma updates `User` table in Postgres
       │
       ▼
[Response 200 OK] ──> Local Storage session updated ──> Header & Dropdown Avatar refreshed
```

### Workflow 2: Material Request & Stock Dispatch
```
[Site Manager] ──> Creates Material Request ──> API creates `MaterialIssue` (Status: PENDING)
                                                       │
                                                       ▼
[Admin Dashboard] <── Alert Banner Displays ── [Notification System]
       │
       ▼
[Admin Clicks Approve] ──> PUT /api/material-issues ──> Status: APPROVED 
                                                       ──> Product `stockQty` decremented
```

### Workflow 3: B2B Invoicing & Revenue Aggregation
```
[Create Invoice] ──> Line Items + HSN + GST Slabs ──> Calculates Subtotal, Tax & Grand Total
                                                                │
                                                                ▼
[Record Payment] <── Customer Pays Invoice ─────── [Invoice Saved to Database]
       │
       ▼
[API /api/dashboard] ──> Aggregates Sales & Payments ──> Revenue vs Collections Chart Updates
```

---

## 5. Security & Access Control Matrix (RBAC)

| Feature / Module | ADMIN Role | SITE MANAGER Role |
| :--- | :---: | :---: |
| Executive Dashboard & Analytics | Full Access | Restricted / Site View |
| Create & Edit B2B Invoices | Full Access | Read Only |
| Approve Material Issue Requests | Full Access | View / Request Only |
| Mark Daily Site Attendance | Full Access | Site-Specific Access |
| User Profile & DP Management | Full Access | Own Profile Only |
| System Settings & Database Schema | Full Access | No Access |

---

## 6. Theme & Accessibility System

- **Dual-Theme Support**: Instant switching between Light Mode (`bg-slate-50`) and Dark Mode (`bg-slate-950`).
- **High-Contrast Boundaries**: Enforced solid 2px borders (`border-slate-300 dark:border-slate-800`) across all inputs, cards, and textboxes to ensure maximum visibility in industrial field environments.
- **Fixed Layout**: Pinned top header bar and independently scrollable left sidebar navigation.

---

*Document compiled for B.K. Engineering Works ERP Platform.*
