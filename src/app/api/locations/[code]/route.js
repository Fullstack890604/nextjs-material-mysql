import { query, execute, optionalInt } from "@/lib/db";
import { apiOk, apiFail } from "@/lib/apiResponse";

export const runtime = "nodejs";

/** PUT: cập nhật địa điểm theo LocationCode */
export async function PUT(request, { params }) {
  try {
    const { code } = await params;
    const body = await request.json();
    const name = (body.locationName || "").trim();

    if (!name) {
      return apiFail("Tên địa điểm là bắt buộc", {
        title: "Thiếu thông tin",
        severity: "warning",
        httpStatus: 400,
      });
    }

    const exists = await query(
      "SELECT 1 FROM `Locations` WHERE `LocationCode` = :code",
      { code }
    );
    if (exists.length === 0) {
      return apiFail("Không tìm thấy địa điểm", {
        title: "Not Found",
        severity: "info",
        httpStatus: 404,
      });
    }

    // Không truyền sortOrder -> giữ nguyên thứ tự hiện có.
    // UpdatedAt là cột datetime (không có phần giây lẻ) nên dùng NOW().
    await execute(
      `UPDATE \`Locations\` SET
         \`LocationName\` = :locationName,
         \`Region\` = :region,
         \`Address\` = :address,
         \`City\` = :city,
         \`Country\` = :country,
         \`Brand\` = :brand,
         \`IsActive\` = :isActive,
         \`SortOrder\` = IFNULL(:sortOrder, \`SortOrder\`),
         \`UpdatedBy\` = :updatedBy,
         \`UpdatedAt\` = NOW()
       WHERE \`LocationCode\` = :code`,
      {
        locationName: name,
        region: body.region || null,
        address: body.address || null,
        city: body.city || null,
        country: body.country || null,
        brand: body.brand || "",
        isActive: body.isActive === false ? 0 : 1,
        sortOrder: optionalInt(body.sortOrder),
        updatedBy: body.actor || null,
        code,
      }
    );

    return apiOk(null, "Cập nhật địa điểm thành công");
  } catch (err) {
    console.error("[api/locations PUT] error:", err);
    return apiFail("Lỗi cập nhật địa điểm", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}

/** DELETE: xóa địa điểm theo LocationCode */
export async function DELETE(request, { params }) {
  try {
    const { code } = await params;
    const { affectedRows } = await execute(
      "DELETE FROM `Locations` WHERE `LocationCode` = :code",
      { code }
    );

    if (affectedRows === 0) {
      return apiFail("Không tìm thấy địa điểm", {
        title: "Not Found",
        severity: "info",
        httpStatus: 404,
      });
    }
    return apiOk(null, "Xóa địa điểm thành công");
  } catch (err) {
    console.error("[api/locations DELETE] error:", err);
    return apiFail("Lỗi xóa địa điểm", {
      title: "Lỗi máy chủ",
      severity: "error",
      httpStatus: 500,
    });
  }
}
