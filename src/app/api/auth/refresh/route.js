import { apiOk, apiFail } from "@/lib/apiResponse";
import { cookies } from "next/headers";
import { isSessionCurrent } from "@/lib/sessionStore";
import {
  createSessionToken,
  verifySessionToken,
  SESSION_COOKIE,
  REFRESH_COOKIE,
  ACCESS_MAX_AGE,
  REFRESH_MAX_AGE,
} from "@/lib/session";

export const runtime = "nodejs";

/**
 * POST: cấp lại access token từ refresh token.
 * Nguồn refresh token (ưu tiên): body.refreshToken > Authorization: Bearer > cookie.
 * Đồng thời xoay vòng (rotate) refresh token để tăng bảo mật.
 */
export async function POST(request) {
  try {
    const store = await cookies();

    let refreshToken = null;
    try {
      const body = await request.json();
      if (body && typeof body.refreshToken === "string") {
        refreshToken = body.refreshToken;
      }
    } catch {
      // không có body JSON — bỏ qua
    }

    if (!refreshToken) {
      const authHeader = request.headers.get("authorization") || "";
      if (authHeader.startsWith("Bearer ")) refreshToken = authHeader.slice(7).trim();
    }
    if (!refreshToken) {
      refreshToken = store.get(REFRESH_COOKIE)?.value || null;
    }

    const payload = await verifySessionToken(refreshToken);
    if (!payload || payload.type !== "refresh") {
      return apiFail("Refresh token không hợp lệ hoặc đã hết hạn", {
        title: "Không hợp lệ",
        severity: "warning",
        httpStatus: 401,
      });
    }

    // Cách 1: chỉ chấp nhận nếu đây vẫn là phiên hiện hành của tài khoản.
    const stillCurrent = await isSessionCurrent(payload.username, payload.sid);
    if (!stillCurrent) {
      const secure = process.env.COOKIE_SECURE === "true";
      const clearOpts = {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        maxAge: 0,
        secure,
      };
      store.set(SESSION_COOKIE, "", clearOpts);
      store.set(REFRESH_COOKIE, "", clearOpts);
      return apiFail("Tài khoản đã đăng nhập ở nơi khác", {
        title: "Phiên kết thúc",
        severity: "warning",
        httpStatus: 401,
      });
    }

    const userClaims = {
      username: payload.username,
      name: payload.name,
      isAdmin: payload.isAdmin === true,
      sid: payload.sid,
    };

    const newAccess = await createSessionToken(
      { ...userClaims, type: "access" },
      ACCESS_MAX_AGE
    );
    const newRefresh = await createSessionToken(
      { ...userClaims, type: "refresh" },
      REFRESH_MAX_AGE
    );

    const secure = process.env.COOKIE_SECURE === "true";
    store.set(SESSION_COOKIE, newAccess, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: ACCESS_MAX_AGE,
      secure,
    });
    store.set(REFRESH_COOKIE, newRefresh, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: REFRESH_MAX_AGE,
      secure,
    });

    return apiOk(
      {
        token: newAccess,
        refreshToken: newRefresh,
        tokenType: "Bearer",
        expiresIn: ACCESS_MAX_AGE,
      },
      "Cấp lại token thành công"
    );
  } catch (err) {
    console.error("[api/auth/refresh] error:", err);
    return apiFail("Lỗi cấp lại token", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}
