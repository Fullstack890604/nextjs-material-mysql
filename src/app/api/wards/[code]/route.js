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
      return apiFail("Tên phường/xã là bắt buộc", {
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

    const exists = await query("SELECT 1 FROM `Ward` WHERE `Code` = :code", { code });
    if (exists.length === 0) {
      return apiFail("Không tìm thấy phường/xã", {
        title: "Not Found",
        severity: "info",
        httpStatus: 404,
      });
    }

    // Không truyền sortOrder -> giữ nguyên thứ tự hiện có
    await execute(
      `UPDATE \`Ward\` SET
         \`Name\` = :name, \`ProvinceCode\` = :provinceCode, \`District\` = :district,
         \`SortOrder\` = IFNULL(:sortOrder, \`SortOrder\`), \`IsActive\` = :isActive,
         \`ModifiedBy\` = :modifiedBy, \`ModifiedDate\` = NOW(6)
       WHERE \`Code\` = :code`,
      {
        name,
        provinceCode: body.provinceCode || null,
        district: body.district || null,
        sortOrder: optionalInt(body.sortOrder),
        isActive: body.isActive === false ? 0 : 1,
        modifiedBy: body.actor || null,
        code,
      }
    );

    return apiOk(null, "Cập nhật phường/xã thành công");
  } catch (err) {
    console.error("[api/wards PUT] error:", err);
    return apiFail("Lỗi cập nhật phường/xã", {
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
      "DELETE FROM `Ward` WHERE `Code` = :code",
      { code }
    );

    if (affectedRows === 0) {
      return apiFail("Không tìm thấy phường/xã", {
        title: "Not Found",
        severity: "info",
        httpStatus: 404,
      });
    }
    return apiOk(null, "Xóa phường/xã thành công");
  } catch (err) {
    console.error("[api/wards DELETE] error:", err);
    return apiFail("Lỗi xóa phường/xã", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}
