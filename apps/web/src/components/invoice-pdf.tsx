import * as React from "react";
import { Document, Page, Text, View, StyleSheet, Image, Font } from "@react-pdf/renderer";
import { convertNumberToIndianWords } from "shared";

// Register custom fonts if needed (React PDF supports standard system fonts like Helvetica, Times-Roman, Courier out of the box)
Font.register({
  family: "Inter",
  fonts: [
    { src: "/fonts/Inter-Regular.ttf", fontWeight: "normal" },
    { src: "/fonts/Inter-Bold.ttf", fontWeight: "bold" },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "Inter",
    fontSize: 9,
    padding: 30,
    color: "#1e293b",
    lineHeight: 1.4,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    borderTopWidth: 3,
    borderTopColor: "#1e3a8a",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingTop: 12,
    paddingBottom: 15,
    marginBottom: 15,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "62%",
  },
  logo: {
    width: 46,
    height: 46,
    borderRadius: 4,
    marginRight: 10,
  },
  companyName: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#0f172a",
    letterSpacing: -0.3,
  },
  companySub: {
    fontSize: 5.6,
    color: "#475569",
    letterSpacing: 0.5,
    marginTop: 7,
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  companyDetails: {
    alignItems: "flex-end",
    width: "36%",
  },
  companyDetailText: {
    fontSize: 7.5,
    color: "#475569",
    lineHeight: 1.35,
  },
  invoiceTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e3a8a",
    letterSpacing: 2,
    marginBottom: 9,
    textTransform: "uppercase",
  },
  infoSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
    padding: 10,
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  billTo: {
    width: "50%",
    paddingRight: 15,
  },
  invoiceMeta: {
    width: "40%",
    alignItems: "flex-end",
  },
  sectionTitle: {
    fontSize: 7,
    fontWeight: "bold",
    color: "#64748b",
    textTransform: "uppercase",
    marginBottom: 4,
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
  table: {
    flexDirection: "column",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 6,
    overflow: "hidden",
    marginBottom: 15,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f1f5f9",
    borderBottomWidth: 1,
    borderBottomColor: "#cbd5e1",
    fontWeight: "bold",
    padding: 6,
    alignItems: "center",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    padding: 6,
    alignItems: "center",
  },
  colSl: { width: "5%", textAlign: "center" },
  colDesc: { width: "35%" },
  colHsn: { width: "10%", textAlign: "center" },
  colQty: { width: "8%", textAlign: "center" },
  colRate: { width: "12%", textAlign: "right" },
  colCgst: { width: "9%", textAlign: "center" },
  colSgst: { width: "9%", textAlign: "center" },
  colIgst: { width: "18%", textAlign: "center" },
  colAmt: { width: "12%", textAlign: "right" },
  
  // Summary Block
  summaryContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  amountInWordsBox: {
    width: "55%",
    padding: 8,
    backgroundColor: "#f8fafc",
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  totalsBox: {
    width: "40%",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 3,
    borderBottomWidth: 0.5,
    borderBottomColor: "#f1f5f9",
  },
  totalRowText: {
    fontSize: 8,
  },
  grandTotalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: "#475569",
  },
  grandTotalRowText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#0f172a",
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
  termsBox: {
    width: "50%",
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
  disclaimer: {
    fontSize: 7,
    color: "#94a3b8",
    textAlign: "center",
    marginTop: 15,
  },
});

const modernStyles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#f8fafc", // Clean, light off-white printable background
    borderLeftWidth: 4,
    borderLeftColor: "#1e3a8a", // Clean dark blue accent border
    paddingHorizontal: 18,
    paddingVertical: 16,
    borderRadius: 6,
    marginBottom: 15,
  },
  companyName: {
    fontSize: 13,
    fontWeight: "bold",
    color: "#0f172a", // Dark slate for readability
    letterSpacing: -0.3,
  },
  companySub: {
    fontSize: 5.6,
    color: "#1e3a8a", // Dark blue tagline
    letterSpacing: 0.5,
    marginTop: 7,
    textTransform: "uppercase",
    fontWeight: "bold",
  },
  companyDetailText: {
    fontSize: 7.5,
    color: "#475569", // Dark gray detail text
    lineHeight: 1.35,
  },
  invoiceTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1e3a8a", // Clean dark blue title
    letterSpacing: 2,
    marginBottom: 9,
    textTransform: "uppercase",
  },
});

interface InvoicePdfProps {
  invoice: any;
  companySettings: any;
  theme?: "classic" | "modern";
}

export const InvoicePdfDocument: React.FC<InvoicePdfProps> = ({ invoice: rawInvoice, companySettings, theme = "classic" }) => {
  const invoice = React.useMemo(() => {
    return {
      ...rawInvoice,
      invoiceNumber: rawInvoice?.invoiceNumber || "DRAFT",
      invoiceDate: rawInvoice?.invoiceDate || new Date(),
      dueDate: rawInvoice?.dueDate || null,
      subTotal: Number(rawInvoice?.subTotal || 0),
      discountTotal: Number(rawInvoice?.discountTotal || 0),
      cgstTotal: Number(rawInvoice?.cgstTotal || 0),
      sgstTotal: Number(rawInvoice?.sgstTotal || 0),
      igstTotal: Number(rawInvoice?.igstTotal || 0),
      grandTotal: Number(rawInvoice?.grandTotal || 0),
      amountInWords: rawInvoice?.amountInWords || "",
      notes: rawInvoice?.notes || "",
      terms: rawInvoice?.terms || "",
      status: rawInvoice?.status || "DRAFT",
      paymentStatus: rawInvoice?.paymentStatus || "UNPAID",
      items: rawInvoice?.items || [],
      customer: rawInvoice?.customer || null,
    };
  }, [rawInvoice]);

  const isModern = theme === "modern";
  const s = {
    ...styles,
    ...(isModern && {
      header: modernStyles.header,
      companyName: modernStyles.companyName,
      companySub: modernStyles.companySub,
      companyDetailText: modernStyles.companyDetailText,
      invoiceTitle: modernStyles.invoiceTitle,
    })
  };
  const company = companySettings || {
    name: "B.K. Engineering Works",
    gstin: "27AAAAA1111A1Z1",
    pan: "ABCDE1234F",
    address: "Registered Address, Mumbai",
    phone: "",
    email: "",
    bankName: "State Bank of India",
    bankAccount: "12345678901",
    ifsc: "SBIN0001234",
    upiId: "bkworks@sbi",
    termsDefault: "Terms & Conditions default",
    logoUrl: "",
    signatureUrl: "",
    sealUrl: "",
  };

  const customer = invoice.customer || {
    name: "Customer Name",
    companyName: "",
    gstin: "",
    state: "Maharashtra",
    address: "Customer Address",
  };

  const isIntrastate = customer.state.trim().toLowerCase() === company.state?.trim().toLowerCase();

  const subTotalVal = Number(invoice.subTotal);
  const cgstTotalVal = Number(invoice.cgstTotal);
  const sgstTotalVal = Number(invoice.sgstTotal);
  const igstTotalVal = Number(invoice.igstTotal);
  const totalTaxVal = cgstTotalVal + sgstTotalVal + igstTotalVal;
  const totalBeforeRound = subTotalVal + totalTaxVal;
  const finalAmount = Number(invoice.grandTotal);
  const roundOffVal = finalAmount - totalBeforeRound;

  // Extract GST rates from items
  const gstPercentages = Array.from(new Set(invoice.items?.map((item: any) => Number(item.gstPercent)) || []));
  const isSingleGst = gstPercentages.length === 1;
  const cgstRate = isSingleGst ? (Number(gstPercentages[0]) / 2) : 9;
  const sgstRate = isSingleGst ? (Number(gstPercentages[0]) / 2) : 9;
  const igstRate = isSingleGst ? Number(gstPercentages[0]) : 18;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        
        <View style={s.header}>
          <View style={[s.logoContainer, { width: "53%" }]}>
            {company.logoUrl ? (
              <Image src={company.logoUrl} style={s.logo} />
            ) : (
              // If no logo uploaded, render a blank space or standard image placeholder
              <Image src="/logo.png" style={s.logo} />
            )}
            <View>
              <Text style={s.companyName}>{company.name}</Text>
              <Text style={s.companySub}>Industrial Erection & Pipeline Fabrication</Text>
            </View>
          </View>
          <View style={[s.companyDetails, { width: "45%", alignItems: "flex-end" }]}>
            <Text style={s.invoiceTitle}>GST Tax Invoice</Text>
            <Text style={[s.companyDetailText, { fontSize: 4.8, textAlign: "right" }]}>{company.address}</Text>
            <View style={{ flexDirection: "row", marginTop: 2 }}>
              {company.phone && <Text style={[s.companyDetailText, { fontSize: 5.0 }]}>Ph: {company.phone}</Text>}
              {company.phone && company.email && <Text style={[s.companyDetailText, { marginHorizontal: 4, color: "#cbd5e1", fontSize: 5.0 }]}>|</Text>}
              {company.email && <Text style={[s.companyDetailText, { fontSize: 5.0 }]}>Email: {company.email}</Text>}
            </View>
            <View style={{ flexDirection: "row", marginTop: 4, backgroundColor: "#f8fafc", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 0.5, borderColor: "#e2e8f0", alignItems: "center" }}>
              <Text style={[s.companyDetailText, { fontWeight: "bold", color: "#0f172a", fontSize: 5.5 }]}>GSTIN: {company.gstin || "URD"}</Text>
              {company.pan && <Text style={[s.companyDetailText, { marginHorizontal: 4, color: "#cbd5e1", fontSize: 5.5 }]}>|</Text>}
              {company.pan && <Text style={[s.companyDetailText, { fontWeight: "bold", color: "#0f172a", fontSize: 5.5 }]}>PAN: {company.pan}</Text>}
            </View>
          </View>
        </View>

        {/* Info Grid (Bill To & Meta Details) */}
        <View style={styles.infoSection}>
          <View style={styles.billTo}>
            <Text style={styles.sectionTitle}>Bill To (Recipient)</Text>
            <Text style={[styles.boldText, { fontSize: 10 }]}>{customer.companyName || customer.name}</Text>
            {customer.companyName && <Text>Attn: {customer.name}</Text>}
            <Text style={{ marginTop: 2, fontSize: 8 }}>{customer.address}</Text>
            <Text style={{ marginTop: 4, fontWeight: "bold" }}>GSTIN: {customer.gstin || "URD (Unregistered)"}</Text>
            <Text>Place of Supply (State): {customer.state}</Text>
          </View>
          <View style={styles.invoiceMeta}>
            <Text style={styles.sectionTitle}>Invoice Info</Text>
            <View style={styles.metaGrid}>
              <Text style={styles.metaLabel}>Invoice No:</Text>
              <Text style={[styles.metaVal, styles.boldText]}>{invoice.invoiceNumber || "DRAFT"}</Text>
            </View>
            <View style={styles.metaGrid}>
              <Text style={styles.metaLabel}>Date:</Text>
              <Text style={styles.metaVal}>
                {new Date(invoice.invoiceDate).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                })}
              </Text>
            </View>
            {invoice.dueDate && (
              <View style={styles.metaGrid}>
                <Text style={styles.metaLabel}>Due Date:</Text>
                <Text style={styles.metaVal}>
                  {new Date(invoice.dueDate).toLocaleDateString("en-IN", {
                    day: "2-digit",
                    month: "2-digit",
                    year: "numeric",
                  })}
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Invoiced Items Table */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={styles.colSl}>#</Text>
            <Text style={styles.colDesc}>Description of Services/Goods</Text>
            <Text style={styles.colHsn}>HSN/SAC</Text>
            <Text style={styles.colQty}>Qty</Text>
            <Text style={styles.colRate}>Rate</Text>
            {isIntrastate ? (
              <View style={{ flexDirection: "row", width: "18%" }}>
                <Text style={[styles.colCgst, { width: "50%" }]}>CGST</Text>
                <Text style={[styles.colSgst, { width: "50%" }]}>SGST</Text>
              </View>
            ) : (
              <Text style={styles.colIgst}>IGST</Text>
            )}
            <Text style={styles.colAmt}>Total (₹)</Text>
          </View>

          {invoice.items.map((item: any, idx: number) => {
            return (
              <View key={item.id || idx} style={styles.tableRow}>
                <Text style={styles.colSl}>{idx + 1}</Text>
                <Text style={styles.colDesc}>{item.description}</Text>
                <Text style={styles.colHsn}>{item.product?.hsnCode || item.hsnCode || "—"}</Text>
                <Text style={styles.colQty}>{Number(item.qty)} {item.unit}</Text>
                <Text style={styles.colRate}>₹{Number(item.rate).toFixed(2)}</Text>
                {isIntrastate ? (
                  <View style={{ flexDirection: "row", width: "18%" }}>
                    <View style={[styles.colCgst, { width: "50%", flexDirection: "column", alignItems: "center" }]}>
                      <Text style={{ fontSize: 7, color: "#64748b" }}>{(Number(item.gstPercent) / 2)}%</Text>
                      <Text style={{ fontSize: 8, fontWeight: "bold" }}>₹{Number(item.cgst).toFixed(2)}</Text>
                    </View>
                    <View style={[styles.colSgst, { width: "50%", flexDirection: "column", alignItems: "center" }]}>
                      <Text style={{ fontSize: 7, color: "#64748b" }}>{(Number(item.gstPercent) / 2)}%</Text>
                      <Text style={{ fontSize: 8, fontWeight: "bold" }}>₹{Number(item.sgst).toFixed(2)}</Text>
                    </View>
                  </View>
                ) : (
                  <View style={[styles.colIgst, { flexDirection: "column", alignItems: "center" }]}>
                    <Text style={{ fontSize: 7, color: "#64748b" }}>{Number(item.gstPercent)}%</Text>
                    <Text style={{ fontSize: 8, fontWeight: "bold" }}>₹{Number(item.igst).toFixed(2)}</Text>
                  </View>
                )}
                <Text style={styles.colAmt}>₹{Number(item.amount).toFixed(2)}</Text>
              </View>
            );
          })}
        </View>

        {/* Calculation summary block */}
        <View style={styles.summaryContainer}>
          <View style={styles.amountInWordsBox}>
            <Text style={styles.sectionTitle}>Amount in Words (INR)</Text>
            <Text style={[styles.boldText, { fontSize: 8.5 }]}>{invoice.amountInWords}</Text>
          </View>
          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text style={[styles.metaLabel, styles.totalRowText]}>Total Amount Before Tax:</Text>
              <Text style={styles.totalRowText}>₹{Number(invoice.subTotal).toFixed(2)}</Text>
            </View>
            {Number(invoice.discountTotal) > 0 && (
              <View style={styles.totalRow}>
                <Text style={[styles.metaLabel, styles.totalRowText]}>Discount:</Text>
                <Text style={styles.totalRowText}>-₹{Number(invoice.discountTotal).toFixed(2)}</Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={[styles.metaLabel, styles.totalRowText]}>CGST ({cgstRate}%):</Text>
              <Text style={styles.totalRowText}>₹{Number(invoice.cgstTotal).toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={[styles.metaLabel, styles.totalRowText]}>SGST ({sgstRate}%):</Text>
              <Text style={styles.totalRowText}>₹{Number(invoice.sgstTotal).toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={[styles.metaLabel, styles.totalRowText]}>IGST ({igstRate}%):</Text>
              <Text style={styles.totalRowText}>₹{Number(invoice.igstTotal).toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={[styles.metaLabel, styles.totalRowText]}>Total Tax Amount:</Text>
              <Text style={styles.totalRowText}>₹{totalTaxVal.toFixed(2)}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={[styles.metaLabel, styles.totalRowText]}>Round Off:</Text>
              <Text style={styles.totalRowText}>₹{roundOffVal.toFixed(2)}</Text>
            </View>
            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalRowText}>Total Amount After Tax:</Text>
              <Text style={styles.grandTotalRowText}>₹{Number(invoice.grandTotal).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</Text>
            </View>
          </View>
        </View>

        {/* Direct Banking Details Block */}
        <View style={styles.bankContainer}>
          <Text style={styles.sectionTitle}>Banking details (For Bank Transfer/Direct Pay)</Text>
          <View style={styles.bankGrid}>
            <View style={styles.bankItem}>
              <Text style={styles.bankItemText}><Text style={{ color: "#64748b" }}>Bank Name: </Text>{company.bankName || "—"}</Text>
              <Text style={styles.bankItemText}><Text style={{ color: "#64748b" }}>Account No: </Text>{company.bankAccount || "—"}</Text>
            </View>
            <View style={styles.bankItem}>
              <Text style={styles.bankItemText}><Text style={{ color: "#64748b" }}>IFSC Code: </Text>{company.ifsc || "—"}</Text>
              <Text style={styles.bankItemText}><Text style={{ color: "#64748b" }}>UPI ID: </Text>{company.upiId || "—"}</Text>
            </View>
          </View>
        </View>

        {/* Signatures & Seal Footer */}
        <View style={styles.footer}>
          <View style={styles.termsBox}>
            <Text style={styles.sectionTitle}>Terms & Conditions</Text>
            <View style={{ gap: 2 }}>
              {(invoice.terms || company.termsDefault || "1. Goods once sold will not be taken back.\n2. Interest @ 18% will be charged for delayed payment.")
                .split("\n")
                .map((line: string, i: number) => (
                  <Text key={i} style={{ fontSize: 7, color: "#64748b" }}>
                    {line}
                  </Text>
                ))}
            </View>
          </View>
          <View style={styles.signBox}>
            {company.sealUrl && (
              <Image src={company.sealUrl} style={styles.sealImg} />
            )}
            <Text style={[styles.sectionTitle, { marginBottom: 15 }]}>For {company.name}</Text>
            {company.signatureUrl ? (
              <Image src={company.signatureUrl} style={styles.signatureImg} />
            ) : (
              <View style={{ height: 35 }} /> // Blank spacing to sign manually
            )}
            <Text style={{ fontSize: 8, borderTopWidth: 0.5, borderTopColor: "#94a3b8", width: "100%", textAlign: "center", paddingTop: 3 }}>
              Authorized Signatory
            </Text>
          </View>
        </View>

        <Text style={styles.disclaimer}>
          This is a Computer Generated Document and does not require a physical signature unless stamp verified.
        </Text>
      </Page>
    </Document>
  );
};
