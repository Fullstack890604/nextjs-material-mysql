import { verifySessionToken, SESSION_COOKIE } from "@/lib/session";
import { isSessionCurrent } from "@/lib/sessionStore";

export const runtime = "nodejs";

/**
 * GET: kiểm tra token có phải phiên hiện hành không (Cách 1 — 1 phiên/tài khoản).
 * Dùng nội bộ cho middleware. Nguồn token: Authorization: Bearer > cookie phiên.
 *
 * - 200: phiên hợp lệ và là phiên mới nhất.
 * - 401: token hỏng, hoặc đã bị đăng nhập ở nơi khác (sid không khớp).
 */
export async function GET(request) {
  let token = request.cookies.get(SESSION_COOKIE)?.value || null;
  const authHeader = request.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) token = authHeader.slice(7).trim();

  const payload = await verifySessionToken(token);
  if (!payload || !payload.username) {
    return Response.json({ status: "FAILED" }, { status: 401 });
  }

  const ok = await isSessionCurrent(payload.username, payload.sid);
  return Response.json({ status: ok ? "OK" : "FAILED" }, {
    status: ok ? 200 : 401,
  });
}
