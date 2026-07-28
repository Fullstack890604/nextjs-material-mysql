import { queryOne } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { apiOk, apiFail } from "@/lib/apiResponse";
import { cookies } from "next/headers";
import { setCurrentSession } from "@/lib/sessionStore";
import { kickOthers, setLastLogin } from "@/lib/sessionBus";
import { describeDevice } from "@/lib/deviceInfo";
import {
  createSessionToken,
  SESSION_COOKIE,
  REFRESH_COOKIE,
  ACCESS_MAX_AGE,
  REFRESH_MAX_AGE,
} from "@/lib/session";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { username, password } = await request.json();

    if (!username || !password) {
      return apiFail("Vui lòng nhập tài khoản và mật khẩu", {
        title: "Thiếu thông tin",
        severity: "warning",
        httpStatus: 400,
      });
    }

    const account = await queryOne(
      `SELECT \`UserName\`, \`Password\`, \`Description\`, \`IsAdmin\`,
              \`Locked\`, \`Status\`, \`DefaultPage\`, \`StoreCode\`, \`EmployeeCode\`
         FROM \`SysAccounts\`
        WHERE \`UserName\` = :username
        LIMIT 1`,
      { username }
    );

    // Không tiết lộ tài khoản có tồn tại hay không
    if (!account || !verifyPassword(password, account.Password)) {
      return apiFail("Tài khoản hoặc mật khẩu không đúng", {
        title: "Đăng nhập thất bại",
        severity: "error",
        httpStatus: 401,
      });
    }

    if (account.Locked === true) {
      return apiFail("Tài khoản đã bị khóa", {
        title: "Bị khóa",
        severity: "warning",
        httpStatus: 403,
      });
    }

    if ((account.Status || "").trim().toLowerCase() === "inactive") {
      return apiFail("Tài khoản chưa được kích hoạt", {
        title: "Chưa kích hoạt",
        severity: "warning",
        httpStatus: 403,
      });
    }

    const user = {
      username: account.UserName,
      name: account.Description || account.UserName,
      isAdmin: account.IsAdmin === true,
      storeCode: account.StoreCode || null,
      employeeCode: account.EmployeeCode || null,
      defaultPage: account.DefaultPage || "/",
    };

    // Cách 1: sinh phiên hiện hành mới, ghi vào DB (đá phiên cũ ở máy khác).
    const sid = crypto.randomUUID();
    await setCurrentSession(user.username, sid);

    // Thông tin thiết bị đăng nhập (để hiển thị cho thiết bị bị đá).
    const ua = request.headers.get("user-agent") || "";
    const ipHeader =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "";
    const { browser, os } = describeDevice(ua);
    const deviceInfo = {
      browser,
      os,
      ip: ipHeader.split(",")[0].trim() || null,
      at: new Date().toISOString(),
    };
    setLastLogin(user.username, deviceInfo);
    // Đẩy sự kiện SSE để đá thiết bị cũ tức thì (nếu đang mở kết nối).
    kickOthers(user.username, sid, deviceInfo);

    // Cấp phiên: access token ngắn hạn + refresh token dài hạn (đều ký HMAC)
    const accessToken = await createSessionToken(
      { username: user.username, name: user.name, isAdmin: user.isAdmin, sid, type: "access" },
      ACCESS_MAX_AGE
    );
    const refreshToken = await createSessionToken(
      { username: user.username, name: user.name, isAdmin: user.isAdmin, sid, type: "refresh" },
      REFRESH_MAX_AGE
    );

    const secure = process.env.COOKIE_SECURE === "true";
    const store = await cookies();
    store.set(SESSION_COOKIE, accessToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: ACCESS_MAX_AGE,
      secure,
    });
    store.set(REFRESH_COOKIE, refreshToken, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: REFRESH_MAX_AGE,
      secure,
    });

    // Trả token trong body để client (mobile / API bên thứ ba) dùng
    // với header: Authorization: Bearer <token>
    return apiOk(
      {
        ...user,
        token: accessToken,
        refreshToken,
        tokenType: "Bearer",
        expiresIn: ACCESS_MAX_AGE,
      },
      "Đăng nhập thành công"
    );
  } catch (err) {
    console.error("[api/auth/login] error:", err);
    return apiFail("Lỗi kết nối máy chủ. Vui lòng thử lại.", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}
