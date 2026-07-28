import { query, execute, optionalInt } from "@/lib/db";
import { apiOk, apiFail } from "@/lib/apiResponse";

export const runtime = "nodejs";

/** PUT: cập nhật (khóa chính Code không đổi) */
export async function PUT(request, { params }) {
  try {
    const { code } = await params;
    const body = await request.json();
    const fullName = (body.fullName || "").trim();

    if (!fullName) {
      return apiFail("Họ tên là bắt buộc", {
        title: "Thiếu thông tin",
        severity: "warning",
        httpStatus: 400,
      });
    }
    if (!body.storeCode || !body.position || !body.gender) {
      return apiFail("Chi nhánh, chức vụ và giới tính là bắt buộc", {
        title: "Thiếu thông tin",
        severity: "warning",
        httpStatus: 400,
      });
    }

    const exists = await query("SELECT 1 FROM `Staff` WHERE `Code` = :code", { code });
    if (exists.length === 0) {
      return apiFail("Không tìm thấy nhân sự", {
        title: "Not Found",
        severity: "info",
        httpStatus: 404,
      });
    }

    // Không truyền sortOrder -> giữ nguyên thứ tự hiện có
    await execute(
      `UPDATE \`Staff\` SET
         \`FullName\` = :fullName,
         \`Position\` = :position,
         \`Gender\` = :gender,
         \`DateOfBirth\` = :dateOfBirth,
         \`Phone\` = :phone,
         \`Email\` = :email,
         \`StoreCode\` = :storeCode,
         \`DepartmentCode\` = :departmentCode,
         \`TeamCode\` = :teamCode,
         \`Note\` = :note,
         \`SortOrder\` = IFNULL(:sortOrder, \`SortOrder\`),
         \`IsActive\` = :isActive,
         \`ModifiedBy\` = :modifiedBy,
         \`ModifiedDate\` = NOW(6)
       WHERE \`Code\` = :code`,
      {
        fullName,
        position: body.position || null,
        gender: body.gender || null,
        dateOfBirth: body.dateOfBirth || null,
        phone: body.phone || null,
        email: body.email || null,
        storeCode: body.storeCode || null,
        departmentCode: body.departmentCode || null,
        teamCode: body.teamCode || null,
        note: body.note || null,
        sortOrder: optionalInt(body.sortOrder),
        isActive: body.isActive === false ? 0 : 1,
        modifiedBy: body.actor || null,
        code,
      }
    );

    return apiOk(null, "Cập nhật nhân sự thành công");
  } catch (err) {
    console.error("[api/staff PUT] error:", err);
    return apiFail("Lỗi cập nhật nhân sự", {
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
      "DELETE FROM `Staff` WHERE `Code` = :code",
      { code }
    );

    if (affectedRows === 0) {
      return apiFail("Không tìm thấy nhân sự", {
        title: "Not Found",
        severity: "info",
        httpStatus: 404,
      });
    }
    return apiOk(null, "Xóa nhân sự thành công");
  } catch (err) {
    console.error("[api/staff DELETE] error:", err);
    return apiFail("Lỗi xóa nhân sự", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}
