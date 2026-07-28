"use client";

import { Autocomplete, Box, InputAdornment, TextField, Typography } from "@mui/material";

/**
 * Chấm tròn màu đứng trước nhãn trong danh sách gợi ý.
 * Export sẵn để các trang tái sử dụng cho những chỗ cần chấm màu tương tự.
 */
export const Dot = ({ color = "primary.main" }) => (
  <Box
    component="span"
    sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: color, flexShrink: 0 }}
  />
);

/**
 * Ô chọn dữ liệu dạng danh sách (phòng ban, nhân viên, địa điểm, tỉnh/thành...) —
 * dùng Autocomplete để gõ tìm được, thay cho `TextField select`. Mỗi dòng trong
 * danh sách có một chấm tròn màu đứng trước nhãn.
 *
 * `options` nhận cả mảng object lẫn mảng chuỗi (khi đó chuỗi vừa là giá trị vừa
 * là nhãn). Giá trị vào/ra luôn là chuỗi — mã của object, hoặc chính chuỗi đó —
 * chứ không phải cả object, để khớp với `form.xxxCode` của các trang danh mục.
 * Xóa lựa chọn (nút X) trả về chuỗi rỗng.
 *
 * @param {string}   label            Nhãn ô nhập
 * @param {string}   value            Mã / giá trị đang chọn
 * @param {Function} onChange         (value, option) => void
 * @param {Array}    options          Danh sách dữ liệu (object hoặc chuỗi)
 * @param {string}   optionValue      Field làm giá trị (mặc định "code")
 * @param {string}   optionLabel      Field hiển thị (mặc định "name")
 * @param {string}   [optionCaption]  Field phụ hiển thị mờ bên phải (vd mã)
 * @param {string[]} [searchFields]   Các field được dùng để lọc khi gõ tìm
 * @param {string|Function} [dotColor] Màu chấm — chuỗi, hoặc hàm (option) => màu
 * @param {boolean}  [freeSolo]       Cho phép nhập giá trị ngoài danh sách
 * @param {boolean}  [showDotInInput] Hiện chấm màu của lựa chọn ngay trong ô nhập
 * @param {React.ReactNode} [startIcon] Icon đầu ô nhập
 */
export default function AutocompleteField({
  label,
  value,
  onChange,
  options = [],
  optionValue = "code",
  optionLabel = "name",
  optionCaption,
  searchFields,
  dotColor = "primary.main",
  freeSolo = false,
  showDotInInput = false,
  startIcon,
  required,
  error,
  helperText,
  disabled,
  placeholder,
  size,
  fullWidth = true,
  noOptionsText = "Không có dữ liệu",
  ...rest
}) {
  // Hỗ trợ cả options dạng chuỗi ("Miền Bắc") lẫn dạng object ({ code, name })
  const valueOf = (option) =>
    option == null ? "" : typeof option === "string" ? option : option[optionValue] ?? "";
  const labelOf = (option) =>
    option == null ? "" : typeof option === "string" ? option : option[optionLabel] ?? "";
  const captionOf = (option) =>
    optionCaption && option && typeof option !== "string" ? option[optionCaption] : null;

  const selected =
    options.find((o) => String(valueOf(o)) === String(value ?? "")) || null;

  const colorOf = (option) =>
    typeof dotColor === "function" ? dotColor(option) : dotColor;

  // Lọc theo nhiều field (vd tìm tỉnh/thành theo cả mã lẫn miền), thay vì chỉ theo nhãn
  const filterProps = searchFields
    ? {
        filterOptions: (opts, { inputValue }) => {
          const q = inputValue.trim().toLowerCase();
          if (!q) return opts;
          return opts.filter((o) =>
            searchFields.some((f) =>
              String((typeof o === "string" ? o : o?.[f]) ?? "").toLowerCase().includes(q)
            )
          );
        },
      }
    : {};

  // freeSolo: giá trị là chuỗi người dùng gõ, phát ra qua onInputChange.
  // Ngược lại: giá trị lấy từ option được chọn trong danh sách.
  const valueProps = freeSolo
    ? {
        freeSolo: true,
        value: value ?? "",
        onInputChange: (event, val) => onChange?.(val),
      }
    : {
        value: selected,
        onChange: (event, option) => onChange?.(valueOf(option), option),
      };

  const inputIcon =
    showDotInInput && selected ? <Dot color={colorOf(selected)} /> : startIcon;

  return (
    <Autocomplete
      options={options}
      disabled={disabled}
      fullWidth={fullWidth}
      size={size}
      autoHighlight
      noOptionsText={noOptionsText}
      clearText="Xóa"
      openText="Mở"
      closeText="Đóng"
      getOptionLabel={(option) => String(labelOf(option))}
      isOptionEqualToValue={(option, val) => valueOf(option) === valueOf(val)}
      renderOption={(props, option) => {
        const { key, ...liProps } = props;
        const caption = captionOf(option);
        return (
          <Box
            component="li"
            key={key}
            {...liProps}
            sx={{ display: "flex", alignItems: "center", gap: 1 }}
          >
            <Dot color={colorOf(option)} />
            <Box component="span" sx={{ flexGrow: 1, minWidth: 0 }}>
              {labelOf(option)}
            </Box>
            {caption && (
              <Typography variant="caption" color="text.secondary" noWrap>
                {caption}
              </Typography>
            )}
          </Box>
        );
      }}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          required={required}
          error={error}
          helperText={helperText}
          placeholder={placeholder}
          slotProps={{
            input: {
              ...params.InputProps,
              startAdornment: (
                <>
                  {inputIcon && <InputAdornment position="start">{inputIcon}</InputAdornment>}
                  {params.InputProps.startAdornment}
                </>
              ),
            },
          }}
        />
      )}
      {...filterProps}
      {...valueProps}
      {...rest}
    />
  );
}
