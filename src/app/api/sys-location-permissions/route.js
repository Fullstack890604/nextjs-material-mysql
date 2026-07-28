import { query, execute } from "@/lib/db";
import { apiOk, apiFail } from "@/lib/apiResponse";

export const runtime = "nodejs";

/** GET: danh sách phân quyền địa điểm theo tài khoản */
export async function GET() {
  try {
    const rows = await query(
      `SELECT
          \`p\`.\`Id\`, \`p\`.\`AccountId\`, \`a\`.\`UserName\` AS \`AccountName\`,
          \`a\`.\`Description\` AS \`AccountDescription\`,
          \`p\`.\`ListCompany\`, \`p\`.\`Locked\`, \`p\`.\`Notes\`
        FROM \`SysLocationPermissions\` \`p\`
        JOIN \`SysAccounts\` \`a\` ON \`a\`.\`Id\` = \`p\`.\`AccountId\`
       ORDER BY \`a\`.\`UserName\``
    );

    if (rows.length === 0) {
      return apiFail("Không có dữ liệu", {
        title: "Not Found",
        severity: "info",
        httpStatus: 200,
      });
    }
    return apiOk(rows, "Lấy phân quyền địa điểm thành công");
  } catch (err) {
    console.error("[api/sys-location-permissions GET] error:", err);
    return apiFail("Lỗi tải phân quyền địa điểm", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}

/** POST: tạo phân quyền địa điểm cho một tài khoản */
export async function POST(request) {
  try {
    const body = await request.json();
    const accountId = +body.accountId;
    const listCompany = Array.isArray(body.locationCodes)
      ? body.locationCodes.filter(Boolean).join(",")
      : (body.listCompany || "").trim();

    if (!Number.isInteger(accountId)) {
      return apiFail("Vui lòng chọn tài khoản", {
        title: "Thiếu thông tin",
        severity: "warning",
        httpStatus: 400,
      });
    }
    if (!listCompany) {
      return apiFail("Vui lòng chọn ít nhất một địa điểm", {
        title: "Thiếu thông tin",
        severity: "warning",
        httpStatus: 400,
      });
    }

    const dup = await query(
      "SELECT 1 FROM `SysLocationPermissions` WHERE `AccountId` = :accountId",
      { accountId }
    );
    if (dup.length > 0) {
      return apiFail("Tài khoản đã có phân quyền địa điểm", {
        title: "Trùng dữ liệu",
        severity: "warning",
        httpStatus: 409,
      });
    }

    // CreatedDate là cột datetime (không có phần giây lẻ) nên dùng NOW().
    await execute(
      `INSERT INTO \`SysLocationPermissions\`
         (\`AccountId\`,\`ListCompany\`,\`Locked\`,\`Notes\`,\`CreatedBy\`,\`CreatedDate\`)
       VALUES
         (:accountId,:listCompany,:locked,:notes,:createdBy,NOW())`,
      {
        accountId,
        listCompany,
        locked: body.locked ? 1 : 0,
        notes: body.notes || null,
        createdBy: body.actor || null,
      }
    );

    return apiOk(null, "Tạo phân quyền địa điểm thành công", { httpStatus: 201 });
  } catch (err) {
    console.error("[api/sys-location-permissions POST] error:", err);
    return apiFail("Lỗi tạo phân quyền địa điểm", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}
