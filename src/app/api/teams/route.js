import { query, execute, optionalInt } from "@/lib/db";
import { apiOk, apiFail } from "@/lib/apiResponse";

export const runtime = "nodejs";

const SELECT_QUERY = `
  SELECT \`t\`.\`Code\`, \`t\`.\`Name\`, \`t\`.\`DepartmentCode\`, \`t\`.\`Description\`, \`t\`.\`LeaderCode\`,
         \`t\`.\`HeadCount\`, \`t\`.\`SortOrder\`, \`t\`.\`IsActive\`,
         \`t\`.\`CreatedBy\`, \`t\`.\`CreatedDate\`, \`t\`.\`ModifiedBy\`, \`t\`.\`ModifiedDate\`,
         \`d\`.\`Name\`     AS \`DepartmentName\`,
         \`s\`.\`FullName\` AS \`LeaderName\`
    FROM \`Team\` AS \`t\`
    LEFT JOIN \`Department\` AS \`d\` ON \`d\`.\`Code\` = \`t\`.\`DepartmentCode\`
    LEFT JOIN \`Staff\`      AS \`s\` ON \`s\`.\`Code\` = \`t\`.\`LeaderCode\`
   ORDER BY \`d\`.\`SortOrder\`, \`d\`.\`Name\`, \`t\`.\`SortOrder\`, \`t\`.\`Name\``;

/** Chuẩn hóa chuỗi: rỗng -> null (để cột nullable không lưu chuỗi rỗng) */
const nullIfBlank = (v) => {
  const s = (v ?? "").toString().trim();
  return s === "" ? null : s;
};

/** GET: danh sách tổ, nhóm (lọc theo phòng ban với ?departmentCode=) */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const departmentCode = (searchParams.get("departmentCode") || "").trim();

    let sqlText = SELECT_QUERY;
    const params = {};
    if (departmentCode) {
      params.departmentCode = departmentCode;
      sqlText = SELECT_QUERY.replace(
        "ORDER BY",
        "WHERE `t`.`DepartmentCode` = :departmentCode\n  ORDER BY"
      );
    }
    const rows = await query(sqlText, params);

    if (rows.length === 0) {
      return apiFail("Không có dữ liệu", {
        title: "Not Found",
        severity: "info",
        httpStatus: 200,
      });
    }
    return apiOk(rows, "Lấy danh sách tổ, nhóm thành công");
  } catch (err) {
    console.error("[api/teams GET] error:", err);
    return apiFail("Lỗi tải danh sách tổ, nhóm", {
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
    const departmentCode = (body.departmentCode || "").trim();

    if (!code || !name || !departmentCode) {
      return apiFail("Mã, tên tổ/nhóm và phòng ban là bắt buộc", {
        title: "Thiếu thông tin",
        severity: "warning",
        httpStatus: 400,
      });
    }

    const dept = await query(
      "SELECT 1 FROM `Department` WHERE `Code` = :departmentCode",
      { departmentCode }
    );
    if (dept.length === 0) {
      return apiFail("Phòng ban không tồn tại", {
        title: "Dữ liệu không hợp lệ",
        severity: "warning",
        httpStatus: 400,
      });
    }

    const dup = await query(
      `SELECT 1 FROM \`Team\`
        WHERE \`Code\` = :code OR (\`Name\` = :name AND \`DepartmentCode\` = :departmentCode)`,
      { code, name, departmentCode }
    );
    if (dup.length > 0) {
      return apiFail("Mã đã tồn tại, hoặc phòng ban này đã có tổ/nhóm cùng tên", {
        title: "Trùng dữ liệu",
        severity: "warning",
        httpStatus: 409,
      });
    }

    // Không truyền sortOrder -> tự động lấy số thứ tự kế tiếp (MAX + 1).
    // Dùng INSERT ... SELECT với bảng dẫn xuất vì MySQL không cho phép truy vấn
    // con đọc chính bảng đang được INSERT trong mệnh đề VALUES.
    await execute(
      `INSERT INTO \`Team\`
         (\`Code\`,\`Name\`,\`DepartmentCode\`,\`Description\`,\`LeaderCode\`,
          \`HeadCount\`,\`SortOrder\`,\`IsActive\`,\`CreatedBy\`,\`CreatedDate\`)
       SELECT :code, :name, :departmentCode, :description, :leaderCode,
              IFNULL(:headCount, 0),
              IFNULL(:sortOrder, \`nx\`.\`n\`),
              :isActive, :createdBy, NOW(6)
         FROM (SELECT IFNULL(MAX(\`SortOrder\`), 0) + 1 AS \`n\` FROM \`Team\`) AS \`nx\``,
      {
        code,
        name,
        departmentCode,
        description: nullIfBlank(body.description),
        leaderCode: nullIfBlank(body.leaderCode),
        headCount: optionalInt(body.headCount),
        sortOrder: optionalInt(body.sortOrder),
        isActive: body.isActive === false ? 0 : 1,
        createdBy: body.actor || null,
      }
    );

    return apiOk(null, "Tạo tổ, nhóm thành công", { httpStatus: 201 });
  } catch (err) {
    console.error("[api/teams POST] error:", err);
    return apiFail("Lỗi tạo tổ, nhóm", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}
