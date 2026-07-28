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
