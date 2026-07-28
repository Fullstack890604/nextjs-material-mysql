import {
  verifySessionToken,
  SESSION_COOKIE,
  REFRESH_COOKIE,
} from "@/lib/session";
import { isSessionCurrent } from "@/lib/sessionStore";
import { addSubscriber, removeSubscriber, getLastLogin } from "@/lib/sessionBus";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const SSE_HEADERS = {
  "Content-Type": "text/event-stream; charset=utf-8",
  "Cache-Control": "no-cache, no-transform",
  Connection: "keep-alive",
  // Tắt buffering nếu chạy sau nginx
  "X-Accel-Buffering": "no",
};

/**
 * GET: mở kết nối SSE để nhận sự kiện "kicked" khi tài khoản bị đăng nhập ở
 * nơi khác (Cách 1). Thay cho việc gọi /api/auth/session-check liên tục.
 *
 * Danh tính lấy từ cookie phiên (access, hoặc refresh khi access hết hạn).
 */
export async function GET(request) {
  const accessToken = request.cookies.get(SESSION_COOKIE)?.value || null;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value || null;

  let payload = await verifySessionToken(accessToken);
  if (!payload?.username) payload = await verifySessionToken(refreshToken);
  if (!payload?.username) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { username, sid } = payload;
  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      let closed = false;
      let heartbeat;

      const safeEnqueue = (text) => {
        if (closed) return;
        try {
          controller.enqueue(encoder.encode(text));
        } catch {
          /* controller đã đóng */
        }
      };

      const subscriber = {
        sid,
        send: (payloadObj) =>
          safeEnqueue(`data: ${JSON.stringify(payloadObj)}\n\n`),
        close: () => cleanup(),
      };

      const cleanup = () => {
        if (closed) return;
        closed = true;
        clearInterval(heartbeat);
        removeSubscriber(username, subscriber);
        try {
          controller.close();
        } catch {
          /* đã đóng */
        }
      };

      addSubscriber(username, subscriber);

      // Mở màn + giữ kết nối sống (ping mỗi 25s)
      safeEnqueue(`retry: 5000\n\n`);
      safeEnqueue(`: connected\n\n`);
      heartbeat = setInterval(() => safeEnqueue(`: ping\n\n`), 25000);

      // Nếu ngay lúc kết nối đã không còn là phiên hiện hành → đá luôn.
      try {
        const current = await isSessionCurrent(username, sid);
        if (!current) {
          subscriber.send({ type: "kicked", device: getLastLogin(username) });
          cleanup();
          return;
        }
      } catch {
        /* lỗi DB — bỏ qua, vẫn giữ kết nối */
      }

      // Client ngắt kết nối → dọn dẹp
      request.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, { headers: SSE_HEADERS });
}
