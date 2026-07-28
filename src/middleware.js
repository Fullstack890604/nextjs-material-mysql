import { NextResponse } from "next/server";
import {
  createSessionToken,
  verifySessionToken,
  SESSION_COOKIE,
  REFRESH_COOKIE,
  ACCESS_MAX_AGE,
} from "@/lib/session";

/**
 * Bảo vệ mọi API (/api/*) yêu cầu phải có phiên đăng nhập hợp lệ,
 * ngoại trừ các endpoint xác thực (đăng nhập / đăng xuất / cấp lại token).
 *
 * Với web UI (cookie): nếu access token hết hạn nhưng refresh token còn hạn,
 * middleware tự cấp lại access token mới (đính kèm Set-Cookie) để người dùng
 * tiếp tục sử dụng mà không phải đăng nhập lại.
 */

// Các endpoint API không yêu cầu đăng nhập
const PUBLIC_API = new Set([
  "/api/auth/login",
  "/api/auth/logout",
  "/api/auth/refresh",
  "/api/auth/session-check",
  "/api/auth/session-stream",
]);

/** JSON 401 thống nhất cho middleware. */
function unauthorized(message = "Phiên đăng nhập không hợp lệ hoặc đã hết hạn") {
  return NextResponse.json(
    {
      status: "FAILED",
      title: "Chưa đăng nhập",
      severity: "warning",
      message,
      data: null,
    },
    { status: 401 }
  );
}

/**
 * Cách 1 (1 phiên/tài khoản): hỏi endpoint Node (có DB) xem token còn là
 * phiên hiện hành không. Middleware chạy ở Edge nên không nối SQL trực tiếp.
 * Fail-open khi lỗi mạng để tránh khóa nhầm toàn hệ thống.
 */
async function isSessionCurrent(origin, token) {
  try {
    const res = await fetch(`${origin}/api/auth/session-check`, {
      headers: { authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (res.status === 401) return false;
    return true;
  } catch {
    return true;
  }
}

export async function middleware(request) {
  const { pathname } = request.nextUrl;

  if (!pathname.startsWith("/api/") || PUBLIC_API.has(pathname)) {
    return NextResponse.next();
  }

  const origin = request.nextUrl.origin;

  // 1) Lấy access token: ưu tiên Bearer (API mở), rồi tới cookie phiên (web UI)
  let accessToken = request.cookies.get(SESSION_COOKIE)?.value;
  const authHeader = request.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    accessToken = authHeader.slice(7).trim();
  }

  const access = await verifySessionToken(accessToken);
  if (access && access.type !== "refresh") {
    if (!(await isSessionCurrent(origin, accessToken))) {
      return unauthorized("Tài khoản đã đăng nhập ở nơi khác");
    }
    return NextResponse.next();
  }

  // 2) Access token hết hạn/không hợp lệ → thử tự gia hạn bằng refresh cookie (web UI)
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  const refresh = await verifySessionToken(refreshToken);
  if (refresh && refresh.type === "refresh") {
    if (!(await isSessionCurrent(origin, refreshToken))) {
      return unauthorized("Tài khoản đã đăng nhập ở nơi khác");
    }
    const newAccess = await createSessionToken(
      {
        username: refresh.username,
        name: refresh.name,
        isAdmin: refresh.isAdmin === true,
        sid: refresh.sid,
        type: "access",
      },
      ACCESS_MAX_AGE
    );
    const res = NextResponse.next();
    res.cookies.set(SESSION_COOKIE, newAccess, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: ACCESS_MAX_AGE,
      secure: process.env.COOKIE_SECURE === "true",
    });
    return res;
  }

  // 3) Không có phiên hợp lệ
  return unauthorized();
}

export const config = {
  matcher: ["/api/:path*"],
};
