import { query, execute, optionalInt } from "@/lib/db";
import { apiOk, apiFail } from "@/lib/apiResponse";

export const runtime = "nodejs";

const COLUMNS = `\`Id\`,\`ParentId\`,\`Text\`,\`name\`,\`Path\`,\`Icon\`,\`IsActive\`,\`SortOrder\`,\`IconColor\``;

/** GET: toàn bộ menu (SysMenus) */
export async function GET() {
  try {
    const rows = await query(
      `SELECT ${COLUMNS} FROM \`SysMenus\` ORDER BY \`ParentId\`, \`SortOrder\`, \`Text\``
    );

    if (rows.length === 0) {
      return apiFail("Không có dữ liệu", {
        title: "Not Found",
        severity: "info",
        httpStatus: 200,
      });
    }
    return apiOk(rows, "Lấy danh sách menu thành công");
  } catch (err) {
    console.error("[api/sys-menus GET] error:", err);
    return apiFail("Lỗi tải danh sách menu", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}

/** POST: tạo menu mới */
export async function POST(request) {
  try {
    const body = await request.json();
    const text = (body.text || "").trim();

    if (!text) {
      return apiFail("Tên menu (Text) là bắt buộc", {
        title: "Thiếu thông tin",
        severity: "warning",
        httpStatus: 400,
      });
    }

    const parentId = Number.isFinite(+body.parentId) ? +body.parentId : 0;

    // Không truyền sortOrder -> tự lấy số kế tiếp TRONG CÙNG menu cha (max + 1).
    // Dùng INSERT ... SELECT với bảng dẫn xuất vì MySQL không cho phép truy vấn
    // con đọc chính bảng đang được INSERT trong mệnh đề VALUES.
    await execute(
      `INSERT INTO \`SysMenus\`
         (\`ParentId\`,\`Text\`,\`name\`,\`Path\`,\`Icon\`,\`IsActive\`,\`SortOrder\`,\`IconColor\`)
       SELECT :parentId, :text, :name, :path, :icon, :isActive,
              IFNULL(:sortOrder, \`nx\`.\`n\`),
              :iconColor
         FROM (SELECT IFNULL(MAX(\`SortOrder\`), 0) + 1 AS \`n\`
                 FROM \`SysMenus\` WHERE \`ParentId\` = :parentId) AS \`nx\``,
      {
        parentId,
        text,
        name: body.name || "",
        path: body.path || "",
        icon: body.icon || "",
        isActive: body.isActive === false ? 0 : 1,
        sortOrder: optionalInt(body.sortOrder),
        // Để trống -> Sidebar tự lấy màu "primary.main" của theme (src/palette.js)
        iconColor: body.iconColor || "",
      }
    );

    return apiOk(null, "Tạo menu thành công", { httpStatus: 201 });
  } catch (err) {
    console.error("[api/sys-menus POST] error:", err);
    return apiFail("Lỗi tạo menu", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}
