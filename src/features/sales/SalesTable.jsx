import { Check, FileText, Printer, Search } from "lucide-react";

export function SalesTable({
  sales,
  total,
  page,
  pageCount,
  dateFrom,
  dateTo,
  search,
  busyId,
  formatMoney,
  onDateFromChange,
  onDateToChange,
  onClearDates,
  onSearchChange,
  onView,
  onPrint,
  onPageChange,
}) {
  return (
    <section className="panel inventory-table-panel sales-report-panel">
      <div className="table-heading">
        <div>
          <h2>All transactions</h2>
          <p>Filter sales by date or search transactions</p>
        </div>
        <div className="sales-report-filters">
          <label className="sales-date-filter">
            <span>From</span>
            <input type="date" value={dateFrom} max={dateTo || undefined} onChange={(event) => onDateFromChange(event.target.value)} aria-label="From date" />
          </label>
          <label className="sales-date-filter">
            <span>To</span>
            <input type="date" value={dateTo} min={dateFrom || undefined} onChange={(event) => onDateToChange(event.target.value)} aria-label="To date" />
          </label>
          {(dateFrom || dateTo) && (
            <button type="button" className="sales-date-clear" onClick={onClearDates}>Clear dates</button>
          )}
          <label className="search-field inventory-search transaction-search">
            <Search size={16} />
            <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search order, staff, customer, payment..." aria-label="Search transactions" />
          </label>
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr><th>ORDER</th><th>TIME</th><th>STAFF</th><th>CUSTOMER</th><th>ITEMS</th><th>PAYMENT</th><th>STATUS</th><th>TOTAL</th><th>ACTIONS</th></tr>
          </thead>
          <tbody>
            {sales.map((sale) => (
              <tr key={sale.id}>
                <td><strong className="order-id">{sale.id}</strong></td>
                <td>{new Intl.DateTimeFormat("en-GH", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(sale.date)}</td>
                <td>{sale.cashierName ?? "—"}</td>
                <td>{sale.customerName ?? "Walk-in customer"}</td>
                <td>{sale.items} {sale.items === 1 ? "item" : "items"}</td>
                <td><span className="payment-tag">{sale.method}</span></td>
                <td><span className="status-pill status-ok"><i /><Check size={12} /> Paid</span></td>
                <td className="price-cell">{formatMoney(sale.total)}</td>
                <td><div className="row-actions">
                  <button aria-label={`View transaction ${sale.id}`} title="View transaction" disabled={busyId === sale.id} onClick={() => onView(sale)}><FileText size={14} /></button>
                  <button aria-label={`Reprint receipt ${sale.id}`} title="Reprint receipt" disabled={busyId === sale.id} onClick={() => onPrint(sale)}><Printer size={14} /></button>
                </div></td>
              </tr>
            ))}
            {sales.length === 0 && <tr><td colSpan="9" className="table-empty">{total === 0 ? "No sales have been recorded yet." : "No transactions match your search."}</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="sales-pagination">
        <span>{total === 0 ? "No transactions" : `${(page - 1) * 50 + 1}–${Math.min(page * 50, total)} of ${total}`}</span>
        <div>
          <button type="button" disabled={page <= 1} onClick={() => onPageChange(page - 1)}>Previous</button>
          <span>Page {page} of {pageCount}</span>
          <button type="button" disabled={page >= pageCount} onClick={() => onPageChange(page + 1)}>Next</button>
        </div>
      </div>
    </section>
  );
}
