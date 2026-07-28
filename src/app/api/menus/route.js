import { query } from "@/lib/db";
import { apiOk, apiFail } from "@/lib/apiResponse";

export const runtime = "nodejs";

const MENU_QUERY = `
WITH \`AllPermissions\` AS (
  SELECT \`sm\`.\`Id\`, \`sm\`.\`ParentId\`, \`sm\`.\`Text\`, \`sm\`.\`name\`, \`sm\`.\`Path\`,
         \`sm\`.\`Icon\`, \`sm\`.\`IconColor\`, \`sm\`.\`SortOrder\`,
         1 AS \`CanView\`, 1 AS \`CanCreate\`, 1 AS \`CanEdit\`, 1 AS \`CanDelete\`,
         1 AS \`CanPrint\`, 1 AS \`CanExport\`, 1 AS \`CanImport\`, 1 AS \`CanReport\`
    FROM \`SysAccounts\` AS \`sa\`
    JOIN \`SysAccountRoles\` AS \`sar\` ON \`sa\`.\`Id\` = \`sar\`.\`AccountId\`
   CROSS JOIN \`SysMenus\` AS \`sm\`
   WHERE \`sa\`.\`UserName\` = :userName AND \`sar\`.\`RoleId\` = 1 AND \`sm\`.\`IsActive\` = 1
   UNION ALL
  SELECT \`sm\`.\`Id\`, \`sm\`.\`ParentId\`, \`sm\`.\`Text\`, \`sm\`.\`name\`, \`sm\`.\`Path\`,
         \`sm\`.\`Icon\`, \`sm\`.\`IconColor\`, \`sm\`.\`SortOrder\`,
         \`srm\`.\`CanView\`, \`srm\`.\`CanCreate\`, \`srm\`.\`CanEdit\`, \`srm\`.\`CanDelete\`,
         \`srm\`.\`CanPrint\`, \`srm\`.\`CanExport\`, \`srm\`.\`CanImport\`, \`srm\`.\`CanReport\`
    FROM \`SysAccounts\` AS \`sa\`
    JOIN \`SysAccountRoles\` AS \`sar\` ON \`sa\`.\`Id\` = \`sar\`.\`AccountId\`
    JOIN \`SysRoleMenus\` AS \`srm\` ON \`sar\`.\`RoleId\` = \`srm\`.\`RoleId\`
    JOIN \`SysMenus\` AS \`sm\` ON \`srm\`.\`MenuId\` = \`sm\`.\`Id\`
   WHERE \`sa\`.\`UserName\` = :userName AND \`sar\`.\`RoleId\` <> 1 AND \`sm\`.\`IsActive\` = 1
)
SELECT \`rs\`.\`Id\`, \`rs\`.\`ParentId\`, \`rs\`.\`Text\`, \`rs\`.\`name\`, \`rs\`.\`Path\`,
       \`rs\`.\`Icon\`, \`rs\`.\`IconColor\`, \`rs\`.\`SortOrder\`,
       MAX(\`rs\`.\`CanView\`)   AS \`CanView\`,
       MAX(\`rs\`.\`CanCreate\`) AS \`CanCreate\`,
       MAX(\`rs\`.\`CanEdit\`)   AS \`CanEdit\`,
       MAX(\`rs\`.\`CanDelete\`) AS \`CanDelete\`,
       MAX(\`rs\`.\`CanPrint\`)  AS \`CanPrint\`,
       MAX(\`rs\`.\`CanExport\`) AS \`CanExport\`,
       MAX(\`rs\`.\`CanImport\`) AS \`CanImport\`,
       MAX(\`rs\`.\`CanReport\`) AS \`CanReport\`
  FROM \`AllPermissions\` AS \`rs\`
 GROUP BY \`rs\`.\`Id\`, \`rs\`.\`ParentId\`, \`rs\`.\`Text\`, \`rs\`.\`name\`, \`rs\`.\`Path\`,
          \`rs\`.\`Icon\`, \`rs\`.\`IconColor\`, \`rs\`.\`SortOrder\`
 ORDER BY \`rs\`.\`ParentId\`, \`rs\`.\`SortOrder\``;

/** GET /api/menus?username=... -> menu phân quyền của người dùng */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return apiFail("Thiếu tên đăng nhập", {
        title: "Thiếu thông tin",
        severity: "warning",
        httpStatus: 400,
      });
    }

    const rows = await query(MENU_QUERY, { userName: username });

    if (rows.length === 0) {
      return apiFail("Không có menu", {
        title: "Not Found",
        severity: "info",
        httpStatus: 200,
      });
    }

    return apiOk(rows, "Lấy menu thành công");
  } catch (err) {
    console.error("[api/menus GET] error:", err);
    return apiFail("Lỗi tải menu", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}
