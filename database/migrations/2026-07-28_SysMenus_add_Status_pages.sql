/*
  Đăng ký 2 trang danh mục trạng thái vào SysMenus (nhóm "Danh mục hành chính",
  ParentId = 17) và cấp đủ quyền cho các nhóm quyền đang có bản ghi trong
  SysRoleMenus — nếu bỏ bước này, RouteGuard sẽ chặn cả 2 trang.

  Chạy lại được nhiều lần: các câu lệnh đều tự bỏ qua khi bản ghi đã tồn tại.
  npm run db:apply -- database/migrations/2026-07-28_SysMenus_add_Status_pages.sql
*/

-- 1. Thêm menu (chỉ thêm nếu chưa có Path tương ứng)
INSERT INTO `SysMenus` (`ParentId`, `Text`, `name`, `Path`, `Icon`, `IsActive`, `SortOrder`, `IconColor`)
SELECT 17, 'Danh sách trạng thái', '', '/settings/categories/statuses', '', 1, 10, ''
  FROM DUAL
 WHERE NOT EXISTS (
   SELECT 1 FROM (SELECT * FROM `SysMenus`) AS `m`
    WHERE `m`.`Path` = '/settings/categories/statuses'
 );

INSERT INTO `SysMenus` (`ParentId`, `Text`, `name`, `Path`, `Icon`, `IsActive`, `SortOrder`, `IconColor`)
SELECT 17, 'Loại trạng thái', '', '/settings/categories/status-groups', '', 1, 11, ''
  FROM DUAL
 WHERE NOT EXISTS (
   SELECT 1 FROM (SELECT * FROM `SysMenus`) AS `m`
    WHERE `m`.`Path` = '/settings/categories/status-groups'
 );

-- 2. Cấp toàn quyền 2 menu này cho mọi nhóm quyền đã được phân quyền menu.
--    (RoleId = 1 "Super" được full quyền ngầm nên không cần dòng nào.)
INSERT INTO `SysRoleMenus`
  (`RoleId`,`MenuId`,`CanView`,`CanCreate`,`CanEdit`,`CanDelete`,`CanPrint`,`CanReport`,`CanImport`,`CanExport`)
SELECT `r`.`RoleId`, `m`.`Id`, 1, 1, 1, 1, 1, 1, 1, 1
  FROM (SELECT DISTINCT `RoleId` FROM `SysRoleMenus`) AS `r`
 CROSS JOIN (
   SELECT `Id` FROM `SysMenus`
    WHERE `Path` IN ('/settings/categories/statuses', '/settings/categories/status-groups')
 ) AS `m`
 WHERE NOT EXISTS (
   SELECT 1 FROM (SELECT `RoleId`, `MenuId` FROM `SysRoleMenus`) AS `x`
    WHERE `x`.`RoleId` = `r`.`RoleId` AND `x`.`MenuId` = `m`.`Id`
 );

SELECT `Id`, `ParentId`, `Text`, `Path`, `SortOrder`
  FROM `SysMenus`
 WHERE `Path` IN ('/settings/categories/statuses', '/settings/categories/status-groups');
