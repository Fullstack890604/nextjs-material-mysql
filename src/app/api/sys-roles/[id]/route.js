import { query, execute } from "@/lib/db";
import { apiOk, apiFail } from "@/lib/apiResponse";

export const runtime = "nodejs";

/** PUT: cập nhật nhóm quyền theo Id */
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const name = (body.name || "").trim();

    if (!name) {
      return apiFail("Tên nhóm quyền là bắt buộc", {
        title: "Thiếu thông tin",
        severity: "warning",
        httpStatus: 400,
      });
    }

    const exists = await query("SELECT 1 FROM `SysRoles` WHERE `Id` = :id", { id: +id });
    if (exists.length === 0) {
      return apiFail("Không tìm thấy nhóm quyền", {
        title: "Not Found",
        severity: "info",
        httpStatus: 404,
      });
    }

    const dup = await query(
      "SELECT 1 FROM `SysRoles` WHERE `Name` = :name AND `Id` <> :id",
      { name, id: +id }
    );
    if (dup.length > 0) {
      return apiFail("Tên nhóm quyền đã tồn tại", {
        title: "Trùng dữ liệu",
        severity: "warning",
        httpStatus: 409,
      });
    }

    await execute(
      `UPDATE \`SysRoles\` SET
         \`Name\` = :name,
         \`Description\` = :description,
         \`IsActive\` = :isActive
       WHERE \`Id\` = :id`,
      {
        name,
        description: body.description || null,
        isActive: body.isActive === false ? 0 : 1,
        id: +id,
      }
    );

    return apiOk(null, "Cập nhật nhóm quyền thành công");
  } catch (err) {
    console.error("[api/sys-roles PUT] error:", err);
    return apiFail("Lỗi cập nhật nhóm quyền", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}

/** DELETE: xóa nhóm quyền theo Id */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { affectedRows } = await execute(
      "DELETE FROM `SysRoles` WHERE `Id` = :id",
      { id: +id }
    );

    if (affectedRows === 0) {
      return apiFail("Không tìm thấy nhóm quyền", {
        title: "Not Found",
        severity: "info",
        httpStatus: 404,
      });
    }
    return apiOk(null, "Xóa nhóm quyền thành công");
  } catch (err) {
    console.error("[api/sys-roles DELETE] error:", err);
    return apiFail("Lỗi xóa nhóm quyền", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}
