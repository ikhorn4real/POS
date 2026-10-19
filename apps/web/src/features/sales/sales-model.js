export function filterDemoSales(sales, { query = "", dateFrom = "", dateTo = "" } = {}) {
  const normalizedQuery = query.trim().toLowerCase();
  return sales.filter((sale) => {
    const searchText = [
      sale.id,
      sale.cashierName,
      sale.customerName ?? "Walk-in customer",
      sale.method,
      new Date(sale.date).toLocaleString(),
    ].join(" ").toLowerCase();
    const day = localDateKey(sale.date);
    return searchText.includes(normalizedQuery) &&
      (!dateFrom || day >= dateFrom) &&
      (!dateTo || day <= dateTo);
  });
}

function localDateKey(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function paginate(items, page, pageSize = 50) {
  const total = items.length;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  return {
    items: items.slice((safePage - 1) * pageSize, safePage * pageSize),
    total,
    page: safePage,
    pageCount,
  };
}
