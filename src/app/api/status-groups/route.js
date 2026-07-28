import { query, execute, optionalInt } from "@/lib/db";
import { apiOk, apiFail } from "@/lib/apiResponse";

export const runtime = "nodejs";

const COLUMNS = `\`Code\`,\`Name\`,\`Description\`,\`SortOrder\`,\`IsActive\`,
  \`CreatedBy\`,\`CreatedDate\`,\`ModifiedBy\`,\`ModifiedDate\``;

/** GET: danh sách loại trạng thái */
export async function GET() {
  try {
    const rows = await query(
      `SELECT ${COLUMNS} FROM \`StatusGroup\` ORDER BY \`SortOrder\`, \`Name\``
    );

    if (rows.length === 0) {
      return apiFail("Không có dữ liệu", {
        title: "Not Found",
        severity: "info",
        httpStatus: 200,
      });
    }
    return apiOk(rows, "Lấy danh sách loại trạng thái thành công");
  } catch (err) {
    console.error("[api/status-groups GET] error:", err);
    return apiFail("Lỗi tải danh sách loại trạng thái", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}

/** POST: tạo mới */
export async function POST(request) {
  try {
    const body = await request.json();
    const code = (body.code || "").trim();
    const name = (body.name || "").trim();

    if (!code || !name) {
      return apiFail("Mã và tên loại trạng thái là bắt buộc", {
        title: "Thiếu thông tin",
        severity: "warning",
        httpStatus: 400,
      });
    }

    const dup = await query(
      "SELECT 1 FROM `StatusGroup` WHERE `Code` = :code OR `Name` = :name",
      { code, name }
    );
    if (dup.length > 0) {
      return apiFail("Mã hoặc tên loại trạng thái đã tồn tại", {
        title: "Trùng dữ liệu",
        severity: "warning",
        httpStatus: 409,
      });
    }

    // Không truyền sortOrder -> tự động lấy số thứ tự kế tiếp (MAX + 1).
    // Dùng INSERT ... SELECT với bảng dẫn xuất vì MySQL không cho phép truy vấn
    // con đọc chính bảng đang được INSERT trong mệnh đề VALUES.
    await execute(
      `INSERT INTO \`StatusGroup\`
         (\`Code\`,\`Name\`,\`Description\`,\`SortOrder\`,\`IsActive\`,\`CreatedBy\`,\`CreatedDate\`)
       SELECT :code, :name, :description,
              IFNULL(:sortOrder, \`nx\`.\`n\`),
              :isActive, :createdBy, NOW(6)
         FROM (SELECT IFNULL(MAX(\`SortOrder\`), 0) + 1 AS \`n\` FROM \`StatusGroup\`) AS \`nx\``,
      {
        code,
        name,
        description: body.description || null,
        sortOrder: optionalInt(body.sortOrder),
        isActive: body.isActive === false ? 0 : 1,
        createdBy: body.actor || null,
      }
    );

    return apiOk(null, "Tạo loại trạng thái thành công", { httpStatus: 201 });
  } catch (err) {
    console.error("[api/status-groups POST] error:", err);
    return apiFail("Lỗi tạo loại trạng thái", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}
