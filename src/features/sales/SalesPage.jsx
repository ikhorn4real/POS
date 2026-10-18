import { Plus, Printer } from "lucide-react";
import { SalesTable } from "./SalesTable.jsx";

export function SalesPage({
  title,
  storeName,
  generatedAt,
  sales,
  total,
  page,
  pageCount,
  dateFrom,
  dateTo,
  search,
  busyId,
  todayRevenue,
  todaySaleCount,
  allSalesCount,
  isCashier,
  formatMoney,
  onPrintReport,
  onNewSale,
  onDateFromChange,
  onDateToChange,
  onClearDates,
  onSearchChange,
  onViewSale,
  onPrintSale,
  onPageChange,
}) {
  return (
    <>
      <section className="welcome-row">
        <div>
          <h1>{title}</h1>
          <p className="page-subtitle">A clear view of all completed orders.</p>
        </div>
        <div className="report-actions">
          <button className="secondary-button report-print-action" onClick={onPrintReport} disabled={sales.length === 0}>
            <Printer size={15} /> Print page / Save PDF
          </button>
          <button className="primary-button report-screen-action" onClick={onNewSale}>
            <Plus size={17} /> New Sale
          </button>
        </div>
      </section>
      <p className="report-print-meta">
        Store: {storeName} · Generated {generatedAt} · Showing {sales.length} of {total} matching transactions (page {page})
      </p>
      <section className="inventory-stats sales-metrics">
        <div><span>Revenue today</span><strong>{formatMoney(todayRevenue)}</strong><small>from {todaySaleCount} transactions</small></div>
        <div><span>Orders today</span><strong>{todaySaleCount}</strong><small>completed sales</small></div>
        <div><span>Average order</span><strong>{formatMoney(todaySaleCount ? todayRevenue / todaySaleCount : 0)}</strong><small>today’s average</small></div>
        <div><span>All transactions</span><strong>{allSalesCount}</strong><small>{isCashier ? "your transactions" : "recorded in the store"}</small></div>
      </section>
      <SalesTable
        sales={sales}
        total={total}
        page={page}
        pageCount={pageCount}
        dateFrom={dateFrom}
        dateTo={dateTo}
        search={search}
        busyId={busyId}
        formatMoney={formatMoney}
        onDateFromChange={onDateFromChange}
        onDateToChange={onDateToChange}
        onClearDates={onClearDates}
        onSearchChange={onSearchChange}
        onView={onViewSale}
        onPrint={onPrintSale}
        onPageChange={onPageChange}
      />
    </>
  );
}
