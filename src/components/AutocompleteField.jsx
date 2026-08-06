"use client";

import { useState } from "react";
import {
  Autocomplete,
  Box,
  Checkbox,
  CircularProgress,
  InputAdornment,
  TextField,
  Typography,
  createFilterOptions,
} from "@mui/material";

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
 * Đại diện cho dòng "không chọn gì" khi dùng prop `emptyOption`. Là một object riêng
 * (so sánh bằng tham chiếu) nên không bao giờ đụng độ với dữ liệu thật, kể cả khi
 * `options` là mảng chuỗi.
 */
const EMPTY_OPTION = { __autocompleteFieldEmpty: true };
const isEmptyOption = (o) => o === EMPTY_OPTION;

const defaultFilterOptions = createFilterOptions();

/** Vòng tròn rỗng cho dòng "không chọn gì" — vẫn thẳng hàng với các chấm màu bên dưới. */
const HollowDot = () => (
  <Box
    component="span"
    sx={{
      width: 8,
      height: 8,
      borderRadius: "50%",
      border: 1,
      borderColor: "grey.500",
      flexShrink: 0,
    }}
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
 * @param {string|string[]} value     Mã / giá trị đang chọn (mảng mã khi `multiple`)
 * @param {Function} onChange         (value, option) => void — `multiple` thì nhận
 *   (mảng mã, mảng option)
 * @param {Array}    options          Danh sách dữ liệu (object hoặc chuỗi)
 * @param {string}   optionValue      Field làm giá trị (mặc định "code")
 * @param {string}   optionLabel      Field hiển thị (mặc định "name")
 * @param {string}   [optionCaption]  Field phụ hiển thị mờ bên phải (vd mã)
 * @param {string|Function} [optionDescription] Dòng phụ nhỏ **dưới nhãn** trong danh
 *   sách gợi ý (vd đơn giá dịch vụ, mô tả tài khoản) — tên field, hoặc hàm
 *   (option) => ReactNode. Trả về rỗng/`null` thì dòng đó không được vẽ. Chỉ hiện
 *   trong popup gợi ý, không ảnh hưởng chữ trong ô nhập.
 * @param {Function} [optionSx]       `sx` bổ sung cho từng dòng gợi ý, (option) => sx —
 *   dùng cho danh sách có cấu trúc riêng (vd thụt lề theo cấp trong cây menu).
 * @param {string[]} [searchFields]   Các field được dùng để lọc khi gõ tìm
 * @param {string|Function} [dotColor] Màu chấm — chuỗi, hoặc hàm (option) => màu
 * @param {boolean}  [multiple]       Chọn nhiều: `value` là mảng mã, mỗi dòng gợi ý
 *   có thêm `Checkbox` phía trước chấm màu.
 * @param {string}   [emptyOption]    Nhãn của một dòng cố định **luôn nằm đầu danh sách**,
 *   đại diện cho "không chọn gì" (vd "Tất cả loại", "— Không gán —") — thay cho
 *   `<MenuItem value="">` của `TextField select` ngày trước. Chọn dòng này thì `onChange`
 *   nhận chuỗi rỗng, y như khi bấm nút ✕. Dòng này không bị bộ lọc gõ tìm loại bỏ. Khi
 *   `value` rỗng thì ô coi như **đang chọn sẵn dòng này** — hiển thị đúng nhãn đó thay vì
 *   để trống, và ẩn nút ✕. Bỏ qua khi `multiple` (chọn nhiều thì "rỗng" = không tick gì).
 * @param {boolean}  [freeSolo]       Cho phép nhập giá trị ngoài danh sách
 * @param {boolean}  [showDotInInput] Hiện chấm màu của lựa chọn ngay trong ô nhập, thay
 *   cho `startIcon` — để màu vẫn còn thấy sau khi popup đóng lại. Tự bỏ qua khi
 *   `multiple` (đã có Chip) hoặc khi màu tính ra rỗng.
 * @param {boolean}  [showValueDot]   Bí danh của `showDotInInput` (đặt tên theo
 *   `DotAutocomplete`); truyền cái nào cũng được.
 * @param {boolean}  [loading]        Đang tải gợi ý (vd tìm kiếm server-side) — hiện thêm
 *   một vòng xoay nhỏ cuối ô nhập, ngoài việc chuyển tiếp `loading` cho Autocomplete.
 * @param {number|string} [popupMinWidth] Cho popup gợi ý rộng hơn ô nhập (mặc định MUI ép
 *   popup đúng bằng bề ngang input). Dùng khi ô nằm trong cột bảng hẹp mà nhãn lại dài —
 *   popup co giãn theo nội dung, rộng tối thiểu bằng giá trị này và tối đa 90vw.
 * @param {object}   [textFieldProps] Prop riêng của ô nhập mà component không nhận sẵn
 *   (vd `multiline`, `minRows`, `autoFocus`) — spread thẳng vào `TextField`. Đừng dùng cho
 *   `label`/`placeholder`/`error`/`helperText` (đã có prop riêng), cũng đừng ghi đè
 *   `slotProps` vì sẽ mất icon/vòng xoay.
 * @param {React.ReactNode} [startIcon] Icon đầu ô nhập
 */
export default function AutocompleteField({
  label,
  value,
  onChange,
  onInputChange,
  options = [],
  optionValue = "code",
  optionLabel = "name",
  optionCaption,
  optionDescription,
  optionSx,
  searchFields,
  dotColor = "primary.main",
  multiple = false,
  emptyOption,
  freeSolo = false,
  showDotInInput = false,
  showValueDot,
  loading = false,
  startIcon,
  required,
  error,
  helperText,
  disabled,
  disableClearable,
  placeholder,
  size,
  fullWidth = true,
  popupMinWidth,
  noOptionsText = "Không có dữ liệu",
  isOptionEqualToValue,
  filterOptions,
  slotProps,
  textFieldProps,
  ...rest
}) {
  // Hỗ trợ cả options dạng chuỗi ("Miền Bắc") lẫn dạng object ({ code, name })
  const valueOf = (option) =>
    option == null || isEmptyOption(option)
      ? ""
      : typeof option === "string"
        ? option
        : option[optionValue] ?? "";
  const labelOf = (option) =>
    option == null
      ? ""
      : isEmptyOption(option)
        ? emptyOption
        : typeof option === "string"
          ? option
          : option[optionLabel] ?? "";
  const captionOf = (option) =>
    optionCaption && option && !isEmptyOption(option) && typeof option !== "string"
      ? option[optionCaption]
      : null;
  const descriptionOf = (option) => {
    if (!optionDescription || option == null || isEmptyOption(option)) return null;
    if (typeof optionDescription === "function") return optionDescription(option);
    return typeof option === "string" ? null : option[optionDescription] ?? null;
  };

  const findOption = (val) =>
    options.find((o) => String(valueOf(o)) === String(val ?? "")) || null;

  // Dòng "không chọn gì" chỉ có nghĩa với ô chọn 1 giá trị.
  const hasEmptyOption = Boolean(emptyOption) && !multiple;
  const isBlank = value === null || value === undefined || value === "";

  // Chỉ ô freeSolo có dòng rỗng mới cần biết đang focus hay không — xem chỗ dựng
  // `inputValue` bên dưới.
  const [focused, setFocused] = useState(false);
  const tracksFocus = freeSolo && hasEmptyOption;

  const resolvedOptions = hasEmptyOption ? [EMPTY_OPTION, ...options] : options;

  const colorOf = (option) =>
    isEmptyOption(option)
      ? null
      : typeof dotColor === "function"
        ? dotColor(option)
        : dotColor;

  // Lọc theo nhiều field (vd tìm tỉnh/thành theo cả mã lẫn miền), thay vì chỉ theo nhãn
  const baseFilterOptions =
    filterOptions ||
    (searchFields &&
      ((opts, { inputValue }) => {
        const q = inputValue.trim().toLowerCase();
        if (!q) return opts;
        return opts.filter((o) =>
          searchFields.some((f) =>
            String((typeof o === "string" ? o : o?.[f]) ?? "").toLowerCase().includes(q)
          )
        );
      }));

  // Dòng rỗng phải luôn thấy được, kể cả khi đang gõ tìm — lọc trên danh sách thật rồi
  // ghép lại lên đầu.
  const resolvedFilterOptions = hasEmptyOption
    ? (opts, state) => [
        EMPTY_OPTION,
        ...(baseFilterOptions || defaultFilterOptions)(
          opts.filter((o) => !isEmptyOption(o)),
          // Sau khi chọn dòng rỗng, MUI để nguyên nhãn của nó trong input. Ô thường thì
          // MUI tự coi chữ đó là "chưa gõ gì" (nhãn trùng lựa chọn đang chọn), nhưng ô
          // `freeSolo` giữ giá trị là chuỗi rỗng nên không khớp — đem nhãn đi lọc thì
          // danh sách trống trơn, mở ra không còn gì để chọn lại. Coi như chưa gõ.
          state.inputValue === emptyOption ? { ...state, inputValue: "" } : state
        ),
      ]
    : baseFilterOptions;

  const filterProps = resolvedFilterOptions ? { filterOptions: resolvedFilterOptions } : {};

  // Chọn nhiều: value là mảng mã, trả ra cũng là mảng mã.
  // freeSolo: giá trị là chuỗi người dùng gõ, phát ra qua onInputChange.
  // Ngược lại: giá trị lấy từ option được chọn trong danh sách.
  let selected = null;
  let valueProps;
  if (multiple) {
    const codes = Array.isArray(value) ? value : value ? [value] : [];
    valueProps = {
      multiple: true,
      freeSolo: freeSolo || undefined,
      value: codes.map((v) => findOption(v) ?? v),
      onChange: (event, opts) => onChange?.(opts.map(valueOf), opts),
    };
  } else if (freeSolo) {
    valueProps = {
      freeSolo: true,
      value: value ?? "",
      // Ô freeSolo lấy chính chữ trong input làm giá trị, mà MUI thì đồng bộ nhãn của
      // lựa chọn đang chọn vào input — nên khi đứng ở dòng rỗng, nhãn ("— Chọn … —")
      // sẽ lọt ra ngoài thành dữ liệu thật. Chặn tại đây, trả về chuỗi rỗng.
      onInputChange: (event, val, reason) => {
        const text = hasEmptyOption && val === emptyOption ? "" : val;
        onChange?.(text);
        onInputChange?.(event, text, reason);
      },
      // Có dòng rỗng thì component nắm luôn chữ trong input: chưa chọn gì (và đang không
      // gõ) thì ô hiển thị đúng nhãn rỗng "— Chọn … —" y như ô chọn 1 giá trị, còn khi
      // đã có giá trị thì bám đúng giá trị. Lúc đang gõ thì thả ra để người dùng xoá /
      // sửa tự do, nếu không chữ vừa xoá hết sẽ bị nhãn rỗng nhảy vào chèn mất.
      ...(hasEmptyOption
        ? { inputValue: isBlank && !focused ? emptyOption : value ?? "" }
        : null),
    };
  } else {
    selected = findOption(value);
    valueProps = {
      value: hasEmptyOption && isBlank ? EMPTY_OPTION : selected,
      onChange: (event, option) =>
        isEmptyOption(option) ? onChange?.("", null) : onChange?.(valueOf(option), option),
      onInputChange,
    };
  }

  // Đang ở dòng rỗng thì nút ✕ không còn ý nghĩa (xoá về đúng chỗ đang đứng).
  const resolvedDisableClearable =
    hasEmptyOption && isBlank ? true : disableClearable;

  const wantValueDot = showValueDot ?? showDotInInput;
  const selectedDotColor = !multiple && selected ? colorOf(selected) : null;
  // Màu rỗng (vd giá trị freeSolo tự gõ, không có trong map màu) thì giữ icon.
  const inputIcon =
    wantValueDot && selectedDotColor ? <Dot color={selectedDotColor} /> : startIcon;

  // Mặc định MUI đặt style.width = bề ngang input lên popper. Ghi đè bằng "max-content"
  // + minWidth để popup tự nở theo nhãn dài, vẫn neo mép trái ô nhập.
  const resolvedSlotProps = popupMinWidth
    ? {
        ...slotProps,
        popper: {
          placement: "bottom-start",
          ...slotProps?.popper,
          style: {
            width: "max-content",
            minWidth: popupMinWidth,
            maxWidth: "90vw",
            ...slotProps?.popper?.style,
          },
        },
      }
    : slotProps;

  return (
    <Autocomplete
      options={resolvedOptions}
      disabled={disabled}
      disableClearable={resolvedDisableClearable}
      loading={loading}
      fullWidth={fullWidth}
      size={size}
      autoHighlight
      // Đang hiện nhãn dòng rỗng mà gõ thì chữ gõ vào thay luôn nhãn, không phải xoá tay.
      selectOnFocus={hasEmptyOption || undefined}
      noOptionsText={noOptionsText}
      clearText="Xóa"
      openText="Mở"
      closeText="Đóng"
      slotProps={resolvedSlotProps}
      getOptionLabel={(option) => String(labelOf(option))}
      isOptionEqualToValue={
        isOptionEqualToValue ||
        ((option, val) =>
          isEmptyOption(option) || isEmptyOption(val)
            ? option === val
            : valueOf(option) === valueOf(val))
      }
      renderOption={(props, option, state) => {
        const { key, ...liProps } = props;
        const empty = isEmptyOption(option);
        const caption = captionOf(option);
        const description = descriptionOf(option);
        return (
          <Box
            component="li"
            key={empty ? "__empty__" : valueOf(option) || key}
            {...liProps}
            sx={{
              display: "flex",
              // Có dòng phụ thì canh theo mép trên để chấm màu thẳng hàng với nhãn,
              // không bị trôi xuống giữa 2 dòng.
              alignItems: description ? "flex-start" : "center",
              gap: 1,
              // Dòng rỗng tách khỏi dữ liệu thật bằng một đường kẻ mảnh.
              ...(empty ? { borderBottom: 1, borderColor: "divider" } : null),
              ...(!empty && optionSx ? optionSx(option) : null),
            }}
          >
            {multiple && (
              <Checkbox size="small" checked={state?.selected || false} sx={{ p: 0.5, ml: -0.5 }} />
            )}
            <Box
              component="span"
              sx={{ display: "flex", alignItems: "center", height: description ? 20 : "auto" }}
            >
              {empty ? <HollowDot /> : <Dot color={colorOf(option)} />}
            </Box>
            <Box sx={{ flexGrow: 1, minWidth: 0 }}>
              <Box
                component="span"
                sx={{
                  display: "block",
                  color: empty ? "text.secondary" : undefined,
                  fontStyle: empty ? "italic" : undefined,
                }}
              >
                {labelOf(option)}
              </Box>
              {description ? (
                <Typography variant="caption" color="text.secondary" noWrap component="div">
                  {description}
                </Typography>
              ) : null}
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
          {...textFieldProps}
          {...(tracksFocus
            ? {
                onFocus: (event) => {
                  setFocused(true);
                  textFieldProps?.onFocus?.(event);
                },
                onBlur: (event) => {
                  setFocused(false);
                  textFieldProps?.onBlur?.(event);
                },
              }
            : null)}
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
              endAdornment: (
                <>
                  {loading ? <CircularProgress size={16} sx={{ mr: 1 }} /> : null}
                  {params.InputProps.endAdornment}
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
