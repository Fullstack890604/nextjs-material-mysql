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
