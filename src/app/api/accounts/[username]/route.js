import { query, execute } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { apiOk, apiFail } from "@/lib/apiResponse";

export const runtime = "nodejs";

/** PUT: cập nhật tài khoản (mật khẩu chỉ đổi khi có nhập) */
export async function PUT(request, { params }) {
  try {
    const { username } = await params;
    const body = await request.json();

    const exists = await query(
      "SELECT 1 FROM `SysAccounts` WHERE `UserName` = :userName",
      { userName: username }
    );
    if (exists.length === 0) {
      return apiFail("Không tìm thấy tài khoản", {
        title: "Not Found",
        severity: "info",
        httpStatus: 404,
      });
    }

    const values = {
      userName: username,
      description: body.description || null,
      employeeCode: body.employeeCode || null,
      storeCode: body.storeCode || null,
      companyCode: body.companyCode || null,
      isAdmin: body.isAdmin ? 1 : 0,
      locked: body.locked ? 1 : 0,
      notes: body.notes || null,
      status: body.status || "Active",
      defaultPage: body.defaultPage || null,
      modifiedBy: body.actor || null,
    };

    let passwordSet = "";
    if (body.password) {
      values.password = hashPassword(body.password);
      passwordSet = "`Password` = :password,";
    }

    await execute(
      `UPDATE \`SysAccounts\` SET
         ${passwordSet}
         \`Description\` = :description,
         \`EmployeeCode\` = :employeeCode,
         \`StoreCode\` = :storeCode,
         \`CompanyCode\` = :companyCode,
         \`IsAdmin\` = :isAdmin,
         \`Locked\` = :locked,
         \`Notes\` = :notes,
         \`Status\` = :status,
         \`DefaultPage\` = :defaultPage,
         \`ModifiedBy\` = :modifiedBy,
         \`ModifiedDate\` = NOW(6)
       WHERE \`UserName\` = :userName`,
      values
    );

    return apiOk(null, "Cập nhật tài khoản thành công");
  } catch (err) {
    console.error("[api/accounts PUT] error:", err);
    return apiFail("Lỗi cập nhật tài khoản", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}

/** DELETE: xóa tài khoản */
export async function DELETE(request, { params }) {
  try {
    const { username } = await params;
    const { affectedRows } = await execute(
      "DELETE FROM `SysAccounts` WHERE `UserName` = :userName",
      { userName: username }
    );

    if (affectedRows === 0) {
      return apiFail("Không tìm thấy tài khoản", {
        title: "Not Found",
        severity: "info",
        httpStatus: 404,
      });
    }
    return apiOk(null, "Xóa tài khoản thành công");
  } catch (err) {
    console.error("[api/accounts DELETE] error:", err);
    return apiFail("Lỗi xóa tài khoản", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}
