-- Bảng SysRoles
DROP TABLE IF EXISTS `SysRoles`;
CREATE TABLE `SysRoles` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) NOT NULL,
  `Description` varchar(255) NULL,
  `IsActive` tinyint(1) NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
