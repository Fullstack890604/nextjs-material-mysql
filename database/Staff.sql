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
