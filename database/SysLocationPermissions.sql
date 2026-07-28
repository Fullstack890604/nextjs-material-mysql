-- Bảng SysLocationPermissions
DROP TABLE IF EXISTS `SysLocationPermissions`;
CREATE TABLE `SysLocationPermissions` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `AccountId` int NOT NULL,
  `ListCompany` varchar(1500) NOT NULL,
  `Locked` tinyint(1) NULL DEFAULT 0,
  `Notes` varchar(150) NULL,
  `CreatedBy` varchar(25) NULL DEFAULT 'admin',
  `CreatedDate` datetime NULL DEFAULT CURRENT_TIMESTAMP,
  `ModifiedBy` varchar(25) NULL,
  `ModifiedDate` datetime NULL,
  PRIMARY KEY (`AccountId`),
  UNIQUE KEY `UQ_SysLocationPermissions_Id` (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
