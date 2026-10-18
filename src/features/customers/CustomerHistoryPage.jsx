import { ArrowLeft } from "lucide-react";

export function CustomerHistoryPage({ customer, sales, total, page, busy, formatMoney, onBack, onPageChange }) {
  const pageCount = Math.max(1, Math.ceil(total / 50));
  return (
    <>
      <section className="welcome-row">
        <div><p className="eyebrow">CUSTOMER PURCHASES</p><h1>{customer.name}</h1><p className="page-subtitle">{customer.email || customer.phone || "Purchase history"}</p></div>
        <button type="button" className="primary-button" onClick={onBack}><ArrowLeft size={15} /> Back to customers</button>
      </section>
      {busy ? <div className="panel report-loading">Loading customer history…</div> : (
        <section className="panel inventory-table-panel">
          <div className="table-heading"><div><h2>Purchase history</h2><p>{total} completed sales{total > sales.length ? ` · showing ${sales.length} on this page` : ""}</p></div></div>
          <div className="table-scroll">
            <table>
              <thead><tr><th>ORDER</th><th>DATE</th><th>ITEMS</th><th>PAYMENT</th><th>TOTAL</th></tr></thead>
              <tbody>{sales.map((sale) => <tr key={sale.id}>
                <td><strong className="order-id">{sale.id}</strong></td>
                <td>{new Intl.DateTimeFormat("en-GH", { dateStyle: "medium", timeStyle: "short" }).format(sale.date)}</td>
                <td>{sale.itemCount ?? sale.items}</td><td><span className="payment-tag">{sale.method}</span></td><td className="price-cell">{formatMoney(sale.total)}</td>
              </tr>)}
              {sales.length === 0 && <tr><td colSpan="5" className="table-empty">No purchases recorded for this customer.</td></tr>}</tbody>
            </table>
          </div>
          {sales.map((sale) => <div className="customer-history-items" key={`${sale.id}-items`}><strong>{sale.id}</strong>{sale.items?.map((item, index) => <span key={`${sale.id}-${index}`}>{item.productName ?? item.name} × {item.quantity} — {formatMoney(item.lineTotal ?? item.unitPrice * item.quantity)}</span>)}</div>)}
          <div className="sales-pagination">
            <span>{total === 0 ? "No purchases" : `${(page - 1) * 50 + 1}–${Math.min(page * 50, total)} of ${total}`}</span>
            <div><button type="button" disabled={busy || page <= 1} onClick={() => onPageChange(page - 1)}>Previous</button><span>Page {page} of {pageCount}</span><button type="button" disabled={busy || page >= pageCount} onClick={() => onPageChange(page + 1)}>Next</button></div>
          </div>
        </section>
      )}
    </>
  );
}
