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
