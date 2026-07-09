# B.K. Engineering Works — Complete Features Guide

**What is this software?**
This is a complete business management system (called an "ERP") and GST billing platform built for **B.K. Engineering Works**, an industrial engineering contractor. It replaces the old handwritten invoice book with a fast, modern, digital system that works on both phones and computers.

---

## Table of Contents

1. [Loading Screen (Splash Page)](#1-loading-screen-splash-page)
2. [Login Page](#2-login-page)
3. [Navigation Sidebar & Top Bar](#3-navigation-sidebar--top-bar)
4. [Dashboard — Your Business At A Glance](#4-dashboard--your-business-at-a-glance)
5. [Invoices — The Core Billing System](#5-invoices--the-core-billing-system)
6. [Create Invoice — Step-by-Step Wizard](#6-create-invoice--step-by-step-wizard)
7. [Customers — Client Management](#7-customers--client-management)
8. [Customer Ledger — Account Statement](#8-customer-ledger--account-statement)
9. [Products & Services](#9-products--services)
10. [Payments — Record & Track Money Received](#10-payments--record--track-money-received)
11. [Quotations — Estimates Before Billing](#11-quotations--estimates-before-billing)
12. [Create Quotation](#12-create-quotation)
13. [Workers — Employee Management](#13-workers--employee-management)
14. [Worker Detail Page](#14-worker-detail-page)
15. [Daily Attendance](#15-daily-attendance)
16. [Salary Slips — Worker Pay Management](#16-salary-slips--worker-pay-management)
17. [Work Orders — Job/Project Tracking](#17-work-orders--jobproject-tracking)
18. [Purchases — Buying From Vendors](#18-purchases--buying-from-vendors)
19. [Inventory — Stock Management](#19-inventory--stock-management)
20. [Expenses — Track Business Spending](#20-expenses--track-business-spending)
21. [Documents — File Storage](#21-documents--file-storage)
22. [Reports — GST & Payroll Reports](#22-reports--gst--payroll-reports)
23. [Company Settings](#23-company-settings)
24. [Invoice PDF — Professional Bill Generation](#24-invoice-pdf--professional-bill-generation)
25. [Salary Slip PDF — Pay Slip Generation](#25-salary-slip-pdf--pay-slip-generation)
26. [GST Calculation Logic (Behind the Scenes)](#26-gst-calculation-logic-behind-the-scenes)
27. [Dark Mode & Light Mode](#27-dark-mode--light-mode)
28. [Mobile-Friendly Design](#28-mobile-friendly-design)
29. [Database Backup & Restore](#29-database-backup--restore)

---

## 1. Loading Screen (Splash Page)

**What it does:**
When you first open the website, this is the very first thing you see. It shows the B.K. Engineering Works logo with a spinning loader animation.

**How it works:**
- The system checks if you are already logged in (it looks for a saved session on your device).
- If you are already logged in → It sends you straight to the **Dashboard**.
- If you are NOT logged in → It sends you to the **Login Page**.
- You only see this screen for a moment (1-2 seconds) while it checks.

**Visual Elements:**
- Dark background with a subtle dot grid pattern
- Company logo (pulsing animation)
- Company name: "B.K. Engineering Works"
- Text: "Loading Billing System..."
- A spinning circle indicator

---

## 2. Login Page

**What it does:**
This is where the owner enters their email and password to access the system. Only authorized users can get in.

**Features:**
- **Email field** — Type your registered email address (e.g., owner@bkengineering.com)
- **Password field** — Type your password (must be at least 6 characters)
- **"Use Mock Login" checkbox** — If you haven't set up the online database (Supabase) yet, tick this box and you can log in with any email/password for testing purposes. This is useful for trying the system offline.
- **Log In button** — Press this to sign in. It shows a loading spinner while checking your credentials.
- **Error messages** — If your email or password is wrong, a red error message appears explaining what went wrong.
- **Validation** — The system checks that you've entered a proper email format and a password of at least 6 characters before even trying to log in.

**Security:**
- Works with real Supabase authentication (online database login) when configured
- Falls back to local mock login for offline/testing use
- Session is saved on your device so you don't have to log in every time

---

## 3. Navigation Sidebar & Top Bar

**What it does:**
This is the menu that appears on every page after you log in. It lets you navigate between all the different sections of the system.

**On Computer (Desktop):**
- A vertical sidebar on the left side of the screen
- Shows the company logo at the top
- Lists all menu items with icons:
  - Dashboard
  - Invoices
  - Workers
  - Daily Attendance
  - Salary Slips
  - Quotations
  - Payments
  - Work Orders
  - Purchases
  - Inventory
  - Expenses
  - Documents
  - Customers
  - Products
  - Reports
  - Settings
- The currently active page is highlighted in gold
- At the bottom: your email address, a dark/light mode toggle, and a Logout button

**On Phone (Mobile):**
- A compact top bar with the company logo and a hamburger menu icon (☰)
- Tapping the menu icon opens a full-screen overlay with all the same menu items
- Tapping any item closes the menu and navigates to that page
- A close button (✕) to dismiss the menu

**Dark Mode / Light Mode Toggle:**
- A sun/moon icon button that switches the entire website between light and dark color schemes
- Your preference is saved so it stays the same next time you open the app

**Logout:**
- Clicking "Logout" removes your saved session and takes you back to the Login Page

---

## 4. Dashboard — Your Business At A Glance

**What it does:**
This is the home page after you log in. It gives you a quick summary of everything happening in your business today — money earned, money pending, expenses, worker status, and more.

**Summary Cards (Key Numbers):**
These 8 cards show your most important business numbers at a glance:

| Card | What it shows |
|---|---|
| **Today's Sales** | Total value of invoices created today |
| **Today's Collections** | Total payments received today |
| **Monthly Sales** | Total sales for the current month |
| **Pending Invoices** | Number of unpaid or partially paid invoices |
| **Outstanding Amount** | Total money your customers owe you |
| **Monthly Expenses** | Total expenses recorded this month |
| **This Month's Payroll** | Total salary amounts (paid + pending) for the current month |
| **Workers on Leave** | Number of workers marked as absent/on leave today |

**Low Stock Alert Banner:**
- If any products are running below their minimum stock levels, a red warning banner appears at the top
- Clicking it takes you to the Inventory page to adjust stock

**Monthly Sales & Collections Chart:**
- A bar chart showing your sales and collections side by side for each month
- Gold bars = Sales, Blue bars = Collections
- Hover over a bar to see the exact amount
- Amounts are shown in Indian format (₹1.5L for 1.5 Lakh, ₹2K for 2,000)

**Recent Invoices:**
- A list of your most recently created invoices
- Shows invoice number, customer name, amount, and payment status (PAID / UNPAID / PARTIAL)
- Clicking "View All" takes you to the full Invoices page
- If no invoices exist yet, a "Create First Invoice" button appears

**Top Customers Widget:**
- Shows your highest-value customers ranked by total business
- Each customer has a progress bar showing their share relative to your best customer

**Top Products Widget:**
- Shows your best-selling products/services ranked by revenue
- Includes quantity sold and total revenue earned

**Quick Action Buttons:**
- "Create Invoice" — Opens the invoice creation wizard
- "Record Payment" — Opens the payments page

**Bottom Stats Banner:**
- Total Revenue (all-time earnings)
- Total Invoices (total count of all invoices ever created)
- Quick link to Create Invoice
- Quick link to Record Payment

---

## 5. Invoices — The Core Billing System

**What it does:**
This page shows all your invoices (bills) in one place. You can search, filter, download PDFs, print, share on WhatsApp, and cancel invoices.

**Features:**

- **Total Count** — Shows how many invoices exist (e.g., "24 total")
- **Create Invoice button** — Takes you to the step-by-step invoice creation wizard
- **Search Bar** — Type to search by invoice number or customer name
- **Status Filter Dropdown** — Filter invoices by status:
  - All Statuses
  - DRAFT (not yet finalized)
  - FINAL (completed and finalized)
  - CANCELLED (voided)

**Invoice List (Desktop View — Table):**
Each invoice row shows:
- **Invoice Number** — e.g., BK-2026-000001 (monospaced font for easy reading)
- **Customer** — Company name and contact person
- **Date** — When the invoice was created
- **Grand Total** — The final amount in ₹ (Rupees)
- **Status Badge** — Color-coded:
  - FINAL = Blue badge
  - DRAFT = Gray badge
  - CANCELLED = Red badge
- **Payment Status Badge** — Color-coded:
  - PAID = Green badge
  - PARTIAL = Amber/Yellow badge
  - UNPAID = Gray badge

**Actions for each invoice:**
- **Download PDF** — Generates a professional PDF of the invoice and downloads it to your device. You can choose between "Modern" theme and "Classic Standard" theme.
- **Print** — Opens the PDF in a print dialog so you can directly print it on paper.
- **Share on WhatsApp** — Opens WhatsApp with a pre-written message containing the invoice number and amount, ready to send to the customer.
- **Cancel Invoice** — Marks the invoice as "CANCELLED". A confirmation dialog appears first. Cancelled invoices are never deleted (this is required for GST audit compliance — the government needs to see cancelled invoices too).

**Invoice List (Mobile View — Cards):**
On phones, the table converts to individual cards. Each card shows the same information in a compact, touch-friendly format with larger buttons.

---

## 6. Create Invoice — Step-by-Step Wizard

**What it does:**
This is a guided, step-by-step process to create a new GST-compliant invoice. It walks you through 4 steps so you don't miss anything.

**Progress Bar:**
A visual indicator at the top shows which step you're on:
1. **Customer** → 2. **Items** → 3. **Review** → 4. **Finalized**

### Step 1: Select Customer
- **Customer Dropdown** — Pick which customer (client) this invoice is for from your saved customer list
- **Invoice Date** — Auto-filled with today's date, but you can change it
- **Due Date** — Optional. Set a payment deadline if needed
- **Customer Details Preview** — Once you select a customer, their full details appear: billing address, state, GSTIN, and contact info
- **Why the state matters:** The customer's state determines whether the GST is split into CGST+SGST (same state) or IGST (different state)

### Step 2: Add Items / Services
For each item you're billing for, you fill in:
- **Product Template (Auto-fill)** — Select from your saved products/services list to automatically fill in the description, HSN code, rate, unit, and GST percentage. Or choose "Manual Input" to type everything yourself.
- **Description** — What the work/product is (e.g., "MS Pipeline Fabrication")
- **HSN / SAC Code** — Government tax classification code
- **Quantity** — How many units
- **Unit** — The measurement type (e.g., Nos, Meters, Kg, Job)
- **Rate (₹)** — Price per unit in Rupees
- **Discount (₹)** — Any flat discount on this item
- **GST %** — Tax rate (0%, 5%, 12%, 18%, or 28%)
- **Line Total** — Automatically calculated amount for this line

**Additional features:**
- **Add Item Row** — Add as many line items as you need
- **Remove Row** — Delete a line item (the trash icon). You must always have at least one item.
- **Auto-calculation** — All GST taxes are computed automatically as you type

### Step 3: Review Invoice
This is the final check before creating the invoice:
- **Simulated Invoice Preview** — A mini version of what the invoice will look like
- **Item Table** — Shows all items with descriptions, HSN codes, quantities, rates, and totals
- **Amount in Words** — The total amount written in Indian English words (e.g., "One Lakh Twenty Three Thousand Four Hundred Fifty Six Rupees and Seventy Eight Paisa Only")
- **Notes field** — Add any internal notes
- **Terms & Conditions** — Pre-filled from your company settings, but editable for this specific invoice

**Calculated Totals Panel:**
- Taxable Value (subtotal before tax)
- Discount Total (if any discounts were applied)
- CGST + SGST (if customer is in the same state as your company)
- IGST (if customer is in a different state)
- **Grand Total** (the final amount the customer needs to pay)

### Step 4: Invoice Finalized (Success)
After clicking "Save & Finalize Invoice":
- A green success screen appears with a checkmark
- Shows the generated invoice number (e.g., BK-2026-000015)
- Shows the grand total and customer name
- **Download PDF button** — Generate and save the invoice as a PDF file
- **Share via WhatsApp button** — Share the invoice details on WhatsApp
- **Go to Invoices List** — Return to see all invoices
- **Create Another Invoice** — Start fresh with a new invoice

---

## 7. Customers — Client Management

**What it does:**
Manage all your customers (clients/companies you do business with). Every customer you add here can be selected when creating invoices and quotations.

**Features:**
- **Total Count** — Shows how many customers you have
- **Add Customer button** — Opens a form to add a new customer
- **Search Bar** — Search by name, company name, or GSTIN number

**Customer Information Fields:**
| Field | What it means |
|---|---|
| **Customer Name** | Name of the person or company you're billing |
| **Parent Company Name** | The larger group they belong to (if any) |
| **GSTIN** | Their GST registration number (shows "URD/Unregistered" if they don't have one) |
| **PAN** | Their Permanent Account Number for tax purposes |
| **Phone / Mobile** | Their contact phone number |
| **Email Address** | Their email for sending invoices |
| **State** | **Very important!** This determines whether CGST+SGST or IGST is charged on invoices |
| **Registered Address** | Their business address |
| **PIN Code** | Postal code |
| **Contact Person** | Who to address communications to |
| **Status** | ACTIVE, INACTIVE, or BLOCKED |
| **Internal Notes** | Private notes about this customer (payment terms, delivery preferences, etc.) |

**Desktop View:** Customers appear in a professional table with columns for Name, Company, GSTIN/State, Contact, Status, and Actions.

**Mobile View:** Customers appear as individual cards with all details laid out vertically for easy reading on phones.

**Actions:**
- **Edit** (pencil icon) — Open the customer form to update their details
- **View Ledger** (book icon) — See the complete financial history with this customer

---

## 8. Customer Ledger — Account Statement

**What it does:**
Shows a complete financial history for a specific customer — every invoice raised and every payment received, with a running balance showing how much they owe at any point in time.

**What you see:**
- Customer name and company at the top
- A table with columns:
  - **Date** — When the transaction happened
  - **Type** — INVOICE (money they owe) or PAYMENT (money they paid)
  - **Description** — Invoice number or payment reference
  - **Debit** — Amount added to what they owe (invoices)
  - **Credit** — Amount subtracted from what they owe (payments)
  - **Running Balance** — How much they owe after each transaction

**Features:**
- **Print button** — Print the ledger statement
- **Back button** — Return to the customers list
- The ledger is automatically calculated from invoices and payments — you don't need to enter anything manually

---

## 9. Products & Services

**What it does:**
Manage your catalog of products, materials, and services that you sell or provide. When creating invoices, you can pick from this list to auto-fill item details instead of typing everything manually each time.

**Product Information Fields:**
| Field | What it means |
|---|---|
| **Item or Service Name** | What you call it (e.g., "MS Pipeline Fabrication") |
| **Description** | Detailed description of the product/service |
| **HSN / SAC Code** | Government classification code for tax purposes |
| **GST Rate (%)** | How much GST is charged: 0%, 5%, 12%, 18%, or 28% |
| **Standard Rate (₹)** | Your selling price per unit |
| **Unit of Measurement** | How you measure/count it (Nos, Mtr, Joint, Kg, Job, etc.) |
| **Purchase Cost (₹)** | What it costs you to buy/make (for your own reference) |
| **Unit Weight (Kg)** | Weight per unit (useful for shipping calculations) |
| **Stock Quantity** | How many units you currently have in stock |
| **Minimum Stock Reorder Limit** | When stock falls below this number, you get a low-stock alert |
| **Category** | Group label (e.g., Fabrication, Welding, Spares) |
| **Status** | ACTIVE or INACTIVE |

**Features:**
- **Add Item / Service button** — Add a new product or service
- **Search Bar** — Search by product name or HSN code
- **Edit** — Update any product's details
- **Desktop Table View** — Professional table showing all key fields
- **Mobile Cards View** — Touch-friendly cards on phones

---

## 10. Payments — Record & Track Money Received

**What it does:**
This page lets you record payments received from customers and track which invoices still have money pending.

**Summary Cards at Top:**
- **Total Outstanding** — Total amount all customers owe you (shown in red)
- **Pending Invoices** — Number of invoices that haven't been fully paid
- **Payments Recorded** — Total number of payment entries recorded

**Two Tabs:**

### Outstanding Tab (Unpaid/Partially Paid Invoices)
Shows all invoices that still have money due:
- Invoice Number
- Customer Name
- Invoice Date
- Total Amount
- Amount Already Paid
- Balance Still Due
- **Age** — How many days since the invoice was created (color-coded: gray = recent, amber = 7+ days, red = 30+ days overdue)
- **Pay button** — Opens a form to record a payment against this invoice
- **Remind button** — Opens WhatsApp with a pre-written payment reminder message to send to the customer

### Payment History Tab
Shows all payments that have been recorded:
- Invoice number and customer name
- Payment date
- Payment method (Cash, UPI, Bank Transfer, etc.)
- Transaction reference number (if any)
- Amount paid (shown in green)

**Record Payment Form (Modal):**
When you click "Pay" or "Record Payment", a pop-up appears with:
- **Invoice Selector** — Choose which invoice this payment is for
- **Amount (₹)** — How much was paid (pre-filled with the balance due)
- **Payment Mode** — Choose from 5 options with emoji icons:
  - 💵 Cash
  - 📱 UPI
  - 🏦 Bank Transfer
  - 📝 Cheque
  - 💻 Online
- **Payment Date** — When the payment was received
- **Transaction ID** — Reference number (optional, for UPI ref, cheque number, etc.)
- **Record Payment button** — Saves the payment and automatically updates the invoice status:
  - If full amount is paid → Invoice becomes "PAID"
  - If partial amount → Invoice becomes "PARTIAL"

---

## 11. Quotations — Estimates Before Billing

**What it does:**
Create price quotations (estimates) for potential work before creating actual invoices. If a quotation is approved by the customer, you can convert it directly into an invoice with one click.

**Quotation Status Flow:**
```
DRAFT → SENT → APPROVED → CONVERTED (to Invoice)
                ↘ REJECTED
```

**Features:**
- **New Quotation button** — Create a new quotation
- **Search Bar** — Search by quotation number or customer name
- **Status Badges** — Color-coded for each status:
  - DRAFT = Gray
  - SENT = Blue
  - APPROVED = Green
  - REJECTED = Red
  - CONVERTED = Violet/Purple

**Actions per quotation:**
- **Mark as SENT** — Update status when you've sent the quote to the customer
- **Mark as APPROVED** — When the customer accepts the quote
- **Reject** — When the customer declines
- **Convert to Invoice** — Automatically creates a real invoice from the approved quotation data (items, amounts, customer — all copied over). This is a major time-saver.

---

## 12. Create Quotation

**What it does:**
A form similar to the invoice creation process, but for creating quotations (estimates). Works the same way — select a customer, add items with rates and quantities, and save.

---

## 13. Workers — Employee Management

**What it does:**
Manage your workforce — add workers, track their details, and view their attendance history.

**Worker Information Fields:**
| Field | What it means |
|---|---|
| **Full Name** | Worker's name |
| **Phone** | Contact number |
| **Email** | Email address |
| **Address** | Home address |
| **Aadhar Number** | Government ID number |
| **Department** | Which team they belong to (e.g., Fabrication, Welding, Electrical) |
| **Designation** | Job title (e.g., Fitter, Welder, Helper, Supervisor) |
| **Daily Wage (₹)** | How much they earn per day |
| **Join Date** | When they started working |
| **Status** | ACTIVE, INACTIVE, or TERMINATED |
| **Photo** | Upload a photo of the worker |
| **Aadhar Card Image** | Upload a copy of their ID card |

**Features:**
- **Add Worker button** — Add a new worker
- **Search Bar** — Search by name, phone, or Aadhar number
- **Filter by Status** — Show only Active, Inactive, or Terminated workers
- **Filter by Department** — Show workers from a specific department
- **View Profile** (eye icon) — See detailed worker profile with attendance history
- **Edit** (pencil icon) — Update worker details

---

## 14. Worker Detail Page

**What it does:**
Shows the complete profile of a single worker, including their personal details and their monthly attendance calendar.

**What you see:**
- Worker's photo (if uploaded)
- Personal details: name, phone, email, address, Aadhar, department, designation, daily wage
- **Monthly Attendance Calendar** — Shows each day of the month with the worker's status:
  - ✓ Present (green)
  - ½ Half Day (amber)
  - ✕ Absent (red)
  - L Leave (blue)
  - H Holiday (purple)
- You can navigate between months using arrow buttons
- Quick stats: total present days, absent days, half days, leave days

---

## 15. Daily Attendance

**What it does:**
Mark attendance for ALL workers for a single date. This is like a digital muster roll / attendance register.

**Features:**
- **Date Picker** — Select which date you want to mark attendance for (defaults to today)
- **Navigate by Day** — Arrow buttons to go to previous or next day
- **Worker List** — Shows all active workers with their department and daily wage
- For each worker, you can set:
  - **Status** — PRESENT, HALF_DAY, ABSENT, LEAVE, or HOLIDAY
  - **Overtime Hours** — If they worked extra hours
  - **Notes** — Any special notes for that day

**Bulk Actions:**
- **Mark All Present** — One click to mark everyone as present
- **Save Attendance** — Saves the entire day's attendance sheet at once

**Visual Indicators:**
- Each status has a different color so you can see the day's overview at a glance
- Shows a count of how many workers are present, absent, etc.

---

## 16. Salary Slips — Worker Pay Management

**What it does:**
Generate salary slips (pay slips) for workers based on their attendance. Calculate earnings, deductions, and produce professional PDF salary slips.

**Features:**
- **Generate Salary Slips** — Creates salary slips for a selected month. The system automatically calculates:
  - **Basic Pay** = Daily Wage × Days Present
  - **Half Day Pay** = Daily Wage × 0.5 × Half Days
  - **Overtime Pay** = (Daily Wage ÷ 8) × Overtime Hours × 1.5
  - **Deductions** (if any)
  - **Net Pay** = Total Earnings - Deductions

- **Filters:**
  - Search by worker name
  - Filter by worker
  - Filter by month
  - Filter by status (GENERATED, PAID, CANCELLED)

- **Actions per salary slip:**
  - **Download PDF** — Download a professional salary slip PDF
  - **Print** — Print the salary slip directly
  - **Record Payment** — Mark the salary as paid with payment mode, date, and transaction reference
  - **Share on WhatsApp** — Send salary details to the worker via WhatsApp
  - **Cancel** — Void the salary slip

- **Amount in Words** — The net pay is automatically converted to words (e.g., "Fifteen Thousand Rupees Only")

---

## 17. Work Orders — Job/Project Tracking

**What it does:**
Track ongoing projects and jobs. Each work order represents a specific project at a specific site.

**Work Order Fields:**
| Field | What it means |
|---|---|
| **WO Number** | Unique work order number |
| **Customer** | Which customer this job is for |
| **Site Name** | Name of the work site |
| **Location** | Where the site is located |
| **Start Date** | When work begins |
| **Completion Date** | When work is expected to finish |
| **Project Manager** | Who is managing this project |
| **Description** | Details about the work |
| **Status** | OPEN, IN_PROGRESS, COMPLETED, or CANCELLED |
| **Estimated Cost (₹)** | How much you estimated the job will cost |
| **Actual Cost (₹)** | How much it actually cost |

**Features:**
- Create new work orders
- Update status as the project progresses (OPEN → IN_PROGRESS → COMPLETED)
- Track estimated vs actual costs
- Filter and search work orders

---

## 18. Purchases — Buying From Vendors

**What it does:**
Record purchases made from your vendors (suppliers). Track what you buy, from whom, and how much you spend.

**Features:**
- **Add Purchase Entry** — Record a new purchase
- **Vendor Selection** — Choose or add a vendor (supplier)
- **Add Items** — List what was purchased with quantities, rates, and GST
- **Auto GST Calculation** — Total GST and grand total are calculated automatically
- **Payment Status** — Track whether you've paid the vendor (PAID / UNPAID / PARTIAL)
- **Purchase History** — View all past purchases with dates, vendor names, and amounts

**Vendor Information:**
- Vendor Name
- GSTIN
- Phone / Email
- Address
- Bank Details

---

## 19. Inventory — Stock Management

**What it does:**
Track your stock levels (how much of each product you have), get alerts when stock is low, and record stock movements.

**Features:**
- **Stock Overview** — Shows all products with current stock levels
- **Low Stock Alerts** — Products below their minimum reorder level are highlighted in red with a warning icon
- **Stock Actions for each product:**
  - **Stock In** (green arrow down) — Record incoming stock (e.g., received a shipment)
  - **Stock Out** (red arrow up) — Record outgoing stock (e.g., used materials on a job)
  - **Adjustment** — Correct the stock count after a physical check
- **Amount to adjust** — Enter how many units are being added/removed
- **Reason** — Why the stock changed (e.g., "Received from vendor XYZ" or "Used on site ABC")
- **Movement History** — See a log of all stock changes with dates and reasons

---

## 20. Expenses — Track Business Spending

**What it does:**
Record and categorize your business expenses to understand where your money is going.

**Expense Categories:**
- 🔧 Fuel
- 🚚 Transport
- 💰 Salary
- ⚡ Electricity
- 🏠 Rent
- 📝 Custom (define your own)

**Features:**
- **Add Expense button** — Record a new expense
- **Expense form fields:**
  - Category (pick from the list above)
  - Amount (₹)
  - Date
  - Notes (what the expense was for)
- **Monthly Summary** — Shows total expenses for the current month
- **Expense List** — All recorded expenses sorted by date, showing category, amount, date, and notes

---

## 21. Documents — File Storage

**What it does:**
Upload and store important business documents, optionally linked to specific customers.

**Document Types you can store:**
- Agreements
- Drawings
- Purchase Orders (POs)
- GST Certificates
- Site Photos
- Any other file type

**Features:**
- **Upload Document** — Upload any file from your device
- **Link to Customer** — Optionally associate the document with a specific customer
- **Document Type** — Label what kind of document it is
- **View/Download** — Open or download stored documents
- **Delete** — Remove documents you no longer need
- **Search & Filter** — Find documents quickly

---

## 22. Reports — GST & Payroll Reports

**What it does:**
Generate government-ready reports for your GST filing and payroll management.

### GST Reports
- **GSTR-1 Summary** — A table of all invoices for a selected month, formatted as per GST filing requirements:
  - Customer GSTIN
  - Invoice Number
  - Invoice Date
  - Taxable Value
  - CGST, SGST, IGST amounts
  - Total Invoice Value
- **HSN Summary** — Summarizes sales by HSN/SAC code (required for GST returns):
  - HSN Code
  - Total Quantity
  - Taxable Value
  - Tax Amounts
- **Monthly Totals** — Total taxable value, total tax collected (CGST + SGST + IGST), total invoices

**Navigation:**
- Month selector with left/right arrows to move between months
- Currently viewing month is clearly displayed

**Export Options:**
- **Export GSTR-1 CSV** — Download the GSTR-1 data as a spreadsheet file (can be imported into the GST portal)
- **Export HSN Summary CSV** — Download HSN summary as a spreadsheet

### Payroll Reports
- Shows salary information for all workers for a selected month
- Includes: worker name, department, days present, overtime hours, gross pay, deductions, net pay
- Export as CSV spreadsheet

---

## 23. Company Settings

**What it does:**
Configure your company's basic information. Everything you enter here is used throughout the system — on invoices, PDFs, quotations, and more.

### Company Profile Details
| Field | What it means |
|---|---|
| **Company Name** | Your legal business name |
| **GSTIN** | Your GST registration number |
| **PAN** | Your Permanent Account Number |
| **Invoice Number Prefix** | The text that appears before invoice numbers (e.g., "BK" makes invoices like BK-2026-000001) |
| **Registered Address** | Your business address (appears on invoices) |
| **Email** | Business email |
| **Phone** | Business phone number |
| **Website** | Company website URL |

### Banking & Payments
| Field | What it means |
|---|---|
| **Bank Name** | Your bank's name (e.g., State Bank of India) |
| **Bank Account Number** | Your account number |
| **IFSC Code** | Bank branch identifier code |
| **UPI ID** | Your UPI payment address (for QR code on invoices) |

### Default Terms & Conditions
- Type your standard invoice terms here
- These will automatically appear on every new invoice
- You can still edit them for individual invoices

### Branding & Assets
Upload these images to make your invoices look professional:
- **Company Logo** — Your business logo (appears on invoice headers)
- **Authorized Signature** — Digital image of the owner's signature (appears on invoices)
- **Company Seal / Stamp** — Digital image of your company stamp (appears on invoices)

Each upload area:
- Shows a preview after uploading
- Has a "Remove" button to clear the image
- Accepts PNG, JPG, and SVG formats

### Database Backup & Restore
- **Export JSON Backup** — Download your entire database as a JSON file (all customers, invoices, products, payments, etc.)
- **Import JSON Restore** — Upload a previously saved backup file to restore all data. Shows a warning that this will overwrite current data.

### Action Buttons
- **Save Settings** — Save all your company settings
- **Reset Form** — Revert to the last saved version

---

## 24. Invoice PDF — Professional Bill Generation

**What it does:**
Generates a professional, print-ready PDF document for each invoice. This is what you send to customers or print on paper.

**Two Theme Options:**
1. **Modern Theme** — A bold, premium design with a colored header banner
2. **Classic Standard Theme** — A cleaner, more traditional design with a header line and border

**What the PDF contains:**
- **Header:** Company logo, company name, address, GSTIN, PAN, contact details
- **Invoice Details:** Invoice number, date, due date
- **Customer Details:** "Bill To" section with customer name, company, address, GSTIN
- **Items Table:** All line items with:
  - Serial number
  - Description
  - HSN/SAC Code
  - Quantity and Unit
  - Rate per unit
  - Discount
  - GST %
  - Amount
- **Tax Summary:** CGST, SGST, or IGST totals
- **Grand Total:** Bold, prominent final amount
- **Amount in Words:** The total written out in Indian English (e.g., "One Lakh Fifty Thousand Rupees Only")
- **Bank Details:** For payment via bank transfer (bank name, account number, IFSC)
- **UPI ID:** For digital payments
- **Terms & Conditions:** Auto-filled from settings
- **Authorized Signature:** Digital signature image
- **Company Seal:** Digital stamp image
- **Footer:** "This is a computer-generated invoice"

---

## 25. Salary Slip PDF — Pay Slip Generation

**What it does:**
Generates a professional salary slip PDF for each worker, suitable for printing or sharing.

**What the Salary Slip PDF contains:**
- **Company Header:** Logo, company name, address
- **Title:** "SALARY SLIP" with month and year
- **Worker Details:** Name, department, designation, employee ID, daily wage
- **Attendance Summary:**
  - Total working days in the month
  - Days present
  - Half days
  - Absent days
  - Leave days
  - Total overtime hours
- **Earnings Breakdown:**
  - Basic Pay (present days × daily wage)
  - Half Day Pay
  - Overtime Pay
  - Any allowances
  - **Gross Earnings** total
- **Deductions Breakdown:**
  - Any deductions (advances, PF, etc.)
  - **Total Deductions**
- **Net Pay:** Final amount to be paid (in bold)
- **Amount in Words:** Written out in Indian English
- **Payment Details:** Mode of payment, transaction reference
- **Signatures:** Employer signature and employee signature spaces

---

## 26. GST Calculation Logic (Behind the Scenes)

**What it does:**
This is the core tax calculation engine that powers all invoices. It's shared between the website and future mobile app to ensure consistent calculations.

**How GST splitting works:**

```
If Customer is in the SAME state as your company:
    → CGST = GST Amount ÷ 2  (goes to Central Government)
    → SGST = GST Amount ÷ 2  (goes to State Government)
    → IGST = 0

If Customer is in a DIFFERENT state:
    → CGST = 0
    → SGST = 0
    → IGST = Full GST Amount  (goes to Central Government, who shares with destination state)
```

**Example:**
- You sell a service worth ₹10,000 with 18% GST
- GST Amount = ₹1,800
- If same state: CGST = ₹900, SGST = ₹900, IGST = ₹0 → Total = ₹11,800
- If different state: CGST = ₹0, SGST = ₹0, IGST = ₹1,800 → Total = ₹11,800

**Amount in Words Conversion:**
- Converts any number into Indian English words
- Uses the Indian numbering system (Lakh, Crore instead of Million, Billion)
- Includes Paisa for decimal amounts
- Example: ₹1,23,456.78 → "One Lakh Twenty Three Thousand Four Hundred Fifty Six Rupees and Seventy Eight Paisa Only"

---

## 27. Dark Mode & Light Mode

**What it does:**
The entire website supports two color schemes:

- **Light Mode** — White/light backgrounds with dark text. Best for well-lit environments.
- **Dark Mode** — Dark/black backgrounds with light text. Easier on the eyes in low light conditions and at night.

**How to switch:**
- Click the Sun ☀️ / Moon 🌙 icon in the navigation sidebar
- Your preference is remembered automatically

**What changes:**
- Background colors
- Text colors
- Card/panel backgrounds
- Border colors
- Status badge colors
- Chart colors
- Everything adapts to look great in both modes

---

## 28. Mobile-Friendly Design

**What it does:**
The entire website is designed to work perfectly on any screen size — from small phones (360px wide) to large desktop monitors (1920px wide).

**How it adapts:**

| Feature | On Phone | On Computer |
|---|---|---|
| Navigation | Top bar + hamburger menu | Fixed sidebar |
| Data tables | Convert to stacked cards | Full table with columns |
| Forms | Single column, full width | 2-3 columns side by side |
| Buttons | Full width, large touch targets | Normal sized |
| Charts | Full width, stacked | Side by side |
| Modals/Popups | Full screen | Centered dialog |

**Touch-friendly:**
- All buttons and clickable areas are at least 44×44 pixels (easy to tap)
- No tiny links that are hard to press on a touchscreen

---

## 29. Database Backup & Restore

**What it does:**
Lets you save and restore your entire business data.

**Export (Backup):**
- Go to Settings → Click "Export JSON Backup"
- A file named `bk_erp_backup_2026-07-09.json` (with the current date) is downloaded
- This file contains ALL your data: customers, products, invoices, payments, expenses, workers, attendance, everything

**Import (Restore):**
- Go to Settings → Click "Import JSON Restore"
- Select a previously exported backup file
- **Warning:** This will replace all current data with the data from the backup file
- After successful restore, the page reloads with all the restored data

**When to use:**
- Before making major changes (create a backup first)
- Moving to a new server or device
- Recovering from data loss
- Periodic safety backups

---

## Summary of All 16 Menu Sections

| # | Section | Purpose |
|---|---|---|
| 1 | Dashboard | Quick overview of your entire business |
| 2 | Invoices | Create, view, download, print, and share GST invoices |
| 3 | Workers | Manage employee records and profiles |
| 4 | Daily Attendance | Mark daily attendance for all workers |
| 5 | Salary Slips | Generate and manage worker salary pay slips |
| 6 | Quotations | Create estimates and convert approved ones to invoices |
| 7 | Payments | Record incoming payments and track outstanding dues |
| 8 | Work Orders | Track projects/jobs at different sites |
| 9 | Purchases | Record purchases from vendors/suppliers |
| 10 | Inventory | Track stock levels and get low-stock alerts |
| 11 | Expenses | Record and categorize business expenses |
| 12 | Documents | Upload and store important business files |
| 13 | Customers | Manage client details and view their ledger |
| 14 | Products | Manage product/service catalog with HSN codes and rates |
| 15 | Reports | Generate GST reports and payroll summaries |
| 16 | Settings | Configure company profile, banking, branding, and backups |

---

*This guide covers every single feature and element of the B.K. Engineering Works ERP & GST Billing System. For technical documentation, refer to the `BK_Engineering_ERP_PRD_and_Buildplan.md` file.*
