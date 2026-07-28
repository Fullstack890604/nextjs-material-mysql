-- Bảng SysMenus
DROP TABLE IF EXISTS `SysMenus`;
CREATE TABLE `SysMenus` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `ParentId` int NULL DEFAULT 0,
  `Text` varchar(150) NOT NULL,
  `name` varchar(250) NULL DEFAULT '',
  `Path` varchar(55) NULL DEFAULT '',
  `Icon` varchar(35) NULL DEFAULT '',
  `IsActive` tinyint(1) NULL DEFAULT 1,
  `SortOrder` int NULL DEFAULT 100,
  `IconColor` varchar(25) NOT NULL DEFAULT '#3b4a7d',
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
