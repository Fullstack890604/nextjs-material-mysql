import { query, execute } from "@/lib/db";
import { apiOk, apiFail } from "@/lib/apiResponse";

export const runtime = "nodejs";

/** GET: danh sách phân quyền tài khoản (kèm tên tài khoản, tên nhóm quyền) */
export async function GET() {
  try {
    const rows = await query(
      `SELECT
          \`ar\`.\`AccountId\`, \`a\`.\`UserName\` AS \`AccountName\`,
          \`a\`.\`Description\` AS \`AccountDescription\`,
          \`ar\`.\`RoleId\`, \`r\`.\`Name\` AS \`RoleName\`
        FROM \`SysAccountRoles\` \`ar\`
        JOIN \`SysAccounts\` \`a\` ON \`a\`.\`Id\` = \`ar\`.\`AccountId\`
        JOIN \`SysRoles\` \`r\` ON \`r\`.\`Id\` = \`ar\`.\`RoleId\`
       ORDER BY \`a\`.\`UserName\`, \`r\`.\`Name\``
    );

    if (rows.length === 0) {
      return apiFail("Không có dữ liệu", {
        title: "Not Found",
        severity: "info",
        httpStatus: 200,
      });
    }
    return apiOk(rows, "Lấy danh sách phân quyền thành công");
  } catch (err) {
    console.error("[api/sys-account-roles GET] error:", err);
    return apiFail("Lỗi tải danh sách phân quyền", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}

/** POST: gán một hoặc nhiều nhóm quyền cho một tài khoản */
export async function POST(request) {
  try {
    const body = await request.json();
    const accountId = +body.accountId;

    // Hỗ trợ cả roleId (đơn) lẫn roleIds (mảng)
    const rawRoleIds = Array.isArray(body.roleIds)
      ? body.roleIds
      : body.roleId != null
        ? [body.roleId]
        : [];
    const roleIds = [
      ...new Set(rawRoleIds.map((x) => +x).filter((x) => Number.isInteger(x))),
    ];

    if (!Number.isInteger(accountId) || roleIds.length === 0) {
      return apiFail("Vui lòng chọn tài khoản và nhóm quyền", {
        title: "Thiếu thông tin",
        severity: "warning",
        httpStatus: 400,
      });
    }

    let inserted = 0;
    for (const roleId of roleIds) {
      const dup = await query(
        "SELECT 1 FROM `SysAccountRoles` WHERE `AccountId` = :accountId AND `RoleId` = :roleId",
        { accountId, roleId }
      );
      if (dup.length > 0) continue;

      await execute(
        "INSERT INTO `SysAccountRoles` (`AccountId`,`RoleId`) VALUES (:accountId,:roleId)",
        { accountId, roleId }
      );
      inserted += 1;
    }

    if (inserted === 0) {
      return apiFail("Tài khoản đã được gán các nhóm quyền đã chọn", {
        title: "Trùng dữ liệu",
        severity: "warning",
        httpStatus: 409,
      });
    }

    return apiOk(null, `Đã gán ${inserted} nhóm quyền`, { httpStatus: 201 });
  } catch (err) {
    console.error("[api/sys-account-roles POST] error:", err);
    return apiFail("Lỗi gán quyền", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}

/** DELETE: gỡ một nhóm quyền khỏi tài khoản (?accountId=&roleId=) */
export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url);
    const accountId = +searchParams.get("accountId");
    const roleId = +searchParams.get("roleId");

    if (!Number.isInteger(accountId) || !Number.isInteger(roleId)) {
      return apiFail("Thiếu tham số tài khoản hoặc nhóm quyền", {
        title: "Thiếu thông tin",
        severity: "warning",
        httpStatus: 400,
      });
    }

    const { affectedRows } = await execute(
      "DELETE FROM `SysAccountRoles` WHERE `AccountId` = :accountId AND `RoleId` = :roleId",
      { accountId, roleId }
    );

    if (affectedRows === 0) {
      return apiFail("Không tìm thấy phân quyền", {
        title: "Not Found",
        severity: "info",
        httpStatus: 404,
      });
    }
    return apiOk(null, "Gỡ quyền thành công");
  } catch (err) {
    console.error("[api/sys-account-roles DELETE] error:", err);
    return apiFail("Lỗi gỡ quyền", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}
