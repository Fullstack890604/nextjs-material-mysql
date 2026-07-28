-- Bảng SysAccountRoles
DROP TABLE IF EXISTS `SysAccountRoles`;
CREATE TABLE `SysAccountRoles` (
  `AccountId` int NOT NULL,
  `RoleId` int NOT NULL,
  PRIMARY KEY (`AccountId`, `RoleId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
