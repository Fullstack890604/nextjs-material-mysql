import { query, execute, optionalInt } from "@/lib/db";
import { apiOk, apiFail } from "@/lib/apiResponse";

export const runtime = "nodejs";

const SELECT_QUERY = `
  SELECT \`st\`.\`Code\`, \`st\`.\`FullName\`, \`st\`.\`Position\`, \`st\`.\`Gender\`, \`st\`.\`DateOfBirth\`,
         \`st\`.\`Phone\`, \`st\`.\`Email\`, \`st\`.\`StoreCode\`,
         \`st\`.\`DepartmentCode\`, \`st\`.\`TeamCode\`, \`st\`.\`Note\`, \`st\`.\`SortOrder\`, \`st\`.\`IsActive\`,
         \`st\`.\`CreatedBy\`, \`st\`.\`CreatedDate\`, \`st\`.\`ModifiedBy\`, \`st\`.\`ModifiedDate\`,
         \`d\`.\`Name\` AS \`DepartmentName\`,
         \`t\`.\`Name\` AS \`TeamName\`
    FROM \`Staff\` AS \`st\`
    LEFT JOIN \`Department\` AS \`d\` ON \`d\`.\`Code\` = \`st\`.\`DepartmentCode\`
    LEFT JOIN \`Team\`       AS \`t\` ON \`t\`.\`Code\` = \`st\`.\`TeamCode\`
   ORDER BY \`st\`.\`SortOrder\`, \`st\`.\`FullName\``;

/** GET: danh sách nhân sự */
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

    return apiOk(rows, "Lấy danh sách nhân sự thành công");
  } catch (err) {
    console.error("[api/staff GET] error:", err);
    return apiFail("Lỗi tải danh sách nhân sự", {
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
    const fullName = (body.fullName || "").trim();

    if (!code || !fullName) {
      return apiFail("Mã và họ tên là bắt buộc", {
        title: "Thiếu thông tin",
        severity: "warning",
        httpStatus: 400,
      });
    }
    if (!body.storeCode || !body.position || !body.gender) {
      return apiFail("Chi nhánh, chức vụ và giới tính là bắt buộc", {
        title: "Thiếu thông tin",
        severity: "warning",
        httpStatus: 400,
      });
    }

    const dup = await query("SELECT 1 FROM `Staff` WHERE `Code` = :code", { code });
    if (dup.length > 0) {
      return apiFail("Mã nhân sự đã tồn tại", {
        title: "Trùng dữ liệu",
        severity: "warning",
        httpStatus: 409,
      });
    }

    // Không truyền sortOrder -> tự động lấy số thứ tự kế tiếp (MAX + 1).
    // Dùng INSERT ... SELECT với bảng dẫn xuất vì MySQL không cho phép truy vấn
    // con đọc chính bảng đang được INSERT trong mệnh đề VALUES.
    await execute(
      `INSERT INTO \`Staff\`
         (\`Code\`,\`FullName\`,\`Position\`,\`Gender\`,\`DateOfBirth\`,\`Phone\`,\`Email\`,
          \`StoreCode\`,\`DepartmentCode\`,\`TeamCode\`,
          \`Note\`,\`SortOrder\`,\`IsActive\`,\`CreatedBy\`,\`CreatedDate\`)
       SELECT :code, :fullName, :position, :gender, :dateOfBirth, :phone, :email,
              :storeCode, :departmentCode, :teamCode, :note,
              IFNULL(:sortOrder, \`nx\`.\`n\`),
              :isActive, :createdBy, NOW(6)
         FROM (SELECT IFNULL(MAX(\`SortOrder\`), 0) + 1 AS \`n\` FROM \`Staff\`) AS \`nx\``,
      {
        code,
        fullName,
        position: body.position || null,
        gender: body.gender || null,
        dateOfBirth: body.dateOfBirth || null,
        phone: body.phone || null,
        email: body.email || null,
        storeCode: body.storeCode || null,
        departmentCode: body.departmentCode || null,
        teamCode: body.teamCode || null,
        note: body.note || null,
        sortOrder: optionalInt(body.sortOrder),
        isActive: body.isActive === false ? 0 : 1,
        createdBy: body.actor || null,
      }
    );

    return apiOk(null, "Tạo nhân sự thành công", { httpStatus: 201 });
  } catch (err) {
    console.error("[api/staff POST] error:", err);
    return apiFail("Lỗi tạo nhân sự", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}
