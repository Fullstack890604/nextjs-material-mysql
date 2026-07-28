import { query, execute } from "@/lib/db";
import { apiOk, apiFail } from "@/lib/apiResponse";

export const runtime = "nodejs";

/** PUT: cập nhật (Code không đổi) */
export async function PUT(request, { params }) {
  try {
    const { code } = await params;
    const body = await request.json();
    const name = (body.name || "").trim();

    if (!name) {
      return apiFail("Tên công ty là bắt buộc", {
        title: "Thiếu thông tin",
        severity: "warning",
        httpStatus: 400,
      });
    }

    const exists = await query("SELECT 1 FROM `Company` WHERE `Code` = :code", { code });
    if (exists.length === 0) {
      return apiFail("Không tìm thấy công ty", {
        title: "Not Found",
        severity: "info",
        httpStatus: 404,
      });
    }

    await execute(
      `UPDATE \`Company\` SET
         \`Name\` = :name, \`ShortName\` = :shortName, \`TaxCode\` = :taxCode,
         \`Address\` = :address, \`Phone\` = :phone, \`Email\` = :email,
         \`Website\` = :website, \`Representative\` = :representative, \`Note\` = :note,
         \`SortOrder\` = :sortOrder, \`IsActive\` = :isActive,
         \`ModifiedBy\` = :modifiedBy, \`ModifiedDate\` = NOW(6)
       WHERE \`Code\` = :code`,
      {
        name,
        shortName: body.shortName || null,
        taxCode: body.taxCode || null,
        address: body.address || null,
        phone: body.phone || null,
        email: body.email || null,
        website: body.website || null,
        representative: body.representative || null,
        note: body.note || null,
        sortOrder: Number.isFinite(+body.sortOrder) ? +body.sortOrder : 0,
        isActive: body.isActive === false ? 0 : 1,
        modifiedBy: body.actor || null,
        code,
      }
    );

    return apiOk(null, "Cập nhật công ty thành công");
  } catch (err) {
    console.error("[api/companies PUT] error:", err);
    return apiFail("Lỗi cập nhật công ty", {
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
      "DELETE FROM `Company` WHERE `Code` = :code",
      { code }
    );

    if (affectedRows === 0) {
      return apiFail("Không tìm thấy công ty", {
        title: "Not Found",
        severity: "info",
        httpStatus: 404,
      });
    }
    return apiOk(null, "Xóa công ty thành công");
  } catch (err) {
    console.error("[api/companies DELETE] error:", err);
    return apiFail("Lỗi xóa công ty", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}
