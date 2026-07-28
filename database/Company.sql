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
