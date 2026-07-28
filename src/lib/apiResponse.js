import { NextResponse } from "next/server";

/** PascalCase -> camelCase (chỉ đổi ký tự đầu) */
const toCamelCase = (str) => {
  if (!str || typeof str !== "string") return str;
  return str.charAt(0).toLowerCase() + str.slice(1);
};

/** camelCase -> PascalCase (chỉ đổi ký tự đầu) */
const toPascalCase = (str) => {
  if (!str || typeof str !== "string") return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
};

/** Đổi toàn bộ key của object/array sang camelCase (cho Response) */
export const keysToCamelCase = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map((item) => keysToCamelCase(item));
  if (typeof obj === "object" && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      result[toCamelCase(key)] = keysToCamelCase(obj[key]);
      return result;
    }, {});
  }
  return obj;
};

/** Đổi toàn bộ key của object/array sang PascalCase (cho Request/Model) */
export const keysToPascalCase = (obj) => {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) return obj.map((item) => keysToPascalCase(item));
  if (typeof obj === "object" && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      result[toPascalCase(key)] = keysToPascalCase(obj[key]);
      return result;
    }, {});
  }
  return obj;
};

/**
 * Response thành công.
 * { status:"OK", title, severity:"success", message, [count], data }
 */
export function apiOk(
  data = null,
  message = "Thành công",
  {
    title = "Success",
    severity = "success",
    httpStatus = 200,
    convertKeys = true,
  } = {}
) {
  const response = { status: "OK", title, severity, message };

  if (Array.isArray(data)) {
    response.count = data.length;
  }
  response.data = data !== null && convertKeys ? keysToCamelCase(data) : data;

  return NextResponse.json(response, { status: httpStatus });
}

/**
 * Response thất bại / không có dữ liệu.
 * { status:"FAILED", title, severity, message, data:null }
 */
export function apiFail(
  message = "Đã xảy ra lỗi",
  {
    title = "Error",
    severity = "error",
    httpStatus = 400,
    data = null,
    status = "FAILED",
  } = {}
) {
  return NextResponse.json(
    { status, title, severity, message, data },
    { status: httpStatus }
  );
}
