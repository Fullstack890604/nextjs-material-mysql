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
