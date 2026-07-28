import { query, execute, optionalInt } from "@/lib/db";
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
    const departmentCode = (body.departmentCode || "").trim();

    if (!name || !departmentCode) {
      return apiFail("Tên tổ/nhóm và phòng ban là bắt buộc", {
        title: "Thiếu thông tin",
        severity: "warning",
        httpStatus: 400,
      });
    }

    const exists = await query("SELECT 1 FROM `Team` WHERE `Code` = :code", { code });
    if (exists.length === 0) {
      return apiFail("Không tìm thấy tổ, nhóm", {
        title: "Not Found",
        severity: "info",
        httpStatus: 404,
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
        WHERE \`Name\` = :name AND \`DepartmentCode\` = :departmentCode AND \`Code\` <> :code`,
      { name, departmentCode, code }
    );
    if (dup.length > 0) {
      return apiFail("Phòng ban này đã có tổ/nhóm cùng tên", {
        title: "Trùng dữ liệu",
        severity: "warning",
        httpStatus: 409,
      });
    }

    // Bỏ trống định biên -> lưu 0; không truyền sortOrder -> giữ nguyên thứ tự hiện có
    await execute(
      `UPDATE \`Team\` SET
         \`Name\` = :name, \`DepartmentCode\` = :departmentCode, \`Description\` = :description,
         \`LeaderCode\` = :leaderCode, \`HeadCount\` = IFNULL(:headCount, 0),
         \`SortOrder\` = IFNULL(:sortOrder, \`SortOrder\`),
         \`IsActive\` = :isActive, \`ModifiedBy\` = :modifiedBy, \`ModifiedDate\` = NOW(6)
       WHERE \`Code\` = :code`,
      {
        name,
        departmentCode,
        description: nullIfBlank(body.description),
        leaderCode: nullIfBlank(body.leaderCode),
        headCount: optionalInt(body.headCount),
        sortOrder: optionalInt(body.sortOrder),
        isActive: body.isActive === false ? 0 : 1,
        modifiedBy: body.actor || null,
        code,
      }
    );

    return apiOk(null, "Cập nhật tổ, nhóm thành công");
  } catch (err) {
    console.error("[api/teams PUT] error:", err);
    return apiFail("Lỗi cập nhật tổ, nhóm", {
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
    const { affectedRows } = await execute(
      "DELETE FROM `Team` WHERE `Code` = :code",
      { code }
    );

    if (affectedRows === 0) {
      return apiFail("Không tìm thấy tổ, nhóm", {
        title: "Not Found",
        severity: "info",
        httpStatus: 404,
      });
    }
    return apiOk(null, "Xóa tổ, nhóm thành công");
  } catch (err) {
    console.error("[api/teams DELETE] error:", err);
    return apiFail("Lỗi xóa tổ, nhóm", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}
