import { query, execute } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { apiOk, apiFail } from "@/lib/apiResponse";

export const runtime = "nodejs";

const SELECT_COLUMNS = `\`Id\`,\`UserName\`,\`Description\`,\`EmployeeCode\`,\`StoreCode\`,
  \`CompanyCode\`,\`IsAdmin\`,\`Locked\`,\`Notes\`,\`Status\`,\`DefaultPage\`,
  \`CreatedBy\`,\`CreatedDate\`,\`ModifiedBy\`,\`ModifiedDate\``;

/** GET: danh sách tài khoản (không trả về mật khẩu) */
export async function GET() {
  try {
    const rows = await query(
      `SELECT ${SELECT_COLUMNS} FROM \`SysAccounts\` ORDER BY \`UserName\``
    );

    if (rows.length === 0) {
      return apiFail("Không có dữ liệu", {
        title: "Not Found",
        severity: "info",
        httpStatus: 200,
      });
    }

    return apiOk(rows, "Lấy danh sách tài khoản thành công");
  } catch (err) {
    console.error("[api/accounts GET] error:", err);
    return apiFail("Lỗi tải danh sách tài khoản", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}

/** POST: tạo tài khoản mới */
export async function POST(request) {
  try {
    const body = await request.json();
    const userName = (body.userName || "").trim();
    const password = body.password || "";

    if (!userName || !password) {
      return apiFail("Tên đăng nhập và mật khẩu là bắt buộc", {
        title: "Thiếu thông tin",
        severity: "warning",
        httpStatus: 400,
      });
    }

    const dup = await query(
      "SELECT 1 FROM `SysAccounts` WHERE `UserName` = :userName",
      { userName }
    );
    if (dup.length > 0) {
      return apiFail("Tên đăng nhập đã tồn tại", {
        title: "Trùng dữ liệu",
        severity: "warning",
        httpStatus: 409,
      });
    }

    await execute(
      `INSERT INTO \`SysAccounts\`
         (\`UserName\`,\`Password\`,\`Description\`,\`EmployeeCode\`,\`StoreCode\`,
          \`CompanyCode\`,\`IsAdmin\`,\`Locked\`,\`Notes\`,\`Status\`,\`DefaultPage\`,
          \`CreatedBy\`,\`CreatedDate\`)
       VALUES
         (:userName,:password,:description,:employeeCode,:storeCode,
          :companyCode,:isAdmin,:locked,:notes,:status,:defaultPage,
          :createdBy,NOW(6))`,
      {
        userName,
        password: hashPassword(password),
        description: body.description || null,
        employeeCode: body.employeeCode || null,
        storeCode: body.storeCode || null,
        companyCode: body.companyCode || null,
        isAdmin: body.isAdmin ? 1 : 0,
        locked: body.locked ? 1 : 0,
        notes: body.notes || null,
        status: body.status || "Active",
        defaultPage: body.defaultPage || null,
        createdBy: body.actor || null,
      }
    );

    return apiOk(null, "Tạo tài khoản thành công", { httpStatus: 201 });
  } catch (err) {
    console.error("[api/accounts POST] error:", err);
    return apiFail("Lỗi tạo tài khoản", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}
