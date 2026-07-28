import { queryOne, execute } from "@/lib/db";
import { verifyPassword, hashPassword } from "@/lib/password";
import { apiOk, apiFail } from "@/lib/apiResponse";

export const runtime = "nodejs";

export async function POST(request) {
  try {
    const { username, currentPassword, newPassword } = await request.json();

    if (!username || !currentPassword || !newPassword) {
      return apiFail("Vui lòng nhập đầy đủ thông tin", {
        title: "Thiếu thông tin",
        severity: "warning",
        httpStatus: 400,
      });
    }

    if (String(newPassword).length < 4) {
      return apiFail("Mật khẩu mới phải có ít nhất 4 ký tự", {
        title: "Mật khẩu yếu",
        severity: "warning",
        httpStatus: 400,
      });
    }

    const account = await queryOne(
      "SELECT `UserName`, `Password` FROM `SysAccounts` WHERE `UserName` = :username LIMIT 1",
      { username }
    );

    if (!account || !verifyPassword(currentPassword, account.Password)) {
      return apiFail("Mật khẩu hiện tại không đúng", {
        title: "Xác thực thất bại",
        severity: "error",
        httpStatus: 401,
      });
    }

    await execute(
      `UPDATE \`SysAccounts\`
          SET \`Password\` = :password, \`ModifiedBy\` = :modifiedBy, \`ModifiedDate\` = NOW(6)
        WHERE \`UserName\` = :username`,
      { password: hashPassword(newPassword), modifiedBy: username, username }
    );

    return apiOk(null, "Đổi mật khẩu thành công");
  } catch (err) {
    console.error("[api/auth/change-password] error:", err);
    return apiFail("Lỗi kết nối máy chủ. Vui lòng thử lại.", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}
