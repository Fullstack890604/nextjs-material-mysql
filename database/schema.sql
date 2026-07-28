-- Toàn bộ schema MySQL cho DB_UI.
-- Sinh lại được: chạy `npm run db:apply -- database/schema.sql`.

SET FOREIGN_KEY_CHECKS = 0;

-- Bảng Company
DROP TABLE IF EXISTS `Company`;
CREATE TABLE `Company` (
  `Code` varchar(25) NOT NULL,
  `Name` varchar(150) NOT NULL,
  `ShortName` varchar(50) NULL,
  `TaxCode` varchar(25) NULL,
  `Address` varchar(255) NULL,
  `Phone` varchar(20) NULL,
  `Email` varchar(100) NULL,
  `Website` varchar(100) NULL,
  `Representative` varchar(100) NULL,
  `Note` varchar(255) NULL,
  `SortOrder` int NULL DEFAULT 0,
  `IsActive` tinyint(1) NULL DEFAULT 1,
  `CreatedBy` varchar(25) NULL,
  `CreatedDate` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
  `ModifiedBy` varchar(25) NULL,
  `ModifiedDate` datetime(6) NULL,
  PRIMARY KEY (`Code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Department
DROP TABLE IF EXISTS `Department`;
CREATE TABLE `Department` (
  `Code` varchar(25) NOT NULL,
  `Name` varchar(100) NOT NULL,
  `Description` varchar(255) NULL,
  `LocationCode` varchar(10) NULL,
  `ManagerCode` varchar(25) NULL,
  `Phone` varchar(20) NULL,
  `Email` varchar(100) NULL,
  `HeadCount` int NULL DEFAULT 0,
  `SortOrder` int NULL DEFAULT 0,
  `IsActive` tinyint(1) NULL DEFAULT 1,
  `CreatedBy` varchar(25) NULL,
  `CreatedDate` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
  `ModifiedBy` varchar(25) NULL,
  `ModifiedDate` datetime(6) NULL,
  PRIMARY KEY (`Code`),
  UNIQUE KEY `UQ_Department_Name` (`Name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Locations
DROP TABLE IF EXISTS `Locations`;
CREATE TABLE `Locations` (
  `LocationCode` varchar(10) NOT NULL,
  `LocationName` varchar(125) NOT NULL,
  `Region` varchar(20) NULL,
  `Address` varchar(150) NULL,
  `City` varchar(30) NULL,
  `Country` varchar(30) NULL,
  `Brand` varchar(10) NULL DEFAULT '',
  `IsActive` tinyint(1) NOT NULL,
  `CreatedBy` varchar(25) NULL,
  `CreatedAt` datetime NULL,
  `UpdatedBy` varchar(25) NULL,
  `UpdatedAt` datetime NULL,
  `SortOrder` int NOT NULL DEFAULT 0,
  PRIMARY KEY (`LocationCode`),
  KEY `IX_Locations_SortOrder` (`SortOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng PaymentMethod
DROP TABLE IF EXISTS `PaymentMethod`;
CREATE TABLE `PaymentMethod` (
  `Code` varchar(25) NOT NULL,
  `Name` varchar(100) NOT NULL,
  `Description` varchar(255) NULL,
  `SortOrder` int NULL DEFAULT 0,
  `IsActive` tinyint(1) NULL DEFAULT 1,
  `CreatedBy` varchar(25) NULL,
  `CreatedDate` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
  `ModifiedBy` varchar(25) NULL,
  `ModifiedDate` datetime(6) NULL,
  PRIMARY KEY (`Code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Position
DROP TABLE IF EXISTS `Position`;
CREATE TABLE `Position` (
  `Code` varchar(25) NOT NULL,
  `Name` varchar(100) NOT NULL,
  `Description` varchar(255) NULL,
  `SortOrder` int NULL DEFAULT 0,
  `IsActive` tinyint(1) NULL DEFAULT 1,
  `CreatedBy` varchar(25) NULL,
  `CreatedDate` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
  `ModifiedBy` varchar(25) NULL,
  `ModifiedDate` datetime(6) NULL,
  PRIMARY KEY (`Code`),
  UNIQUE KEY `UX_Position_Name` (`Name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Province
DROP TABLE IF EXISTS `Province`;
CREATE TABLE `Province` (
  `Code` varchar(10) NOT NULL,
  `Name` varchar(100) NOT NULL,
  `Region` varchar(50) NULL,
  `SortOrder` int NULL DEFAULT 0,
  `IsActive` tinyint(1) NULL DEFAULT 1,
  `CreatedBy` varchar(25) NULL,
  `CreatedDate` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
  `ModifiedBy` varchar(25) NULL,
  `ModifiedDate` datetime(6) NULL,
  PRIMARY KEY (`Code`),
  UNIQUE KEY `UX_Province_Name` (`Name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Staff
DROP TABLE IF EXISTS `Staff`;
CREATE TABLE `Staff` (
  `Code` varchar(25) NOT NULL,
  `FullName` varchar(100) NOT NULL,
  `Position` varchar(50) NULL,
  `Gender` varchar(10) NULL,
  `DateOfBirth` date NULL,
  `Phone` varchar(20) NULL,
  `Email` varchar(100) NULL,
  `StoreCode` varchar(25) NULL,
  `Note` varchar(255) NULL,
  `SortOrder` int NULL DEFAULT 0,
  `IsActive` tinyint(1) NULL DEFAULT 1,
  `CreatedBy` varchar(25) NULL,
  `CreatedDate` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
  `ModifiedBy` varchar(25) NULL,
  `ModifiedDate` datetime(6) NULL,
  `DepartmentCode` varchar(25) NULL,
  `TeamCode` varchar(25) NULL,
  PRIMARY KEY (`Code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Khóa ngoại (chạy sau khi đã tạo bảng được tham chiếu)
ALTER TABLE `Staff` ADD CONSTRAINT `FK_Staff_Department` FOREIGN KEY (`DepartmentCode`) REFERENCES `Department` (`Code`);
ALTER TABLE `Staff` ADD CONSTRAINT `FK_Staff_Team` FOREIGN KEY (`TeamCode`) REFERENCES `Team` (`Code`);

-- Bảng SysAccountRoles
DROP TABLE IF EXISTS `SysAccountRoles`;
CREATE TABLE `SysAccountRoles` (
  `AccountId` int NOT NULL,
  `RoleId` int NOT NULL,
  PRIMARY KEY (`AccountId`, `RoleId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng SysAccounts
DROP TABLE IF EXISTS `SysAccounts`;
CREATE TABLE `SysAccounts` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `UserName` varchar(50) NOT NULL,
  `Password` varchar(65) NULL,
  `Description` varchar(85) NULL,
  `EmployeeCode` varchar(25) NULL,
  `StoreCode` varchar(25) NULL,
  `CompanyCode` varchar(250) NULL,
  `IsAdmin` tinyint(1) NULL,
  `Locked` tinyint(1) NULL,
  `Notes` varchar(150) NULL,
  `Status` varchar(20) NULL,
  `DefaultPage` varchar(40) NULL,
  `CreatedBy` varchar(25) NULL,
  `CreatedDate` datetime(6) NULL,
  `ModifiedBy` varchar(25) NULL,
  `ModifiedDate` datetime(6) NULL,
  `CurrentSessionId` varchar(64) NULL,
  PRIMARY KEY (`UserName`),
  UNIQUE KEY `UQ_SysAccounts_Id` (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- Bảng SysLogs
DROP TABLE IF EXISTS `SysLogs`;
CREATE TABLE `SysLogs` (
  `Id` bigint NOT NULL AUTO_INCREMENT,
  `CreatedAt` datetime NOT NULL DEFAULT (UTC_TIMESTAMP()),
  `RequestId` varchar(50) NULL,
  `Method` varchar(10) NULL,
  `Url` varchar(500) NULL,
  `StatusCode` smallint NULL,
  `ResponseTime` int NULL,
  `Headers` varchar(2500) NULL,
  `Body` varchar(2000) NULL,
  `Response` longtext NULL,
  `Error` longtext NULL,
  `UserAgent` varchar(255) NULL,
  `IpAddress` varchar(45) NULL,
  `ForwardedFor` varchar(100) NULL,
  `Origin` varchar(100) NULL,
  `UserId` int NULL,
  `Level` tinyint(4) NOT NULL DEFAULT 3,
  `Message` varchar(200) NULL,
  `CreatedBy` varchar(20) NULL,
  PRIMARY KEY (`Id`, `CreatedAt`),
  KEY `CIX_SysLogs_CreatedAt` (`CreatedAt`, `Id`),
  KEY `IX_SysLogs_Errors` (`CreatedAt`),
  KEY `IX_SysLogs_IpAddress_CreatedAt` (`IpAddress`, `CreatedAt`),
  KEY `IX_SysLogs_RequestId` (`CreatedAt`, `RequestId`),
  KEY `IX_SysLogs_StatusCode_CreatedAt` (`StatusCode`, `CreatedAt`),
  KEY `IX_SysLogs_UserId_CreatedAt` (`UserId`, `CreatedAt`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

-- Bảng SysRoles
DROP TABLE IF EXISTS `SysRoles`;
CREATE TABLE `SysRoles` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Name` varchar(100) NOT NULL,
  `Description` varchar(255) NULL,
  `IsActive` tinyint(1) NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng SysSoftwareUpdateLog
DROP TABLE IF EXISTS `SysSoftwareUpdateLog`;
CREATE TABLE `SysSoftwareUpdateLog` (
  `UpdateID` bigint NOT NULL AUTO_INCREMENT,
  `SoftwareName` varchar(200) NOT NULL,
  `SoftwareCode` varchar(50) NULL,
  `Module` varchar(200) NULL,
  `OldVersion` varchar(50) NULL,
  `NewVersion` varchar(50) NOT NULL,
  `UpdateType` varchar(30) NOT NULL DEFAULT 'Patch',
  `Description` varchar(1000) NULL,
  `ReleaseNotes` longtext NULL,
  `Environment` varchar(20) NOT NULL DEFAULT 'PROD',
  `ServerName` varchar(100) NULL,
  `Status` varchar(20) NOT NULL DEFAULT 'Success',
  `ErrorMessage` longtext NULL,
  `UpdatedBy` varchar(100) NOT NULL DEFAULT (CURRENT_USER()),
  `UpdateStartTime` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UpdateEndTime` datetime NULL,
  `DurationSeconds` int GENERATED ALWAYS AS (TIMESTAMPDIFF(SECOND, `UpdateStartTime`, `UpdateEndTime`)) VIRTUAL,
  `CreatedAt` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`UpdateID`),
  KEY `IX_SoftwareUpdateLog_CreatedAt` (`CreatedAt`),
  KEY `IX_SoftwareUpdateLog_Software` (`SoftwareName`, `NewVersion`),
  KEY `IX_SoftwareUpdateLog_Status` (`Status`, `Environment`),
  CONSTRAINT `CK_SoftwareUpdateLog_UpdateType` CHECK (`UpdateType` IN ('Rollback', 'Hotfix', 'Patch', 'Minor', 'Major')),
  CONSTRAINT `CK_SoftwareUpdateLog_Status` CHECK (`Status` IN ('InProgress', 'Rollback', 'Failed', 'Success')),
  CONSTRAINT `CK_SoftwareUpdateLog_Environment` CHECK (`Environment` IN ('PROD', 'UAT', 'TEST', 'DEV'))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Team
DROP TABLE IF EXISTS `Team`;
CREATE TABLE `Team` (
  `Code` varchar(25) NOT NULL,
  `Name` varchar(100) NOT NULL,
  `DepartmentCode` varchar(25) NOT NULL,
  `Description` varchar(255) NULL,
  `LeaderCode` varchar(25) NULL,
  `HeadCount` int NULL DEFAULT 0,
  `SortOrder` int NULL DEFAULT 0,
  `IsActive` tinyint(1) NULL DEFAULT 1,
  `CreatedBy` varchar(25) NULL,
  `CreatedDate` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
  `ModifiedBy` varchar(25) NULL,
  `ModifiedDate` datetime(6) NULL,
  PRIMARY KEY (`Code`),
  UNIQUE KEY `UQ_Team_Department_Name` (`DepartmentCode`, `Name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Khóa ngoại (chạy sau khi đã tạo bảng được tham chiếu)
ALTER TABLE `Team` ADD CONSTRAINT `FK_Team_Department` FOREIGN KEY (`DepartmentCode`) REFERENCES `Department` (`Code`);

-- Bảng Unit
DROP TABLE IF EXISTS `Unit`;
CREATE TABLE `Unit` (
  `Code` varchar(25) NOT NULL,
  `Name` varchar(100) NOT NULL,
  `Description` varchar(255) NULL,
  `SortOrder` int NULL DEFAULT 0,
  `IsActive` tinyint(1) NULL DEFAULT 1,
  `CreatedBy` varchar(25) NULL,
  `CreatedDate` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
  `ModifiedBy` varchar(25) NULL,
  `ModifiedDate` datetime(6) NULL,
  PRIMARY KEY (`Code`),
  UNIQUE KEY `UX_Unit_Name` (`Name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Bảng Ward
DROP TABLE IF EXISTS `Ward`;
CREATE TABLE `Ward` (
  `Code` varchar(25) NOT NULL,
  `Name` varchar(100) NOT NULL,
  `ProvinceCode` varchar(10) NULL,
  `District` varchar(100) NULL,
  `SortOrder` int NULL DEFAULT 0,
  `IsActive` tinyint(1) NULL DEFAULT 1,
  `CreatedBy` varchar(25) NULL,
  `CreatedDate` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
  `ModifiedBy` varchar(25) NULL,
  `ModifiedDate` datetime(6) NULL,
  PRIMARY KEY (`Code`),
  KEY `IX_Ward_ProvinceCode` (`ProvinceCode`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;