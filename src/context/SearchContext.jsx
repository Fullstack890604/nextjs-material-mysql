"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const SearchContext = createContext(null);

const DEFAULT_PLACEHOLDER = "Tìm kiếm...";

/**
 * Provider quản lý ô tìm kiếm dùng chung trên TopNav.
 * Đặt 1 lần ở layout admin, mọi trang chỉ cần gọi usePageSearch(placeholder).
 */
export function SearchProvider({ children }) {
  const [searchValue, setSearchValue] = useState("");
  const [placeholder, setPlaceholder] = useState(DEFAULT_PLACEHOLDER);

  const value = useMemo(
    () => ({ searchValue, setSearchValue, placeholder, setPlaceholder }),
    [searchValue, placeholder]
  );

  return (
    <SearchContext.Provider value={value}>{children}</SearchContext.Provider>
  );
}

export function useSearch() {
  const ctx = useContext(SearchContext);
  if (!ctx) {
    throw new Error("useSearch phải được dùng bên trong <SearchProvider>");
  }
  return ctx;
}

/**
 * Gắn ô tìm kiếm trên TopNav vào trang hiện tại: đặt placeholder khi mount,
 * xóa từ khóa khi rời trang (tránh giữ lại từ khóa của trang trước).
 * Trả về giá trị tìm kiếm hiện tại để trang tự lọc dữ liệu của mình.
 */
export function usePageSearch(placeholder = DEFAULT_PLACEHOLDER) {
  const { searchValue, setSearchValue, setPlaceholder } = useSearch();

  useEffect(() => {
    setPlaceholder(placeholder);
    setSearchValue("");
    return () => {
      setPlaceholder(DEFAULT_PLACEHOLDER);
      setSearchValue("");
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeholder]);

  return searchValue;
}
