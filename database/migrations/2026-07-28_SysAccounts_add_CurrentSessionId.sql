/*
  Cách 1 — Giới hạn mỗi tài khoản chỉ 1 phiên đăng nhập tại một thời điểm.
  Thêm cột lưu "phiên hiện hành" (session id) cho từng tài khoản.
  Máy nào đăng nhập sau sẽ ghi đè CurrentSessionId => phiên cũ bị vô hiệu.

  Chạy được nhiều lần: npm run db:apply -- database/migrations/2026-07-28_SysAccounts_add_CurrentSessionId.sql

  Ghi chú: cột này đã có sẵn trong database/SysAccounts.sql. File migration giữ
  lại để áp dụng cho những môi trường tạo từ schema cũ hơn.
*/

SET @stmt := (
  SELECT IF(
    EXISTS(
      SELECT 1 FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME   = 'SysAccounts'
         AND COLUMN_NAME  = 'CurrentSessionId'
    ),
    'SELECT ''Cột CurrentSessionId đã tồn tại, bỏ qua.'' AS Ghi_chu',
    'ALTER TABLE `SysAccounts` ADD COLUMN `CurrentSessionId` varchar(64) NULL'
  )
);
PREPARE s FROM @stmt;
EXECUTE s;
DEALLOCATE PREPARE s;
