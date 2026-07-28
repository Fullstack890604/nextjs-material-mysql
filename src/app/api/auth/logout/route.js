import { apiOk } from "@/lib/apiResponse";
import { cookies } from "next/headers";
import {
  verifySessionToken,
  SESSION_COOKIE,
  REFRESH_COOKIE,
} from "@/lib/session";
import { clearCurrentSession } from "@/lib/sessionStore";

export const runtime = "nodejs";

/** POST: đăng xuất — xóa phiên hiện hành trong DB + xóa cookie phiên. */
export async function POST() {
  const store = await cookies();

  // Xóa phiên hiện hành trong DB (nếu đọc được username từ token còn hạn)
  try {
    const token =
      store.get(SESSION_COOKIE)?.value || store.get(REFRESH_COOKIE)?.value || null;
    const payload = await verifySessionToken(token);
    if (payload?.username) await clearCurrentSession(payload.username);
  } catch {
    // bỏ qua — vẫn tiếp tục xóa cookie
  }

  const opts = {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
    secure: process.env.COOKIE_SECURE === "true",
  };
  store.set(SESSION_COOKIE, "", opts);
  store.set(REFRESH_COOKIE, "", opts);
  return apiOk(null, "Đăng xuất thành công");
}
