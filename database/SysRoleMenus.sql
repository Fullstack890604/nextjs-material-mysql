-- Bảng SysRoleMenus
DROP TABLE IF EXISTS `SysRoleMenus`;
CREATE TABLE `SysRoleMenus` (
  `RoleId` int NOT NULL,
  `MenuId` int NOT NULL,
  `CanView` tinyint(1) NULL DEFAULT 1,
  `CanCreate` tinyint(1) NULL DEFAULT 0,
  `CanEdit` tinyint(1) NULL DEFAULT 0,
  `CanDelete` tinyint(1) NULL DEFAULT 0,
  `CanPrint` tinyint(1) NULL DEFAULT 0,
  `CanReport` tinyint(1) NULL DEFAULT 0,
  `CanImport` tinyint(1) NULL DEFAULT 0,
  `CanExport` tinyint(1) NULL DEFAULT 0,
  PRIMARY KEY (`RoleId`, `MenuId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Khóa ngoại (chạy sau khi đã tạo bảng được tham chiếu)
ALTER TABLE `SysRoleMenus` ADD CONSTRAINT `FK_SysRoleMenus_Menu` FOREIGN KEY (`MenuId`) REFERENCES `SysMenus` (`Id`) ON DELETE CASCADE;
ALTER TABLE `SysRoleMenus` ADD CONSTRAINT `FK_SysRoleMenus_Role` FOREIGN KEY (`RoleId`) REFERENCES `SysRoles` (`Id`) ON DELETE CASCADE;
