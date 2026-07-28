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
