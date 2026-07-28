/**
 * formatNumber(1000000, { type: "currency", currency: "VND" })      -> "1.000.000 đ"
 * formatNumber(1000000, { type: "currency", currency: "VND", compact: true }) -> "1.0M đ"
 * formatNumber(1000, { type: "quantity" })                          -> "1.000"
 * formatNumber(75.5, { type: "percent" })                           -> "75,5%"
 */
export const formatNumber = (value, options = {}) => {
  const {
    type = "quantity", // "quantity" | "currency" | "percent"
    currency = "VND", // "VND" | "USD"
    compact = false,
    decimals,
    toFixed = 1, // số chữ số thập phân khi compact
    showPositiveSign = false, // chỉ áp dụng cho percent
  } = options;

  if (value === null || value === undefined || isNaN(value)) return "0";

  const numValue = Number(value);

  if (type === "percent") {
    const percentDecimals = decimals !== undefined ? decimals : 1;

    if (compact) {
      const formatted = numValue.toFixed(percentDecimals);
      return showPositiveSign && numValue > 0 ? `+${formatted}%` : `${formatted}%`;
    }

    const formatter = new Intl.NumberFormat("vi-VN", {
      style: "percent",
      minimumFractionDigits: percentDecimals,
      maximumFractionDigits: percentDecimals,
      signDisplay: showPositiveSign ? "exceptZero" : "auto",
    });
    return formatter.format(numValue / 100);
  }

  if (compact) {
    const symbol = type === "currency" ? (currency === "VND" ? " đ" : "") : "";
    const prefix = type === "currency" && currency === "USD" ? "$" : "";
    if (numValue >= 1000000000) return prefix + (numValue / 1000000000).toFixed(toFixed) + "B" + symbol;
    if (numValue >= 1000000) return prefix + (numValue / 1000000).toFixed(toFixed) + "M" + symbol;
    if (numValue >= 1000) return prefix + (numValue / 1000).toFixed(toFixed) + "K" + symbol;
    return prefix + numValue.toFixed(toFixed) + symbol;
  }

  const decimalPoints = decimals !== undefined ? decimals : currency === "USD" ? 2 : 0;
  const formatter = new Intl.NumberFormat(currency === "VND" ? "vi-VN" : "en-US", {
    minimumFractionDigits: decimalPoints,
    maximumFractionDigits: decimalPoints,
    ...(type === "currency" && {
      style: "currency",
      currency,
      currencyDisplay: "symbol",
    }),
  });

  let formatted = formatter.format(numValue);
  if (currency === "VND" && type === "currency") formatted = formatted.replace("₫", "đ");
  return formatted;
};

const DIGIT_WORDS = ["không", "một", "hai", "ba", "bốn", "năm", "sáu", "bảy", "tám", "chín"];

// Đọc 1 nhóm 3 chữ số (0-999). `isLeadingGroup` = true khi đây là nhóm có nghĩa
// đầu tiên (từ trái sang) của cả số — nhóm này bỏ qua "không trăm"/"linh" mở đầu,
// các nhóm phía sau vẫn phải đọc đủ để không bị hiểu nhầm (vd: 1.000.045.000 ->
// "Một tỷ không trăm bốn mươi lăm ngàn đồng").
const readGroupOfThree = (num, isLeadingGroup) => {
  const tram = Math.floor(num / 100);
  const chuc = Math.floor((num % 100) / 10);
  const donVi = num % 10;
  const parts = [];

  if (tram > 0) {
    parts.push(DIGIT_WORDS[tram], "trăm");
  } else if (!isLeadingGroup) {
    parts.push("không trăm");
  }

  if (chuc >= 2) {
    parts.push(DIGIT_WORDS[chuc], "mươi");
    if (donVi === 1) parts.push("mốt");
    else if (donVi === 5) parts.push("lăm");
    else if (donVi > 0) parts.push(DIGIT_WORDS[donVi]);
  } else if (chuc === 1) {
    parts.push("mười");
    if (donVi === 5) parts.push("lăm");
    else if (donVi > 0) parts.push(DIGIT_WORDS[donVi]);
  } else if (donVi > 0) {
    if (tram > 0 || !isLeadingGroup) parts.push("linh");
    parts.push(DIGIT_WORDS[donVi]);
  }

  return parts.join(" ");
};

// Tên đơn vị của nhóm thứ `groupIndex` (0 = nhóm đơn vị, tính từ phải sang trái),
// lặp lại "tỷ" cho các bậc lớn hơn nghìn tỷ/triệu tỷ/tỷ tỷ...
const groupScaleName = (groupIndex) => {
  if (groupIndex === 0) return "";
  const base = ["", "ngàn", "triệu"][groupIndex % 3];
  const tySuffix = Array(Math.floor(groupIndex / 3)).fill("tỷ").join(" ");
  return [base, tySuffix].filter(Boolean).join(" ");
};

/**
 * numberToWords(1500245124) -> "Một tỷ năm trăm triệu hai trăm bốn mươi lăm ngàn một trăm hai mươi bốn đồng"
 * numberToWords(0)          -> "Không đồng"
 * numberToWords(-500, { unit: "" }) -> "Âm năm trăm"
 */
export const numberToWords = (value, options = {}) => {
  const { unit = "đồng" } = options;
  if (value === null || value === undefined || isNaN(value)) return "";

  const isNegative = Number(value) < 0;
  const intValue = Math.round(Math.abs(Number(value)));

  if (intValue === 0) return unit ? `Không ${unit}` : "Không";

  const groups = [];
  let remaining = intValue;
  while (remaining > 0) {
    groups.push(remaining % 1000);
    remaining = Math.floor(remaining / 1000);
  }

  const words = [];
  let hasOutputAny = false;
  for (let i = groups.length - 1; i >= 0; i--) {
    const group = groups[i];
    if (group === 0) continue;
    const groupText = readGroupOfThree(group, !hasOutputAny);
    const scaleName = groupScaleName(i);
    words.push(scaleName ? `${groupText} ${scaleName}` : groupText);
    hasOutputAny = true;
  }

  let text = words.join(" ");
  if (isNegative) text = `âm ${text}`;
  text = text.charAt(0).toUpperCase() + text.slice(1);
  return unit ? `${text} ${unit}` : text;
};
