-- Bảng StatusGroup — loại trạng thái (đơn hàng, kho vận, thanh toán...).
-- Mỗi loại là một "không gian mã" riêng: mã trạng thái chỉ cần duy nhất trong loại.
DROP TABLE IF EXISTS `StatusGroup`;
CREATE TABLE `StatusGroup` (
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
  UNIQUE KEY `UQ_StatusGroup_Name` (`Name`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `StatusGroup` (`Code`,`Name`,`Description`,`SortOrder`,`IsActive`,`CreatedBy`) VALUES
  ('DONHANG',   'Trạng thái đơn hàng',   'Vòng đời của đơn hàng từ lúc tạo tới khi hoàn tất', 1, 1, 'system'),
  ('KHOVAN',    'Trạng thái kho vận',    'Trạng thái xuất nhập, tồn kho và vận chuyển',       2, 1, 'system'),
  ('THANHTOAN', 'Trạng thái thanh toán', 'Tình trạng thu tiền của chứng từ',                  3, 1, 'system'),
  ('CHUNG',     'Trạng thái chung',      'Dùng chung cho các đối tượng khác',                 4, 1, 'system');
