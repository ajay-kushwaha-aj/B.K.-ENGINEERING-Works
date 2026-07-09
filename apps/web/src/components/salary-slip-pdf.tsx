import * as React from "react";
import { Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer";
import { convertNumberToIndianWords } from "shared";

// Register custom fonts (Inter) matching invoice PDF
Font.register({
  family: "Inter",
  fonts: [
    { src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hjpg.ttf", fontWeight: "normal" },
    { src: "https://fonts.gstatic.com/s/inter/v12/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuGkyAZ9hjpg.ttf", fontWeight: "bold" },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 9,
    padding: 40,
    color: "#1e293b",
    lineHeight: 1.4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderBottomWidth: 1.5,
    borderBottomColor: "#475569",
    paddingBottom: 15,
    marginBottom: 20,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 50,
    height: 50,
    borderRadius: 6,
  },
  companyName: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#0f172a",
  },
  companySub: {
    fontSize: 7,
    color: "#64748b",
    letterSpacing: 2,
    marginTop: 2,
    textTransform: "uppercase",
  },
  companyDetails: {
    alignItems: "flex-end",
    maxWidth: 240,
  },
  companyDetailText: {
    fontSize: 8,
    color: "#475569",
  },
  title: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#0f172a",
    letterSpacing: 1.5,
    marginBottom: 2,
    textTransform: "uppercase",
  },
  infoSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
    padding: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  metaLeft: {
    width: "50%",
  },
  metaRight: {
    width: "45%",
    alignItems: "flex-end",
  },
  sectionTitle: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 6,
    letterSpacing: 1,
  },
  boldText: {
    fontWeight: "bold",
    color: "#0f172a",
  },
  metaGrid: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 3,
  },
  metaLabel: {
    color: "#64748b",
    marginRight: 6,
    fontSize: 8,
  },
  metaVal: {
    fontFamily: "Courier",
    fontWeight: "bold",
    fontSize: 8,
  },
  tableContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  tableBlock: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 6,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    fontWeight: "bold",
    padding: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#cbd5e1",
    padding: 6,
  },
  colDesc: { width: "70%" },
  colAmt: { width: "30%", textAlign: "right" },
  totalRow: {
    flexDirection: "row",
    backgroundColor: "#f8fafc",
    padding: 6,
    fontWeight: "bold",
    borderTopWidth: 1,
    borderTopColor: "#94a3b8",
  },
  netPayContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f0f4f8", // Soft light blue highlight
    padding: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "#1E3A8A",
    marginBottom: 20,
  },
  wordsBox: {
    width: "60%",
  },
  netPayBox: {
    width: "35%",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  netPayTitle: {
    fontSize: 8,
    fontWeight: "bold",
    color: "#1E3A8A",
    textTransform: "uppercase",
    marginBottom: 2,
  },
  netPayValue: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#1E3A8A",
  },
  bankContainer: {
    padding: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 20,
  },
  bankGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 4,
  },
  bankItem: {
    width: "45%",
    marginRight: 10,
    marginBottom: 5,
  },
  bankItemText: {
    fontSize: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: "auto",
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
  },
  disclaimer: {
    fontSize: 7,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 15,
  },
  signBox: {
    width: "40%",
    alignItems: "center",
    position: "relative",
  },
  signatureImg: {
    maxHeight: 35,
    maxWidth: 120,
    objectFit: "contain",
    marginBottom: 5,
  },
  sealImg: {
    position: "absolute",
    right: 20,
    top: -20,
    width: 50,
    height: 50,
    opacity: 0.5,
  },
});

interface SalarySlipPdfProps {
  slip: any;
  companySettings: any;
}

export const SalarySlipPdfDocument: React.FC<SalarySlipPdfProps> = ({ slip, companySettings }) => {
  const company = companySettings || {
    name: "B.K. Engineering Works",
    gstin: "27AAAAA1111A1Z1",
    pan: "ABCDE1234F",
    address: "Registered Address, Mumbai",
    phone: "",
    email: "",
    logoUrl: "",
    signatureUrl: "",
    sealUrl: "",
  };

  const worker = slip.worker || {
    name: "Worker Name",
    id: "EMP-001",
    designation: "Welder",
    department: "Fabrication",
    bankName: "",
    bankAccount: "",
    ifsc: "",
  };

  const monthName = new Date(slip.year, slip.month - 1).toLocaleString("en-IN", { month: "long" });

  const earnings = [
    { label: "Basic Salary", amount: Number(slip.basicSalary) },
    { label: "Overtime Wages", amount: Number(slip.overtimeAmount) },
    { label: "Site/Travel Allowance", amount: Number(slip.allowances) },
    { label: "Bonus / Incentives", amount: Number(slip.bonus) },
  ];
  const totalEarnings = earnings.reduce((sum, item) => sum + item.amount, 0);

  const deductions = [
    { label: "PF / ESI Contribution", amount: Number(slip.deductions) > 0 ? Number(slip.deductions) : 0 },
    // Deduction notes detail
    { label: slip.deductionNotes || "Absence / Advance Deductions", amount: Number(slip.deductions) > 0 ? 0 : 0 }, 
  ];
  // Deductions are simple itemized sum
  const totalDeductions = Number(slip.deductions);

  // Amount in words
  const netPayWords = convertNumberToIndianWords(Number(slip.netPay));

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            {company.logoUrl ? (
              <Image src={company.logoUrl} style={styles.logo} />
            ) : (
              <Image src="/logo.png" style={styles.logo} />
            )}
            <View>
              <Text style={styles.companyName}>{company.name}</Text>
              <Text style={styles.companySub}>Industrial Erection & Pipeline Fabrication</Text>
            </View>
          </View>
          <View style={styles.companyDetails}>
            <Text style={styles.title}>Salary Slip</Text>
            <Text style={styles.companyDetailText}>{company.address}</Text>
            {company.phone && <Text style={styles.companyDetailText}>Ph: {company.phone}</Text>}
            {company.email && <Text style={styles.companyDetailText}>Email: {company.email}</Text>}
            <Text style={[styles.companyDetailText, { marginTop: 4, fontWeight: "bold" }]}>GSTIN: {company.gstin || "URD"}</Text>
          </View>
        </View>

        {/* Worker Info & Period */}
        <View style={styles.infoSection}>
          <View style={styles.metaLeft}>
            <Text style={styles.sectionTitle}>Employee Information</Text>
            <Text style={[styles.boldText, { fontSize: 10 }]}>{worker.name}</Text>
            <Text style={{ marginTop: 2 }}>ID: {worker.id}</Text>
            <Text>Designation: {worker.designation}</Text>
            <Text>Department: {worker.department || "General"}</Text>
            <Text>Wage Period: {monthName} {slip.year}</Text>
          </View>
          <View style={styles.metaRight}>
            <Text style={styles.sectionTitle}>Payroll Specs</Text>
            <View style={styles.metaGrid}>
              <Text style={styles.metaLabel}>Slip No:</Text>
              <Text style={[styles.metaVal, styles.boldText]}>{slip.slipNumber || "DRAFT"}</Text>
            </View>
            <View style={styles.metaGrid}>
              <Text style={styles.metaLabel}>Days Present:</Text>
              <Text style={styles.metaVal}>{Number(slip.daysPresent)}</Text>
            </View>
            <View style={styles.metaGrid}>
              <Text style={styles.metaLabel}>Days Absent:</Text>
              <Text style={styles.metaVal}>{Number(slip.daysAbsent)}</Text>
            </View>
            {Number(slip.overtimeHours) > 0 && (
              <View style={styles.metaGrid}>
                <Text style={styles.metaLabel}>Overtime Hours:</Text>
                <Text style={styles.metaVal}>{Number(slip.overtimeHours)} hrs</Text>
              </View>
            )}
          </View>
        </View>

        {/* Earnings & Deductions Tables */}
        <View style={styles.tableContainer}>
          
          {/* Earnings Block */}
          <View style={styles.tableBlock}>
            <View style={styles.tableHeader}>
              <Text style={styles.colDesc}>Earnings (Inclusions)</Text>
              <Text style={styles.colAmt}>Amount</Text>
            </View>
            {earnings.map((e, idx) => (
              <View key={idx} style={styles.tableRow}>
                <Text style={styles.colDesc}>{e.label}</Text>
                <Text style={styles.colAmt}>₹{e.amount.toFixed(2)}</Text>
              </View>
            ))}
            <View style={styles.totalRow}>
              <Text style={styles.colDesc}>Gross Earnings</Text>
              <Text style={styles.colAmt}>₹{totalEarnings.toFixed(2)}</Text>
            </View>
          </View>

          {/* Deductions Block */}
          <View style={styles.tableBlock}>
            <View style={styles.tableHeader}>
              <Text style={styles.colDesc}>Deductions (Exclusions)</Text>
              <Text style={styles.colAmt}>Amount</Text>
            </View>
            <View style={styles.tableRow}>
              <Text style={styles.colDesc}>Total Deductions</Text>
              <Text style={styles.colAmt}>₹{totalDeductions.toFixed(2)}</Text>
            </View>
            {slip.deductionNotes ? (
              <View style={[styles.tableRow, { borderBottomWidth: 0 }]}>
                <Text style={[styles.colDesc, { fontSize: 7, color: "#64748b" }]}>Reason: {slip.deductionNotes}</Text>
                <Text style={styles.colAmt}></Text>
              </View>
            ) : (
              <View style={[styles.tableRow, { borderBottomWidth: 0, height: 40 }]}>
                <Text style={styles.colDesc}></Text>
                <Text style={styles.colAmt}></Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={styles.colDesc}>Gross Deductions</Text>
              <Text style={styles.colAmt}>₹{totalDeductions.toFixed(2)}</Text>
            </View>
          </View>

        </View>

        {/* Net Pay summary block (words + figure) */}
        <View style={styles.netPayContainer}>
          <View style={styles.wordsBox}>
            <Text style={styles.sectionTitle}>Net Payable Amount (In Words)</Text>
            <Text style={[styles.boldText, { fontSize: 8.5 }]}>{netPayWords}</Text>
          </View>
          <View style={styles.netPayBox}>
            <Text style={styles.netPayTitle}>Net Take-Home Pay</Text>
            <Text style={styles.netPayValue}>₹{Number(slip.netPay).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</Text>
          </View>
        </View>

        {/* Payment mode / bank transfer details used */}
        <View style={styles.bankContainer}>
          <Text style={styles.sectionTitle}>Employee Bank Settlement details</Text>
          <View style={styles.bankGrid}>
            <View style={styles.bankItem}>
              <Text style={styles.bankItemText}><Text style={{ color: "#64748b" }}>Bank Name: </Text>{worker.bankName || "—"}</Text>
              <Text style={styles.bankItemText}><Text style={{ color: "#64748b" }}>Account No: </Text>{worker.bankAccount || "—"}</Text>
            </View>
            <View style={styles.bankItem}>
              <Text style={styles.bankItemText}><Text style={{ color: "#64748b" }}>IFSC Code: </Text>{worker.ifsc || "—"}</Text>
              <Text style={styles.bankItemText}><Text style={{ color: "#64748b" }}>Payment Mode: </Text>{slip.paymentMode || "Pending"}</Text>
            </View>
          </View>
        </View>

        {/* Signatures & Seal Footer */}
        <View style={styles.footer}>
          <View style={{ width: "50%" }}>
            <Text style={styles.sectionTitle}>Remarks / Notes</Text>
            <Text style={{ fontSize: 7, color: "#64748b" }}>
              1. Salary is credited by the 7th of every month.
              {"\n"}2. Please verify the days present and overtime logs in case of discrepancies.
            </Text>
          </View>
          <View style={styles.signBox}>
            {company.sealUrl && (
              <Image src={company.sealUrl} style={styles.sealImg} />
            )}
            <Text style={[styles.sectionTitle, { marginBottom: 15 }]}>For {company.name}</Text>
            {company.signatureUrl ? (
              <Image src={company.signatureUrl} style={styles.signatureImg} />
            ) : (
              <View style={{ height: 35 }} />
            )}
            <Text style={{ fontSize: 8, borderTopWidth: 0.5, borderTopColor: "#94a3b8", width: "100%", textAlign: "center", paddingTop: 3 }}>
              Authorized Signatory
            </Text>
          </View>
        </View>

        <Text style={styles.disclaimer}>
          This is a computer generated document and does not require a physical signature.
        </Text>

      </Page>
    </Document>
  );
};
