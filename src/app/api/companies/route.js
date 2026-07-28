import { query, execute } from "@/lib/db";
import { apiOk, apiFail } from "@/lib/apiResponse";

export const runtime = "nodejs";

const COLUMNS = `\`Code\`,\`Name\`,\`ShortName\`,\`TaxCode\`,\`Address\`,\`Phone\`,\`Email\`,
  \`Website\`,\`Representative\`,\`Note\`,\`SortOrder\`,\`IsActive\`,
  \`CreatedBy\`,\`CreatedDate\`,\`ModifiedBy\`,\`ModifiedDate\``;

/** GET: danh sách công ty */
export async function GET() {
  try {
    const rows = await query(
      `SELECT ${COLUMNS} FROM \`Company\` ORDER BY \`SortOrder\`, \`Name\``
    );

    if (rows.length === 0) {
      return apiFail("Không có dữ liệu", {
        title: "Not Found",
        severity: "info",
        httpStatus: 200,
      });
    }
    return apiOk(rows, "Lấy danh sách công ty thành công");
  } catch (err) {
    console.error("[api/companies GET] error:", err);
    return apiFail("Lỗi tải danh sách công ty", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}

/** POST: tạo mới */
export async function POST(request) {
  try {
    const body = await request.json();
    const code = (body.code || "").trim();
    const name = (body.name || "").trim();

    if (!code || !name) {
      return apiFail("Mã và tên công ty là bắt buộc", {
        title: "Thiếu thông tin",
        severity: "warning",
        httpStatus: 400,
      });
    }

    const dup = await query("SELECT 1 FROM `Company` WHERE `Code` = :code", { code });
    if (dup.length > 0) {
      return apiFail("Mã công ty đã tồn tại", {
        title: "Trùng dữ liệu",
        severity: "warning",
        httpStatus: 409,
      });
    }

    await execute(
      `INSERT INTO \`Company\`
         (\`Code\`,\`Name\`,\`ShortName\`,\`TaxCode\`,\`Address\`,\`Phone\`,\`Email\`,
          \`Website\`,\`Representative\`,\`Note\`,\`SortOrder\`,\`IsActive\`,\`CreatedBy\`,\`CreatedDate\`)
       VALUES
         (:code,:name,:shortName,:taxCode,:address,:phone,:email,
          :website,:representative,:note,:sortOrder,:isActive,:createdBy,NOW(6))`,
      {
        code,
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
        createdBy: body.actor || null,
      }
    );

    return apiOk(null, "Tạo công ty thành công", { httpStatus: 201 });
  } catch (err) {
    console.error("[api/companies POST] error:", err);
    return apiFail("Lỗi tạo công ty", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}
