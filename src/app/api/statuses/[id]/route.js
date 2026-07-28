import { query, queryOne, execute, optionalInt } from "@/lib/db";
import { apiOk, apiFail } from "@/lib/apiResponse";

export const runtime = "nodejs";

/** PUT: cập nhật trạng thái theo Id (cho phép đổi cả loại lẫn mã) */
export async function PUT(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const groupCode = (body.groupCode || "").trim();
    const code = (body.code || "").trim();
    const name = (body.name || "").trim();

    if (!groupCode || !code || !name) {
      return apiFail("Loại trạng thái, mã và tên là bắt buộc", {
        title: "Thiếu thông tin",
        severity: "warning",
        httpStatus: 400,
      });
    }

    const current = await queryOne(
      "SELECT `GroupCode`, `SortOrder` FROM `Status` WHERE `Id` = :id",
      { id: Number(id) }
    );
    if (!current) {
      return apiFail("Không tìm thấy trạng thái", {
        title: "Not Found",
        severity: "info",
        httpStatus: 404,
      });
    }

    const group = await query(
      "SELECT 1 FROM `StatusGroup` WHERE `Code` = :groupCode",
      { groupCode }
    );
    if (group.length === 0) {
      return apiFail("Loại trạng thái không tồn tại", {
        title: "Dữ liệu không hợp lệ",
        severity: "warning",
        httpStatus: 400,
      });
    }

    // Mã và tên chỉ cần duy nhất TRONG cùng một loại trạng thái.
    const dup = await query(
      `SELECT 1 FROM \`Status\`
        WHERE \`GroupCode\` = :groupCode
          AND (\`Code\` = :code OR \`Name\` = :name)
          AND \`Id\` <> :id`,
      { groupCode, code, name, id: Number(id) }
    );
    if (dup.length > 0) {
      return apiFail("Loại này đã có trạng thái trùng mã hoặc trùng tên", {
        title: "Trùng dữ liệu",
        severity: "warning",
        httpStatus: 409,
      });
    }

    // Không truyền sortOrder -> giữ nguyên nếu vẫn cùng loại; đổi loại thì xếp
    // xuống cuối loại mới. Tính sẵn ở đây thay vì dùng truy vấn con đọc chính
    // bảng Status bên trong UPDATE (MySQL không cho phép).
    let sortOrder = optionalInt(body.sortOrder);
    if (sortOrder === null) {
      if (current.GroupCode === groupCode) {
        sortOrder = current.SortOrder;
      } else {
        const next = await queryOne(
          "SELECT IFNULL(MAX(`SortOrder`), 0) + 1 AS `n` FROM `Status` WHERE `GroupCode` = :groupCode",
          { groupCode }
        );
        sortOrder = next?.n ?? 1;
      }
    }

    await execute(
      `UPDATE \`Status\` SET
         \`GroupCode\` = :groupCode,
         \`Code\` = :code,
         \`Name\` = :name,
         \`Description\` = :description,
         \`Color\` = :color,
         \`IsFinal\` = :isFinal,
         \`SortOrder\` = :sortOrder,
         \`IsActive\` = :isActive,
         \`ModifiedBy\` = :modifiedBy,
         \`ModifiedDate\` = NOW(6)
       WHERE \`Id\` = :id`,
      {
        groupCode,
        code,
        name,
        description: body.description || null,
        color: body.color || "",
        isFinal: body.isFinal ? 1 : 0,
        sortOrder,
        isActive: body.isActive === false ? 0 : 1,
        modifiedBy: body.actor || null,
        id: Number(id),
      }
    );

    return apiOk(null, "Cập nhật trạng thái thành công");
  } catch (err) {
    console.error("[api/statuses PUT] error:", err);
    return apiFail("Lỗi cập nhật trạng thái", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}

/** DELETE: xóa trạng thái theo Id */
export async function DELETE(request, { params }) {
  try {
    const { id } = await params;
    const { affectedRows } = await execute(
      "DELETE FROM `Status` WHERE `Id` = :id",
      { id: Number(id) }
    );

    if (affectedRows === 0) {
      return apiFail("Không tìm thấy trạng thái", {
        title: "Not Found",
        severity: "info",
        httpStatus: 404,
      });
    }
    return apiOk(null, "Xóa trạng thái thành công");
  } catch (err) {
    console.error("[api/statuses DELETE] error:", err);
    return apiFail("Lỗi xóa trạng thái", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}
