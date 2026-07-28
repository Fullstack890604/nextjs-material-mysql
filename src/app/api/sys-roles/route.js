import { query, execute } from "@/lib/db";
import { apiOk, apiFail } from "@/lib/apiResponse";

export const runtime = "nodejs";

const COLUMNS = `\`Id\`,\`Name\`,\`Description\`,\`IsActive\``;

/** GET: danh sách nhóm quyền */
export async function GET() {
  try {
    const rows = await query(`SELECT ${COLUMNS} FROM \`SysRoles\` ORDER BY \`Name\``);

    if (rows.length === 0) {
      return apiFail("Không có dữ liệu", {
        title: "Not Found",
        severity: "info",
        httpStatus: 200,
      });
    }
    return apiOk(rows, "Lấy danh sách nhóm quyền thành công");
  } catch (err) {
    console.error("[api/sys-roles GET] error:", err);
    return apiFail("Lỗi tải danh sách nhóm quyền", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}

/** POST: tạo mới nhóm quyền */
export async function POST(request) {
  try {
    const body = await request.json();
    const name = (body.name || "").trim();

    if (!name) {
      return apiFail("Tên nhóm quyền là bắt buộc", {
        title: "Thiếu thông tin",
        severity: "warning",
        httpStatus: 400,
      });
    }

    const dup = await query("SELECT 1 FROM `SysRoles` WHERE `Name` = :name", { name });
    if (dup.length > 0) {
      return apiFail("Tên nhóm quyền đã tồn tại", {
        title: "Trùng dữ liệu",
        severity: "warning",
        httpStatus: 409,
      });
    }

    await execute(
      `INSERT INTO \`SysRoles\` (\`Name\`,\`Description\`,\`IsActive\`)
       VALUES (:name,:description,:isActive)`,
      {
        name,
        description: body.description || null,
        isActive: body.isActive === false ? 0 : 1,
      }
    );

    return apiOk(null, "Tạo nhóm quyền thành công", { httpStatus: 201 });
  } catch (err) {
    console.error("[api/sys-roles POST] error:", err);
    return apiFail("Lỗi tạo nhóm quyền", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}
