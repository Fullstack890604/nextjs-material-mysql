import { query, execute, optionalInt } from "@/lib/db";
import { apiOk, apiFail } from "@/lib/apiResponse";

export const runtime = "nodejs";

const COLUMNS = `\`LocationCode\`,\`LocationName\`,\`Region\`,\`Address\`,\`City\`,\`Country\`,
  \`Brand\`,\`IsActive\`,\`SortOrder\`,\`CreatedBy\`,\`CreatedAt\`,\`UpdatedBy\`,\`UpdatedAt\``;

/** GET: danh sách địa điểm */
export async function GET() {
  try {
    const rows = await query(
      `SELECT ${COLUMNS} FROM \`Locations\` ORDER BY \`SortOrder\`, \`LocationName\``
    );

    if (rows.length === 0) {
      return apiFail("Không có dữ liệu", {
        title: "Not Found",
        severity: "info",
        httpStatus: 200,
      });
    }
    return apiOk(rows, "Lấy danh sách địa điểm thành công");
  } catch (err) {
    console.error("[api/locations GET] error:", err);
    return apiFail("Lỗi tải danh sách địa điểm", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}

/** POST: tạo mới địa điểm */
export async function POST(request) {
  try {
    const body = await request.json();
    const code = (body.locationCode || "").trim();
    const name = (body.locationName || "").trim();

    if (!code || !name) {
      return apiFail("Mã và tên địa điểm là bắt buộc", {
        title: "Thiếu thông tin",
        severity: "warning",
        httpStatus: 400,
      });
    }

    const dup = await query(
      "SELECT 1 FROM `Locations` WHERE `LocationCode` = :code",
      { code }
    );
    if (dup.length > 0) {
      return apiFail("Mã địa điểm đã tồn tại", {
        title: "Trùng dữ liệu",
        severity: "warning",
        httpStatus: 409,
      });
    }

    // Không truyền sortOrder -> tự động lấy số thứ tự kế tiếp (MAX + 1).
    // Dùng INSERT ... SELECT với bảng dẫn xuất vì MySQL không cho phép truy vấn
    // con đọc chính bảng đang được INSERT trong mệnh đề VALUES.
    // CreatedAt là cột datetime (không có phần giây lẻ) nên dùng NOW().
    await execute(
      `INSERT INTO \`Locations\`
         (\`LocationCode\`,\`LocationName\`,\`Region\`,\`Address\`,\`City\`,\`Country\`,
          \`Brand\`,\`IsActive\`,\`SortOrder\`,\`CreatedBy\`,\`CreatedAt\`)
       SELECT :locationCode, :locationName, :region, :address, :city, :country,
              :brand, :isActive,
              IFNULL(:sortOrder, \`nx\`.\`n\`),
              :createdBy, NOW()
         FROM (SELECT IFNULL(MAX(\`SortOrder\`), 0) + 1 AS \`n\` FROM \`Locations\`) AS \`nx\``,
      {
        locationCode: code,
        locationName: name,
        region: body.region || null,
        address: body.address || null,
        city: body.city || null,
        country: body.country || null,
        brand: body.brand || "",
        isActive: body.isActive === false ? 0 : 1,
        sortOrder: optionalInt(body.sortOrder),
        createdBy: body.actor || null,
      }
    );

    return apiOk(null, "Tạo địa điểm thành công", { httpStatus: 201 });
  } catch (err) {
    console.error("[api/locations POST] error:", err);
    return apiFail("Lỗi tạo địa điểm", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}
