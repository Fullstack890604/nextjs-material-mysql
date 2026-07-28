import { query, execute, optionalInt } from "@/lib/db";
import { apiOk, apiFail } from "@/lib/apiResponse";

export const runtime = "nodejs";

const COLUMNS = `\`Code\`,\`Name\`,\`ProvinceCode\`,\`District\`,\`SortOrder\`,\`IsActive\`,
  \`CreatedBy\`,\`CreatedDate\`,\`ModifiedBy\`,\`ModifiedDate\``;

/** GET: danh sách phường/xã */
export async function GET() {
  try {
    const rows = await query(
      `SELECT ${COLUMNS} FROM \`Ward\` ORDER BY \`SortOrder\`, \`Name\``
    );

    if (rows.length === 0) {
      return apiFail("Không có dữ liệu", {
        title: "Not Found",
        severity: "info",
        httpStatus: 200,
      });
    }
    return apiOk(rows, "Lấy danh sách phường/xã thành công");
  } catch (err) {
    console.error("[api/wards GET] error:", err);
    return apiFail("Lỗi tải danh sách phường/xã", {
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
      return apiFail("Mã và tên phường/xã là bắt buộc", {
        title: "Thiếu thông tin",
        severity: "warning",
        httpStatus: 400,
      });
    }
    if (!body.provinceCode) {
      return apiFail("Tỉnh/thành phố là bắt buộc", {
        title: "Thiếu thông tin",
        severity: "warning",
        httpStatus: 400,
      });
    }

    const dup = await query("SELECT 1 FROM `Ward` WHERE `Code` = :code", { code });
    if (dup.length > 0) {
      return apiFail("Mã phường/xã đã tồn tại", {
        title: "Trùng dữ liệu",
        severity: "warning",
        httpStatus: 409,
      });
    }

    // Không truyền sortOrder -> tự động lấy số thứ tự kế tiếp (MAX + 1).
    // Dùng INSERT ... SELECT với bảng dẫn xuất vì MySQL không cho phép truy vấn
    // con đọc chính bảng đang được INSERT trong mệnh đề VALUES.
    await execute(
      `INSERT INTO \`Ward\`
         (\`Code\`,\`Name\`,\`ProvinceCode\`,\`District\`,\`SortOrder\`,\`IsActive\`,\`CreatedBy\`,\`CreatedDate\`)
       SELECT :code, :name, :provinceCode, :district,
              IFNULL(:sortOrder, \`nx\`.\`n\`),
              :isActive, :createdBy, NOW(6)
         FROM (SELECT IFNULL(MAX(\`SortOrder\`), 0) + 1 AS \`n\` FROM \`Ward\`) AS \`nx\``,
      {
        code,
        name,
        provinceCode: body.provinceCode || null,
        district: body.district || null,
        sortOrder: optionalInt(body.sortOrder),
        isActive: body.isActive === false ? 0 : 1,
        createdBy: body.actor || null,
      }
    );

    return apiOk(null, "Tạo phường/xã thành công", { httpStatus: 201 });
  } catch (err) {
    console.error("[api/wards POST] error:", err);
    return apiFail("Lỗi tạo phường/xã", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}
