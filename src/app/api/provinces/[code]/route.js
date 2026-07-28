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
      return apiFail("Tên tỉnh/thành là bắt buộc", {
        title: "Thiếu thông tin",
        severity: "warning",
        httpStatus: 400,
      });
    }

    const exists = await query("SELECT 1 FROM `Province` WHERE `Code` = :code", { code });
    if (exists.length === 0) {
      return apiFail("Không tìm thấy tỉnh/thành", {
        title: "Not Found",
        severity: "info",
        httpStatus: 404,
      });
    }

    const dup = await query(
      "SELECT 1 FROM `Province` WHERE `Name` = :name AND `Code` <> :code",
      { name, code }
    );
    if (dup.length > 0) {
      return apiFail("Tên tỉnh/thành đã tồn tại", {
        title: "Trùng dữ liệu",
        severity: "warning",
        httpStatus: 409,
      });
    }

    // Không truyền sortOrder -> giữ nguyên thứ tự hiện có
    await execute(
      `UPDATE \`Province\` SET
         \`Name\` = :name,
         \`Region\` = :region,
         \`SortOrder\` = IFNULL(:sortOrder, \`SortOrder\`),
         \`IsActive\` = :isActive,
         \`ModifiedBy\` = :modifiedBy,
         \`ModifiedDate\` = NOW(6)
       WHERE \`Code\` = :code`,
      {
        name,
        region: body.region || null,
        sortOrder: optionalInt(body.sortOrder),
        isActive: body.isActive === false ? 0 : 1,
        modifiedBy: body.actor || null,
        code,
      }
    );

    return apiOk(null, "Cập nhật tỉnh/thành thành công");
  } catch (err) {
    console.error("[api/provinces PUT] error:", err);
    return apiFail("Lỗi cập nhật tỉnh/thành", {
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
      "DELETE FROM `Province` WHERE `Code` = :code",
      { code }
    );

    if (affectedRows === 0) {
      return apiFail("Không tìm thấy tỉnh/thành", {
        title: "Not Found",
        severity: "info",
        httpStatus: 404,
      });
    }
    return apiOk(null, "Xóa tỉnh/thành thành công");
  } catch (err) {
    console.error("[api/provinces DELETE] error:", err);
    return apiFail("Lỗi xóa tỉnh/thành", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}
