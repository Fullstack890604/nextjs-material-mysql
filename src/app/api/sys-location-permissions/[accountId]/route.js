import { query, execute } from "@/lib/db";
import { apiOk, apiFail } from "@/lib/apiResponse";

export const runtime = "nodejs";

/** PUT: cập nhật phân quyền địa điểm theo AccountId */
export async function PUT(request, { params }) {
  try {
    const { accountId: accountIdParam } = await params;
    const accountId = +accountIdParam;
    const body = await request.json();
    const listCompany = Array.isArray(body.locationCodes)
      ? body.locationCodes.filter(Boolean).join(",")
      : (body.listCompany || "").trim();

    if (!listCompany) {
      return apiFail("Vui lòng chọn ít nhất một địa điểm", {
        title: "Thiếu thông tin",
        severity: "warning",
        httpStatus: 400,
      });
    }

    const exists = await query(
      "SELECT 1 FROM `SysLocationPermissions` WHERE `AccountId` = :accountId",
      { accountId }
    );
    if (exists.length === 0) {
      return apiFail("Không tìm thấy phân quyền", {
        title: "Not Found",
        severity: "info",
        httpStatus: 404,
      });
    }

    // ModifiedDate là cột datetime (không có phần giây lẻ) nên dùng NOW().
    await execute(
      `UPDATE \`SysLocationPermissions\` SET
         \`ListCompany\` = :listCompany,
         \`Locked\` = :locked,
         \`Notes\` = :notes,
         \`ModifiedBy\` = :modifiedBy,
         \`ModifiedDate\` = NOW()
       WHERE \`AccountId\` = :accountId`,
      {
        listCompany,
        locked: body.locked ? 1 : 0,
        notes: body.notes || null,
        modifiedBy: body.actor || null,
        accountId,
      }
    );

    return apiOk(null, "Cập nhật phân quyền địa điểm thành công");
  } catch (err) {
    console.error("[api/sys-location-permissions PUT] error:", err);
    return apiFail("Lỗi cập nhật phân quyền địa điểm", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}

/** DELETE: xóa phân quyền địa điểm theo AccountId */
export async function DELETE(request, { params }) {
  try {
    const { accountId: accountIdParam } = await params;
    const accountId = +accountIdParam;
    const { affectedRows } = await execute(
      "DELETE FROM `SysLocationPermissions` WHERE `AccountId` = :accountId",
      { accountId }
    );

    if (affectedRows === 0) {
      return apiFail("Không tìm thấy phân quyền", {
        title: "Not Found",
        severity: "info",
        httpStatus: 404,
      });
    }
    return apiOk(null, "Xóa phân quyền địa điểm thành công");
  } catch (err) {
    console.error("[api/sys-location-permissions DELETE] error:", err);
    return apiFail("Lỗi xóa phân quyền địa điểm", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}
