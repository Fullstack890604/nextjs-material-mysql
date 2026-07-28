import { query, execute, optionalInt } from "@/lib/db";
import { apiOk, apiFail } from "@/lib/apiResponse";

export const runtime = "nodejs";

const COLUMNS = `\`Code\`,\`Name\`,\`Region\`,\`SortOrder\`,\`IsActive\`,
  \`CreatedBy\`,\`CreatedDate\`,\`ModifiedBy\`,\`ModifiedDate\``;

/** GET: danh sách tỉnh/thành */
export async function GET() {
  try {
    const rows = await query(
      `SELECT ${COLUMNS} FROM \`Province\` ORDER BY \`SortOrder\`, \`Name\``
    );

    if (rows.length === 0) {
      return apiFail("Không có dữ liệu", {
        title: "Not Found",
        severity: "info",
        httpStatus: 200,
      });
    }
    return apiOk(rows, "Lấy danh sách tỉnh/thành thành công");
  } catch (err) {
    console.error("[api/provinces GET] error:", err);
    return apiFail("Lỗi tải danh sách tỉnh/thành", {
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
      return apiFail("Mã và tên tỉnh/thành là bắt buộc", {
        title: "Thiếu thông tin",
        severity: "warning",
        httpStatus: 400,
      });
    }

    const dup = await query(
      "SELECT 1 FROM `Province` WHERE `Code` = :code OR `Name` = :name",
      { code, name }
    );
    if (dup.length > 0) {
      return apiFail("Mã hoặc tên tỉnh/thành đã tồn tại", {
        title: "Trùng dữ liệu",
        severity: "warning",
        httpStatus: 409,
      });
    }

    // Không truyền sortOrder -> tự động lấy số thứ tự kế tiếp (MAX + 1).
    // Dùng INSERT ... SELECT với bảng dẫn xuất vì MySQL không cho phép truy vấn
    // con đọc chính bảng đang được INSERT trong mệnh đề VALUES.
    await execute(
      `INSERT INTO \`Province\`
         (\`Code\`,\`Name\`,\`Region\`,\`SortOrder\`,\`IsActive\`,\`CreatedBy\`,\`CreatedDate\`)
       SELECT :code, :name, :region,
              IFNULL(:sortOrder, \`nx\`.\`n\`),
              :isActive, :createdBy, NOW(6)
         FROM (SELECT IFNULL(MAX(\`SortOrder\`), 0) + 1 AS \`n\` FROM \`Province\`) AS \`nx\``,
      {
        code,
        name,
        region: body.region || null,
        sortOrder: optionalInt(body.sortOrder),
        isActive: body.isActive === false ? 0 : 1,
        createdBy: body.actor || null,
      }
    );

    return apiOk(null, "Tạo tỉnh/thành thành công", { httpStatus: 201 });
  } catch (err) {
    console.error("[api/provinces POST] error:", err);
    return apiFail("Lỗi tạo tỉnh/thành", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}
