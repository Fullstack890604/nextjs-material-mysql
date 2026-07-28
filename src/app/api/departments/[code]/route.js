import { query, queryOne, execute, optionalInt } from "@/lib/db";
import { apiOk, apiFail } from "@/lib/apiResponse";

export const runtime = "nodejs";

/** Chuẩn hóa chuỗi: rỗng -> null (để cột nullable không lưu chuỗi rỗng) */
const nullIfBlank = (v) => {
  const s = (v ?? "").toString().trim();
  return s === "" ? null : s;
};

/** PUT: cập nhật (Code không đổi) */
export async function PUT(request, { params }) {
  try {
    const { code } = await params;
    const body = await request.json();
    const name = (body.name || "").trim();

    if (!name) {
      return apiFail("Tên phòng ban là bắt buộc", {
        title: "Thiếu thông tin",
        severity: "warning",
        httpStatus: 400,
      });
    }

    const exists = await query("SELECT 1 FROM `Department` WHERE `Code` = :code", { code });
    if (exists.length === 0) {
      return apiFail("Không tìm thấy phòng ban", {
        title: "Not Found",
        severity: "info",
        httpStatus: 404,
      });
    }

    const dup = await query(
      "SELECT 1 FROM `Department` WHERE `Name` = :name AND `Code` <> :code",
      { name, code }
    );
    if (dup.length > 0) {
      return apiFail("Tên phòng ban đã tồn tại", {
        title: "Trùng dữ liệu",
        severity: "warning",
        httpStatus: 409,
      });
    }

    // Bỏ trống định biên -> lưu 0; không truyền sortOrder -> giữ nguyên thứ tự hiện có
    await execute(
      `UPDATE \`Department\` SET
         \`Name\` = :name, \`Description\` = :description, \`LocationCode\` = :locationCode,
         \`ManagerCode\` = :managerCode, \`Phone\` = :phone, \`Email\` = :email,
         \`HeadCount\` = IFNULL(:headCount, 0), \`SortOrder\` = IFNULL(:sortOrder, \`SortOrder\`),
         \`IsActive\` = :isActive, \`ModifiedBy\` = :modifiedBy, \`ModifiedDate\` = NOW(6)
       WHERE \`Code\` = :code`,
      {
        name,
        description: nullIfBlank(body.description),
        locationCode: nullIfBlank(body.locationCode),
        managerCode: nullIfBlank(body.managerCode),
        phone: nullIfBlank(body.phone),
        email: nullIfBlank(body.email),
        headCount: optionalInt(body.headCount),
        sortOrder: optionalInt(body.sortOrder),
        isActive: body.isActive === false ? 0 : 1,
        modifiedBy: body.actor || null,
        code,
      }
    );

    return apiOk(null, "Cập nhật phòng ban thành công");
  } catch (err) {
    console.error("[api/departments PUT] error:", err);
    return apiFail("Lỗi cập nhật phòng ban", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}

/** DELETE: xóa theo Code */
export async function DELETE(request, { params }) {
  try {
    const { code } = await params;

    // Còn tổ/nhóm trực thuộc thì chặn ngay, tránh để khóa ngoại FK_Team_Department
    // ném lỗi thô (MySQL 1451) và trả về thông báo khó hiểu cho người dùng.
    const teams = await queryOne(
      "SELECT COUNT(*) AS `Total` FROM `Team` WHERE `DepartmentCode` = :code",
      { code }
    );
    const teamCount = teams?.Total || 0;
    if (teamCount > 0) {
      return apiFail(
        `Không thể xóa: phòng ban đang có ${teamCount} tổ/nhóm trực thuộc. Vui lòng xóa hoặc chuyển các tổ/nhóm này trước.`,
        { title: "Ràng buộc dữ liệu", severity: "warning", httpStatus: 409 }
      );
    }

    const { affectedRows } = await execute(
      "DELETE FROM `Department` WHERE `Code` = :code",
      { code }
    );

    if (affectedRows === 0) {
      return apiFail("Không tìm thấy phòng ban", {
        title: "Not Found",
        severity: "info",
        httpStatus: 404,
      });
    }
    return apiOk(null, "Xóa phòng ban thành công");
  } catch (err) {
    console.error("[api/departments DELETE] error:", err);
    return apiFail("Lỗi xóa phòng ban", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}
