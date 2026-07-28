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
