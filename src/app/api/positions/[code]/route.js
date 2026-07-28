import { query, execute, optionalInt } from "@/lib/db";
import { apiOk, apiFail } from "@/lib/apiResponse";

export const runtime = "nodejs";

/** PUT: cập nhật (Code không đổi) */
export async function PUT(request, { params }) {
  try {
    const { code } = await params;
    const body = await request.json();
    const name = (body.name || "").trim();

    if (!name) {
      return apiFail("Tên chức vụ là bắt buộc", {
        title: "Thiếu thông tin",
        severity: "warning",
        httpStatus: 400,
      });
    }

    const exists = await query("SELECT 1 FROM `Position` WHERE `Code` = :code", { code });
    if (exists.length === 0) {
      return apiFail("Không tìm thấy chức vụ", {
        title: "Not Found",
        severity: "info",
        httpStatus: 404,
      });
    }

    const dup = await query(
      "SELECT 1 FROM `Position` WHERE `Name` = :name AND `Code` <> :code",
      { name, code }
    );
    if (dup.length > 0) {
      return apiFail("Tên chức vụ đã tồn tại", {
        title: "Trùng dữ liệu",
        severity: "warning",
        httpStatus: 409,
      });
    }

    // Không truyền sortOrder -> giữ nguyên thứ tự hiện có
    await execute(
      `UPDATE \`Position\` SET
         \`Name\` = :name,
         \`Description\` = :description,
         \`SortOrder\` = IFNULL(:sortOrder, \`SortOrder\`),
         \`IsActive\` = :isActive,
         \`ModifiedBy\` = :modifiedBy,
         \`ModifiedDate\` = NOW(6)
       WHERE \`Code\` = :code`,
      {
        name,
        description: body.description || null,
        sortOrder: optionalInt(body.sortOrder),
        isActive: body.isActive === false ? 0 : 1,
        modifiedBy: body.actor || null,
        code,
      }
    );

    return apiOk(null, "Cập nhật chức vụ thành công");
  } catch (err) {
    console.error("[api/positions PUT] error:", err);
    return apiFail("Lỗi cập nhật chức vụ", {
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
      "DELETE FROM `Position` WHERE `Code` = :code",
      { code }
    );

    if (affectedRows === 0) {
      return apiFail("Không tìm thấy chức vụ", {
        title: "Not Found",
        severity: "info",
        httpStatus: 404,
      });
    }
    return apiOk(null, "Xóa chức vụ thành công");
  } catch (err) {
    console.error("[api/positions DELETE] error:", err);
    return apiFail("Lỗi xóa chức vụ", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}
