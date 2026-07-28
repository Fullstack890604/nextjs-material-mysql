import { query, execute, optionalInt } from "@/lib/db";
import { apiOk, apiFail } from "@/lib/apiResponse";

export const runtime = "nodejs";

const SELECT_QUERY = `
  SELECT \`s\`.\`Id\`, \`s\`.\`GroupCode\`, \`s\`.\`Code\`, \`s\`.\`Name\`, \`s\`.\`Description\`,
         \`s\`.\`Color\`, \`s\`.\`IsFinal\`, \`s\`.\`SortOrder\`, \`s\`.\`IsActive\`,
         \`s\`.\`CreatedBy\`, \`s\`.\`CreatedDate\`, \`s\`.\`ModifiedBy\`, \`s\`.\`ModifiedDate\`,
         \`g\`.\`Name\` AS \`GroupName\`
    FROM \`Status\` AS \`s\`
    LEFT JOIN \`StatusGroup\` AS \`g\` ON \`g\`.\`Code\` = \`s\`.\`GroupCode\``;

/** GET: danh sách trạng thái (lọc theo loại với ?groupCode=) */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const groupCode = (searchParams.get("groupCode") || "").trim();

    const where = groupCode ? "\n   WHERE `s`.`GroupCode` = :groupCode" : "";
    const rows = await query(
      `${SELECT_QUERY}${where}
   ORDER BY \`g\`.\`SortOrder\`, \`g\`.\`Name\`, \`s\`.\`SortOrder\`, \`s\`.\`Name\``,
      groupCode ? { groupCode } : {}
    );

    if (rows.length === 0) {
      return apiFail("Không có dữ liệu", {
        title: "Not Found",
        severity: "info",
        httpStatus: 200,
      });
    }
    return apiOk(rows, "Lấy danh sách trạng thái thành công");
  } catch (err) {
    console.error("[api/statuses GET] error:", err);
    return apiFail("Lỗi tải danh sách trạng thái", {
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
    const groupCode = (body.groupCode || "").trim();
    const code = (body.code || "").trim();
    const name = (body.name || "").trim();

    if (!groupCode || !code || !name) {
      return apiFail("Loại trạng thái, mã và tên là bắt buộc", {
        title: "Thiếu thông tin",
        severity: "warning",
        httpStatus: 400,
      });
    }

    const group = await query(
      "SELECT 1 FROM `StatusGroup` WHERE `Code` = :groupCode",
      { groupCode }
    );
    if (group.length === 0) {
      return apiFail("Loại trạng thái không tồn tại", {
        title: "Dữ liệu không hợp lệ",
        severity: "warning",
        httpStatus: 400,
      });
    }

    // Mã và tên chỉ cần duy nhất TRONG cùng một loại trạng thái.
    const dup = await query(
      `SELECT 1 FROM \`Status\`
        WHERE \`GroupCode\` = :groupCode AND (\`Code\` = :code OR \`Name\` = :name)`,
      { groupCode, code, name }
    );
    if (dup.length > 0) {
      return apiFail("Loại này đã có trạng thái trùng mã hoặc trùng tên", {
        title: "Trùng dữ liệu",
        severity: "warning",
        httpStatus: 409,
      });
    }

    // Không truyền sortOrder -> tự lấy số kế tiếp TRONG CÙNG loại (MAX + 1).
    // Dùng INSERT ... SELECT với bảng dẫn xuất vì MySQL không cho phép truy vấn
    // con đọc chính bảng đang được INSERT trong mệnh đề VALUES.
    await execute(
      `INSERT INTO \`Status\`
         (\`GroupCode\`,\`Code\`,\`Name\`,\`Description\`,\`Color\`,\`IsFinal\`,
          \`SortOrder\`,\`IsActive\`,\`CreatedBy\`,\`CreatedDate\`)
       SELECT :groupCode, :code, :name, :description, :color, :isFinal,
              IFNULL(:sortOrder, \`nx\`.\`n\`),
              :isActive, :createdBy, NOW(6)
         FROM (SELECT IFNULL(MAX(\`SortOrder\`), 0) + 1 AS \`n\`
                 FROM \`Status\` WHERE \`GroupCode\` = :groupCode) AS \`nx\``,
      {
        groupCode,
        code,
        name,
        description: body.description || null,
        color: body.color || "",
        isFinal: body.isFinal ? 1 : 0,
        sortOrder: optionalInt(body.sortOrder),
        isActive: body.isActive === false ? 0 : 1,
        createdBy: body.actor || null,
      }
    );

    return apiOk(null, "Tạo trạng thái thành công", { httpStatus: 201 });
  } catch (err) {
    console.error("[api/statuses POST] error:", err);
    return apiFail("Lỗi tạo trạng thái", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}
