/**
 * Suy ra thông tin thiết bị (trình duyệt / hệ điều hành) từ chuỗi User-Agent.
 * Dùng để hiển thị cho người dùng biết phiên bị đăng nhập ở đâu.
 */
export function describeDevice(userAgent = "") {
  const ua = userAgent || "";

  let os = "Không rõ hệ điều hành";
  if (/Windows NT 10/.test(ua)) os = "Windows 10/11";
  else if (/Windows/.test(ua)) os = "Windows";
  else if (/iPhone|iPad|iPod/.test(ua)) os = "iOS";
  else if (/Android/.test(ua)) os = "Android";
  else if (/Mac OS X/.test(ua)) os = "macOS";
  else if (/Linux/.test(ua)) os = "Linux";

  let browser = "Trình duyệt không rõ";
  if (/Edg\//.test(ua)) browser = "Microsoft Edge";
  else if (/OPR\/|Opera/.test(ua)) browser = "Opera";
  else if (/Chrome\//.test(ua) && !/Edg\//.test(ua)) browser = "Chrome";
  else if (/Firefox\//.test(ua)) browser = "Firefox";
  else if (/Safari\//.test(ua) && !/Chrome\//.test(ua)) browser = "Safari";

  return { browser, os };
}
