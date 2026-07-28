-- Bảng Status — danh mục trạng thái dùng chung cho nhiều nghiệp vụ.
-- Mỗi dòng thuộc về một loại (StatusGroup): đơn hàng, kho vận, thanh toán...
-- Id là khóa thay thế để route API gọn (/api/statuses/:id); ràng buộc thật nằm ở
-- UNIQUE(GroupCode, Code) — mã trạng thái chỉ cần duy nhất TRONG một loại, nên
-- cả đơn hàng lẫn kho vận đều có thể dùng mã 'MOI'.
DROP TABLE IF EXISTS `Status`;
CREATE TABLE `Status` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `GroupCode` varchar(25) NOT NULL,
  `Code` varchar(25) NOT NULL,
  `Name` varchar(100) NOT NULL,
  `Description` varchar(255) NULL,
  -- Màu hiển thị Chip: token của theme ('success.main') hoặc mã hex ('#2e7d32').
  `Color` varchar(25) NULL DEFAULT '',
  -- Đánh dấu trạng thái kết thúc quy trình (đã giao, đã hủy...) để báo cáo lọc nhanh.
  `IsFinal` tinyint(1) NULL DEFAULT 0,
  `SortOrder` int NULL DEFAULT 0,
  `IsActive` tinyint(1) NULL DEFAULT 1,
  `CreatedBy` varchar(25) NULL,
  `CreatedDate` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6),
  `ModifiedBy` varchar(25) NULL,
  `ModifiedDate` datetime(6) NULL,
  PRIMARY KEY (`Id`),
  UNIQUE KEY `UQ_Status_Group_Code` (`GroupCode`, `Code`),
  UNIQUE KEY `UQ_Status_Group_Name` (`GroupCode`, `Name`),
  KEY `IX_Status_GroupCode` (`GroupCode`, `SortOrder`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE `Status` ADD CONSTRAINT `FK_Status_StatusGroup`
  FOREIGN KEY (`GroupCode`) REFERENCES `StatusGroup` (`Code`);

INSERT INTO `Status` (`GroupCode`,`Code`,`Name`,`Description`,`Color`,`IsFinal`,`SortOrder`,`IsActive`,`CreatedBy`) VALUES
  ('DONHANG','MOI',      'Mới tạo',      'Đơn vừa được tạo, chờ xác nhận',      'info.main',      0, 1, 1, 'system'),
  ('DONHANG','XACNHAN',  'Đã xác nhận',  'Đơn đã được duyệt, chờ xử lý',        'primary.main',   0, 2, 1, 'system'),
  ('DONHANG','DANGGIAO', 'Đang giao',    'Đơn đang trên đường giao cho khách',  'warning.main',   0, 3, 1, 'system'),
  ('DONHANG','HOANTAT',  'Hoàn tất',     'Đơn đã giao và thu tiền xong',        'success.main',   1, 4, 1, 'system'),
  ('DONHANG','HUY',      'Đã hủy',       'Đơn bị hủy, không tiếp tục xử lý',    'error.main',     1, 5, 1, 'system'),

  ('KHOVAN','CHONHAP',   'Chờ nhập kho', 'Hàng đã về, chờ kiểm và nhập kho',    'info.main',      0, 1, 1, 'system'),
  ('KHOVAN','DANHAP',    'Đã nhập kho',  'Hàng đã nhập vào kho',                'success.main',   0, 2, 1, 'system'),
  ('KHOVAN','CHOXUAT',   'Chờ xuất kho', 'Đã có lệnh xuất, chờ soạn hàng',      'warning.main',   0, 3, 1, 'system'),
  ('KHOVAN','DAXUAT',    'Đã xuất kho',  'Hàng đã xuất khỏi kho',               'secondary.main', 1, 4, 1, 'system'),
  ('KHOVAN','TRAHANG',   'Trả hàng',     'Hàng bị trả lại kho',                 'error.main',     1, 5, 1, 'system'),

  ('THANHTOAN','CHUATT', 'Chưa thanh toán','Chưa thu được đồng nào',            'error.main',     0, 1, 1, 'system'),
  ('THANHTOAN','MOTPHAN','Thanh toán một phần','Đã thu một phần, còn công nợ',  'warning.main',   0, 2, 1, 'system'),
  ('THANHTOAN','DATT',   'Đã thanh toán','Đã thu đủ',                           'success.main',   1, 3, 1, 'system'),

  ('CHUNG','HOATDONG',   'Hoạt động',    'Đang sử dụng',                        'success.main',   0, 1, 1, 'system'),
  ('CHUNG','TAMNGUNG',   'Tạm ngưng',    'Ngưng sử dụng tạm thời',              'warning.main',   0, 2, 1, 'system'),
  ('CHUNG','NGUNG',      'Ngừng sử dụng','Không còn dùng nữa',                  'grey.600',       1, 3, 1, 'system');
