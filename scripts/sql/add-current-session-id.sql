/*
  Cách 1 — Giới hạn mỗi tài khoản chỉ 1 phiên đăng nhập tại một thời điểm.
  Thêm cột lưu "phiên hiện hành" (session id) cho từng tài khoản.
  Máy nào đăng nhập sau sẽ ghi đè CurrentSessionId => phiên cũ bị vô hiệu.

  Chạy 1 lần trên database đang dùng.
*/

IF NOT EXISTS (
    SELECT 1
    FROM sys.columns
    WHERE object_id = OBJECT_ID(N'[dbo].[SysAccounts]')
      AND name = N'CurrentSessionId'
)
BEGIN
    ALTER TABLE [dbo].[SysAccounts]
        ADD [CurrentSessionId] NVARCHAR(64) NULL;
END
GO
