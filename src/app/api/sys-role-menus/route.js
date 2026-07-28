import { query, transaction } from "@/lib/db";
import { apiOk, apiFail } from "@/lib/apiResponse";

export const runtime = "nodejs";

const PERM_KEYS = [
  "CanView",
  "CanCreate",
  "CanEdit",
  "CanDelete",
  "CanPrint",
  "CanReport",
  "CanImport",
  "CanExport",
];

/** GET: quyền menu của một nhóm quyền (?roleId=) */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const roleId = +searchParams.get("roleId");

    if (!Number.isInteger(roleId)) {
      return apiFail("Thiếu tham số nhóm quyền", {
        title: "Thiếu thông tin",
        severity: "warning",
        httpStatus: 400,
      });
    }

    const rows = await query(
      `SELECT \`RoleId\`,\`MenuId\`,\`CanView\`,\`CanCreate\`,\`CanEdit\`,\`CanDelete\`,
              \`CanPrint\`,\`CanReport\`,\`CanImport\`,\`CanExport\`
         FROM \`SysRoleMenus\` WHERE \`RoleId\` = :roleId`,
      { roleId }
    );

    return apiOk(rows, "Lấy quyền menu thành công");
  } catch (err) {
    console.error("[api/sys-role-menus GET] error:", err);
    return apiFail("Lỗi tải quyền menu", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}

/** PUT: lưu toàn bộ quyền menu cho một nhóm quyền */
export async function PUT(request) {
  try {
    const body = await request.json();
    const roleId = +body.roleId;
    const permissions = Array.isArray(body.permissions) ? body.permissions : [];

    if (!Number.isInteger(roleId)) {
      return apiFail("Thiếu nhóm quyền", {
        title: "Thiếu thông tin",
        severity: "warning",
        httpStatus: 400,
      });
    }

    // Chỉ lưu các menu có ít nhất một quyền được bật
    const rowsToSave = permissions
      .map((p) => ({
        menuId: +p.menuId,
        flags: PERM_KEYS.map((k) => (p[k.charAt(0).toLowerCase() + k.slice(1)] ? 1 : 0)),
      }))
      .filter((p) => Number.isInteger(p.menuId) && p.flags.some((f) => f === 1));

    await transaction(async (tx) => {
      await tx.execute("DELETE FROM `SysRoleMenus` WHERE `RoleId` = :roleId", { roleId });

      for (const row of rowsToSave) {
        const values = { roleId, menuId: row.menuId };
        PERM_KEYS.forEach((k, i) => {
          values[k] = row.flags[i];
        });
        await tx.execute(
          `INSERT INTO \`SysRoleMenus\`
             (\`RoleId\`,\`MenuId\`,${PERM_KEYS.map((k) => `\`${k}\``).join(",")})
           VALUES
             (:roleId,:menuId,${PERM_KEYS.map((k) => `:${k}`).join(",")})`,
          values
        );
      }
    });

    return apiOk(null, "Lưu quyền menu thành công");
  } catch (err) {
    console.error("[api/sys-role-menus PUT] error:", err);
    return apiFail("Lỗi lưu quyền menu", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}
