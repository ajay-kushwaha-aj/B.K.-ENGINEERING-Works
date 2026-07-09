export interface GstSplitResult {
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  totalAmount: number;
}

/**
 * Calculates GST splits based on company state vs customer state.
 */
export function calculateGstSplit(
  rate: number,
  qty: number,
  discount: number, // monetary discount per unit or total? Usually total discount on line item. Let's treat it as total discount on line item.
  gstPercent: number,
  companyState: string,
  customerState: string
): GstSplitResult {
  const taxableAmount = Math.max(0, rate * qty - discount);
  const totalGst = (taxableAmount * gstPercent) / 100;
  
  const isIntrastate = companyState.trim().toLowerCase() === customerState.trim().toLowerCase();

  let cgst = 0;
  let sgst = 0;
  let igst = 0;

  if (isIntrastate) {
    cgst = totalGst / 2;
    sgst = totalGst / 2;
  } else {
    igst = totalGst;
  }

  // Rounded to 2 decimal places to avoid JS floating point errors
  const round = (num: number) => Math.round((num + Number.EPSILON) * 100) / 100;

  return {
    taxableAmount: round(taxableAmount),
    cgst: round(cgst),
    sgst: round(sgst),
    igst: round(igst),
    totalGst: round(totalGst),
    totalAmount: round(taxableAmount + totalGst),
  };
}

/**
 * Converts a numeric amount to Indian words format (lakhs/crores).
 */
export function convertNumberToIndianWords(num: number): string {
  const ones = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const tens = [
    "", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"
  ];

  function convertLessThanOneThousand(n: number): string {
    let str = "";
    if (n >= 100) {
      str += ones[Math.floor(n / 100)] + " Hundred ";
      n %= 100;
    }
    if (n >= 20) {
      str += tens[Math.floor(n / 10)] + " ";
      n %= 10;
    }
    if (n > 0) {
      str += ones[n] + " ";
    }
    return str.trim();
  }

  // Handle integers and paisa (decimals)
  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  if (integerPart === 0 && decimalPart === 0) {
    return "Zero Rupees Only";
  }

  let words = "";

  const crore = Math.floor(integerPart / 10000000);
  let remaining = integerPart % 10000000;

  const lakh = Math.floor(remaining / 100000);
  remaining %= 100000;

  const thousand = Math.floor(remaining / 1000);
  remaining %= 1000;

  if (crore > 0) {
    words += convertLessThanOneThousand(crore) + " Crore ";
  }
  if (lakh > 0) {
    words += convertLessThanOneThousand(lakh) + " Lakh ";
  }
  if (thousand > 0) {
    words += convertLessThanOneThousand(thousand) + " Thousand ";
  }
  if (remaining > 0) {
    words += convertLessThanOneThousand(remaining) + " ";
  }

  words = words.trim() + " Rupees";

  if (decimalPart > 0) {
    words += " and " + convertLessThanOneThousand(decimalPart) + " Paisa";
  }

  return words + " Only";
}

export const INDIAN_STATES = [
  "Andaman and Nicobar Islands",
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chandigarh",
  "Chhattisgarh",
  "Dadra and Nagar Haveli and Daman and Diu",
  "Delhi",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jammu and Kashmir",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Ladakh",
  "Lakshadweep",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Puducherry",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal"
];
