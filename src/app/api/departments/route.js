import { query, execute, optionalInt } from "@/lib/db";
import { apiOk, apiFail } from "@/lib/apiResponse";

export const runtime = "nodejs";

const SELECT_QUERY = `
  SELECT \`d\`.\`Code\`, \`d\`.\`Name\`, \`d\`.\`Description\`, \`d\`.\`LocationCode\`, \`d\`.\`ManagerCode\`,
         \`d\`.\`Phone\`, \`d\`.\`Email\`, \`d\`.\`HeadCount\`, \`d\`.\`SortOrder\`, \`d\`.\`IsActive\`,
         \`d\`.\`CreatedBy\`, \`d\`.\`CreatedDate\`, \`d\`.\`ModifiedBy\`, \`d\`.\`ModifiedDate\`,
         \`l\`.\`LocationName\` AS \`LocationName\`,
         \`s\`.\`FullName\`     AS \`ManagerName\`
    FROM \`Department\` AS \`d\`
    LEFT JOIN \`Locations\` AS \`l\` ON \`l\`.\`LocationCode\` = \`d\`.\`LocationCode\`
    LEFT JOIN \`Staff\`     AS \`s\` ON \`s\`.\`Code\` = \`d\`.\`ManagerCode\`
   ORDER BY \`d\`.\`SortOrder\`, \`d\`.\`Name\``;

/** Chuẩn hóa chuỗi: rỗng -> null (để cột nullable không lưu chuỗi rỗng) */
const nullIfBlank = (v) => {
  const s = (v ?? "").toString().trim();
  return s === "" ? null : s;
};

/** GET: danh sách phòng ban */
export async function GET() {
  try {
    const rows = await query(SELECT_QUERY);

    if (rows.length === 0) {
      return apiFail("Không có dữ liệu", {
        title: "Not Found",
        severity: "info",
        httpStatus: 200,
      });
    }
    return apiOk(rows, "Lấy danh sách phòng ban thành công");
  } catch (err) {
    console.error("[api/departments GET] error:", err);
    return apiFail("Lỗi tải danh sách phòng ban", {
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
      return apiFail("Mã và tên phòng ban là bắt buộc", {
        title: "Thiếu thông tin",
        severity: "warning",
        httpStatus: 400,
      });
    }

    const dup = await query(
      "SELECT 1 FROM `Department` WHERE `Code` = :code OR `Name` = :name",
      { code, name }
    );
    if (dup.length > 0) {
      return apiFail("Mã hoặc tên phòng ban đã tồn tại", {
        title: "Trùng dữ liệu",
        severity: "warning",
        httpStatus: 409,
      });
    }

    // Không truyền sortOrder -> tự động lấy số thứ tự kế tiếp (MAX + 1).
    // Dùng INSERT ... SELECT với bảng dẫn xuất vì MySQL không cho phép truy vấn
    // con đọc chính bảng đang được INSERT trong mệnh đề VALUES.
    await execute(
      `INSERT INTO \`Department\`
         (\`Code\`,\`Name\`,\`Description\`,\`LocationCode\`,\`ManagerCode\`,\`Phone\`,\`Email\`,
          \`HeadCount\`,\`SortOrder\`,\`IsActive\`,\`CreatedBy\`,\`CreatedDate\`)
       SELECT :code, :name, :description, :locationCode, :managerCode, :phone, :email,
              IFNULL(:headCount, 0),
              IFNULL(:sortOrder, \`nx\`.\`n\`),
              :isActive, :createdBy, NOW(6)
         FROM (SELECT IFNULL(MAX(\`SortOrder\`), 0) + 1 AS \`n\` FROM \`Department\`) AS \`nx\``,
      {
        code,
        name,
        description: nullIfBlank(body.description),
        locationCode: nullIfBlank(body.locationCode),
        managerCode: nullIfBlank(body.managerCode),
        phone: nullIfBlank(body.phone),
        email: nullIfBlank(body.email),
        headCount: optionalInt(body.headCount),
        sortOrder: optionalInt(body.sortOrder),
        isActive: body.isActive === false ? 0 : 1,
        createdBy: body.actor || null,
      }
    );

    return apiOk(null, "Tạo phòng ban thành công", { httpStatus: 201 });
  } catch (err) {
    console.error("[api/departments POST] error:", err);
    return apiFail("Lỗi tạo phòng ban", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}
