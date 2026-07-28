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
