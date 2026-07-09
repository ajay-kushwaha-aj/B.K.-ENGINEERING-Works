import { calculateGstSplit, convertNumberToIndianWords } from "./gst";

console.log("=== Running GST split calculations validation tests ===");

// Test Case 1: Intrastate GST Split
console.log("\nTest Case 1: Intrastate Split (Maharashtra to Maharashtra, 18% GST)");
const res1 = calculateGstSplit(1000, 5, 100, 18, "Maharashtra", "Maharashtra");
console.log("Expected: subtotal=4900, cgst=441, sgst=441, igst=0, grandTotal=5782");
console.log(`Actual:   subtotal=${res1.taxableAmount}, cgst=${res1.cgst}, sgst=${res1.sgst}, igst=${res1.igst}, grandTotal=${res1.totalAmount}`);
const ok1 = res1.taxableAmount === 4900 && res1.cgst === 441 && res1.sgst === 441 && res1.igst === 0 && res1.totalAmount === 5782;
console.log(`Result: ${ok1 ? "PASSED" : "FAILED"}`);

// Test Case 2: Interstate GST Split
console.log("\nTest Case 2: Interstate Split (Maharashtra to Gujarat, 18% GST)");
const res2 = calculateGstSplit(1000, 5, 100, 18, "Maharashtra", "Gujarat");
console.log("Expected: subtotal=4900, cgst=0, sgst=0, igst=882, grandTotal=5782");
console.log(`Actual:   subtotal=${res2.taxableAmount}, cgst=${res2.cgst}, sgst=${res2.sgst}, igst=${res2.igst}, grandTotal=${res2.totalAmount}`);
const ok2 = res2.taxableAmount === 4900 && res2.cgst === 0 && res2.sgst === 0 && res2.igst === 882 && res2.totalAmount === 5782;
console.log(`Result: ${ok2 ? "PASSED" : "FAILED"}`);

// Test Case 3: Indian Currency Spelling
console.log("\nTest Case 3: Number to Words conversion (150345.50)");
const words1 = convertNumberToIndianWords(150345.50);
console.log("Expected: One Lakh Fifty Thousand Three Hundred Forty Five Rupees and Fifty Paisa Only");
console.log(`Actual:   ${words1}`);
const ok3 = words1.toLowerCase() === "one lakh fifty thousand three hundred forty five rupees and fifty paisa only";
console.log(`Result: ${ok3 ? "PASSED" : "FAILED"}`);

if (ok1 && ok2 && ok3) {
  console.log("\n=== ALL UNIT TESTS PASSED ===");
  process.exit(0);
} else {
  console.error("\n=== SOME UNIT TESTS FAILED ===");
  process.exit(1);
}
