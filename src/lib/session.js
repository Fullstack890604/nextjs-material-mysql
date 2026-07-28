/**
 * Quản lý phiên đăng nhập bằng token ký HMAC-SHA256 (stateless).
 * Dùng Web Crypto (globalThis.crypto.subtle) nên chạy được cả trong
 * Edge middleware lẫn Node route handler.
 *
 * Token dạng: base64url(payloadJSON) + "." + base64url(HMAC)
 */

export const SESSION_COOKIE = "crm_session";
export const REFRESH_COOKIE = "crm_refresh";

// Access token ngắn hạn (30 phút) + refresh token dài hạn (7 ngày)
export const ACCESS_MAX_AGE = 60 * 30;
export const REFRESH_MAX_AGE = 60 * 60 * 24 * 7;

// Giữ tương thích tên cũ
export const SESSION_MAX_AGE = ACCESS_MAX_AGE;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function bytesToBase64Url(bytes) {
  const arr = new Uint8Array(bytes);
  let binary = "";
  for (let i = 0; i < arr.length; i += 1) {
    binary += String.fromCharCode(arr[i]);
  }
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(str) {
  const normalized = str.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "="
  );
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

async function getKey() {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    // Chặn khởi động với secret rỗng để tránh token dễ đoán
    throw new Error(
      "Thiếu biến môi trường SESSION_SECRET để ký phiên đăng nhập"
    );
  }
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

/** Tạo token phiên đã ký từ payload (username, name, isAdmin...). */
export async function createSessionToken(payload, maxAgeSec = SESSION_MAX_AGE) {
  const body = {
    ...payload,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + maxAgeSec,
  };
  const payloadB64 = bytesToBase64Url(encoder.encode(JSON.stringify(body)));
  const key = await getKey();
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(payloadB64)
  );
  return `${payloadB64}.${bytesToBase64Url(signature)}`;
}

/** Xác thực token; trả về payload nếu hợp lệ & chưa hết hạn, ngược lại null. */
export async function verifySessionToken(token) {
  if (!token || typeof token !== "string" || !token.includes(".")) return null;
  const [payloadB64, signatureB64] = token.split(".");
  if (!payloadB64 || !signatureB64) return null;

  try {
    const key = await getKey();
    const valid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlToBytes(signatureB64),
      encoder.encode(payloadB64)
    );
    if (!valid) return null;

    const body = JSON.parse(decoder.decode(base64UrlToBytes(payloadB64)));
    if (body.exp && body.exp < Math.floor(Date.now() / 1000)) return null;
    return body;
  } catch {
    return null;
  }
}
