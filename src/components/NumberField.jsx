"use client";

import { TextField } from "@mui/material";
import { NumericFormat } from "react-number-format";

/**
 * Ô nhập số theo định dạng vi-VN (phân cách nghìn ".", thập phân ","), tối đa 2 chữ số
 * thập phân, không cho nhập số âm.
 * `onChange` nhận thẳng chuỗi giá trị thô (`values.value`) thay vì event — tiện set vào state form.
 * Các prop khác được truyền tiếp cho NumericFormat/TextField (autoFocus, slotProps, sx...).
 */
export default function NumberField({
  label,
  value,
  onChange,
  fixedDecimalScale = false,
  decimalScale = 2,
  error,
  helperText,
  required,
  ...rest
}) {
  return (
    <NumericFormat
      customInput={TextField}
      label={label}
      value={value}
      thousandSeparator="."
      decimalSeparator=","
      decimalScale={decimalScale}
      fixedDecimalScale={fixedDecimalScale}
      allowNegative={false}
      onValueChange={(values) => onChange(values.value)}
      inputMode="decimal"
      fullWidth
      required={required}
      error={error}
      helperText={helperText}
      {...rest}
    />
  );
}

/** Ô nhập số tiền (giá, giảm giá, đã thanh toán...) — không ép hiển thị đủ 2 số lẻ. */
export function MoneyField({ fixedDecimalScale, ...props }) {
  return <NumberField {...props} fixedDecimalScale={false} />;
}

/** Ô nhập số thập phân (số lượng, %, liều dùng...) — cho phép ép hiển thị đủ 2 số lẻ. */
export function DecimalField(props) {
  return <NumberField {...props} />;
}
