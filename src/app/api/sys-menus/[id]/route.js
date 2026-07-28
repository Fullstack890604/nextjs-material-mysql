import { queryOne, execute, optionalInt } from "@/lib/db";
import { apiOk, apiFail } from "@/lib/apiResponse";

export const runtime = "nodejs";

/** PUT: cập nhật menu */
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const text = (body.text || "").trim();

    if (!text) {
      return apiFail("Tên menu (Text) là bắt buộc", {
        title: "Thiếu thông tin",
        severity: "warning",
        httpStatus: 400,
      });
    }

    const current = await queryOne(
      "SELECT `ParentId`, `SortOrder` FROM `SysMenus` WHERE `Id` = :id",
      { id: Number(id) }
    );
    if (!current) {
      return apiFail("Không tìm thấy menu", {
        title: "Not Found",
        severity: "info",
        httpStatus: 404,
      });
    }

    const parentId = Number.isFinite(+body.parentId) ? +body.parentId : 0;

    // Không truyền sortOrder -> giữ nguyên nếu vẫn cùng menu cha; đổi cha thì
    // lấy số kế tiếp của cha mới. Tính sẵn ở đây thay vì dùng truy vấn con đọc
    // chính SysMenus bên trong UPDATE (MySQL không cho phép).
    let sortOrder = optionalInt(body.sortOrder);
    if (sortOrder === null) {
      if (Number(current.ParentId) === parentId) {
        sortOrder = current.SortOrder;
      } else {
        const next = await queryOne(
          "SELECT IFNULL(MAX(`SortOrder`), 0) + 1 AS `n` FROM `SysMenus` WHERE `ParentId` = :parentId",
          { parentId }
        );
        sortOrder = next?.n ?? 1;
      }
    }

    await execute(
      `UPDATE \`SysMenus\` SET
         \`ParentId\` = :parentId, \`Text\` = :text, \`name\` = :name, \`Path\` = :path,
         \`Icon\` = :icon, \`IsActive\` = :isActive, \`IconColor\` = :iconColor,
         \`SortOrder\` = :sortOrder
       WHERE \`Id\` = :id`,
      {
        parentId,
        text,
        name: body.name || "",
        path: body.path || "",
        icon: body.icon || "",
        isActive: body.isActive === false ? 0 : 1,
        // Để trống -> Sidebar tự lấy màu "primary.main" của theme (src/palette.js)
        iconColor: body.iconColor || "",
        sortOrder,
        id: Number(id),
      }
    );

    return apiOk(null, "Cập nhật menu thành công");
  } catch (err) {
    console.error("[api/sys-menus PUT] error:", err);
    return apiFail("Lỗi cập nhật menu", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}

/** DELETE: xóa menu (không cho xóa khi còn menu con) */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;

    const children = await queryOne(
      "SELECT COUNT(*) AS `c` FROM `SysMenus` WHERE `ParentId` = :id",
      { id: Number(id) }
    );
    if (children.c > 0) {
      return apiFail("Menu này còn menu con, không thể xóa", {
        title: "Không thể xóa",
        severity: "warning",
        httpStatus: 409,
      });
    }

    const { affectedRows } = await execute(
      "DELETE FROM `SysMenus` WHERE `Id` = :id",
      { id: Number(id) }
    );

    if (affectedRows === 0) {
      return apiFail("Không tìm thấy menu", {
        title: "Not Found",
        severity: "info",
        httpStatus: 404,
      });
    }
    return apiOk(null, "Xóa menu thành công");
  } catch (err) {
    console.error("[api/sys-menus DELETE] error:", err);
    return apiFail("Lỗi xóa menu", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}
