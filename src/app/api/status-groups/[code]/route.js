import { query, queryOne, execute, optionalInt } from "@/lib/db";
import { apiOk, apiFail } from "@/lib/apiResponse";

export const runtime = "nodejs";

/** PUT: cập nhật (Code không đổi) */
export async function PUT(request, { params }) {
  try {
    const { code } = await params;
    const body = await request.json();
    const name = (body.name || "").trim();

    if (!name) {
      return apiFail("Tên loại trạng thái là bắt buộc", {
        title: "Thiếu thông tin",
        severity: "warning",
        httpStatus: 400,
      });
    }

    const exists = await query("SELECT 1 FROM `StatusGroup` WHERE `Code` = :code", { code });
    if (exists.length === 0) {
      return apiFail("Không tìm thấy loại trạng thái", {
        title: "Not Found",
        severity: "info",
        httpStatus: 404,
      });
    }

    const dup = await query(
      "SELECT 1 FROM `StatusGroup` WHERE `Name` = :name AND `Code` <> :code",
      { name, code }
    );
    if (dup.length > 0) {
      return apiFail("Tên loại trạng thái đã tồn tại", {
        title: "Trùng dữ liệu",
        severity: "warning",
        httpStatus: 409,
      });
    }

    // Không truyền sortOrder -> giữ nguyên thứ tự hiện có
    await execute(
      `UPDATE \`StatusGroup\` SET
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

    return apiOk(null, "Cập nhật loại trạng thái thành công");
  } catch (err) {
    console.error("[api/status-groups PUT] error:", err);
    return apiFail("Lỗi cập nhật loại trạng thái", {
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

    // Còn trạng thái trực thuộc thì chặn ngay, tránh để khóa ngoại
    // FK_Status_StatusGroup ném lỗi thô (MySQL 1451) khó hiểu cho người dùng.
    const used = await queryOne(
      "SELECT COUNT(*) AS `Total` FROM `Status` WHERE `GroupCode` = :code",
      { code }
    );
    const total = used?.Total || 0;
    if (total > 0) {
      return apiFail(
        `Không thể xóa: loại này đang có ${total} trạng thái trực thuộc. Vui lòng xóa hoặc chuyển các trạng thái này trước.`,
        { title: "Ràng buộc dữ liệu", severity: "warning", httpStatus: 409 }
      );
    }

    const { affectedRows } = await execute(
      "DELETE FROM `StatusGroup` WHERE `Code` = :code",
      { code }
    );

    if (affectedRows === 0) {
      return apiFail("Không tìm thấy loại trạng thái", {
        title: "Not Found",
        severity: "info",
        httpStatus: 404,
      });
    }
    return apiOk(null, "Xóa loại trạng thái thành công");
  } catch (err) {
    console.error("[api/status-groups DELETE] error:", err);
    return apiFail("Lỗi xóa loại trạng thái", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}
