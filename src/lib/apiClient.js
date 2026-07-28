"use client";

/**
 * Client xác thực phía trình duyệt.
 * - Lưu access/refresh token trong localStorage.
 * - Vá window.fetch để tự đính kèm `Authorization: Bearer <token>` cho MỌI
 *   request tới /api/ (trừ login/refresh), và tự gọi refresh + thử lại 1 lần
 *   khi gặp 401. Nếu refresh thất bại thì xóa phiên & chuyển về /login.
 */

export const USER_KEY = "crm_auth_user";
export const TOKEN_KEY = "crm_access_token";
export const REFRESH_KEY = "crm_refresh_token";

export function saveSession(data) {
  if (!data) return;
  try {
    localStorage.setItem(USER_KEY, JSON.stringify(data));
    if (data.token) localStorage.setItem(TOKEN_KEY, data.token);
    if (data.refreshToken) localStorage.setItem(REFRESH_KEY, data.refreshToken);
  } catch {
    /* ignore */
  }
}

export function clearSession() {
  try {
    localStorage.removeItem(USER_KEY);
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
  } catch {
    /* ignore */
  }
}

// Handler tùy biến khi phiên hết hạn/bị đá. Nếu được đăng ký, apiClient sẽ
// KHÔNG tự chuyển trang mà nhường quyền xử lý (vd: hiện đếm ngược) cho nơi khác.
let sessionExpiredHandler = null;

export function setSessionExpiredHandler(fn) {
  sessionExpiredHandler = typeof fn === "function" ? fn : null;
}

function getToken() {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

function getRefreshToken() {
  try {
    return localStorage.getItem(REFRESH_KEY);
  } catch {
    return null;
  }
}

function isApiUrl(url) {
  if (typeof url !== "string") return false;
  // chỉ áp dụng cho API cùng origin
  return url.startsWith("/api/") || url.includes("/api/");
}

function isAuthBootstrap(url) {
  return (
    typeof url === "string" &&
    (url.includes("/api/auth/login") || url.includes("/api/auth/refresh"))
  );
}

function withAuthHeaders(init, token) {
  const headers = new Headers(init.headers || {});
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }
  return { ...init, headers };
}

/** Cài đặt interceptor (chỉ chạy 1 lần). */
export function installAuthFetch() {
  if (typeof window === "undefined") return;
  if (window.fetch.__crmPatched) return;

  const originalFetch = window.fetch.bind(window);

  const patched = async (input, init = {}) => {
    const url = typeof input === "string" ? input : input?.url;

    // Không phải API cùng origin → giữ nguyên
    if (!isApiUrl(url)) return originalFetch(input, init);

    // login / refresh → không đính token, không tự refresh
    if (isAuthBootstrap(url)) return originalFetch(input, init);

    const token = getToken();
    let response = await originalFetch(input, withAuthHeaders(init, token));

    if (response.status !== 401) return response;

    // 401 → thử refresh (chỉ khi input là chuỗi để có thể gọi lại an toàn)
    const refreshToken = getRefreshToken();
    if (!refreshToken || typeof input !== "string") {
      handleSessionExpired();
      return response;
    }

    try {
      const r = await originalFetch("/api/auth/refresh", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refreshToken }),
      });
      const d = await r.json().catch(() => null);
      if (r.ok && d?.status === "OK" && d.data?.token) {
        localStorage.setItem(TOKEN_KEY, d.data.token);
        if (d.data.refreshToken) {
          localStorage.setItem(REFRESH_KEY, d.data.refreshToken);
        }
        // thử lại request gốc 1 lần với token mới
        response = await originalFetch(input, withAuthHeaders(init, d.data.token));
        return response;
      }
    } catch {
      /* refresh lỗi → xử lý hết phiên bên dưới */
    }

    handleSessionExpired();
    return response;
  };

  patched.__crmPatched = true;
  window.fetch = patched;
}

function handleSessionExpired() {
  // Nhường quyền xử lý cho handler tùy biến (nếu có) — vd: hiện đếm ngược
  // rồi mới đăng xuất. Không xóa phiên / chuyển trang ngay ở đây.
  if (sessionExpiredHandler) {
    sessionExpiredHandler();
    return;
  }
  clearSession();
  if (typeof window !== "undefined") {
    const { pathname } = window.location;
    if (pathname !== "/login") {
      window.location.href = "/login";
    }
  }
}
