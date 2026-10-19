import { ArrowUpRight } from "lucide-react";
import { ProductArtwork } from "./Common.jsx";
import "./Dashboard.css";

export function DashboardInventoryWatch({
  bestSellers,
  products,
  lowStock,
  recentSales,
  money,
  onNavigate,
}) {
  return (
    <section className="dashboard-watch-grid">
      <article className="panel quick-products">
        <div className="panel-heading">
          <div>
            <h2>Best-selling products</h2>
            <p>Top products by units sold over the last 7 days</p>
          </div>
          <button className="text-button" onClick={() => onNavigate("sales")}>
            View sales <ArrowUpRight size={14} />
          </button>
        </div>
        {bestSellers.length ? (
          <div className="best-seller-list">
            {bestSellers.map((item, index) => {
              const product = products.find(
                (entry) => entry.name === item.name,
              ) ?? {
                color: "#e8eaf0",
                initials: item.name.slice(0, 2).toUpperCase(),
              };
              return (
                <article className="best-seller-row" key={item.name}>
                  <span className="best-seller-rank">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <ProductArtwork product={product} compact />
                  <span className="best-seller-copy">
                    <strong>{item.name}</strong>
                    <span>{item.quantity} units sold</span>
                  </span>
                  <strong className="best-seller-revenue">
                    {money(item.revenue)}
                  </strong>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="insight-empty">
            Product rankings will appear after sales are recorded.
          </div>
        )}
      </article>

      <article className="panel expiry-panel dashboard-low-stock">
        <div className="panel-heading">
          <div>
            <h2>Low stock</h2>
            <p>{lowStock.length} items need attention</p>
          </div>
          <button className="text-button" onClick={() => onNavigate("inventory")}>
            Review <ArrowUpRight size={14} />
          </button>
        </div>
        {lowStock.length ? (
          <div className="expiry-watch-list">
            {lowStock.slice(0, 4).map((product) => <div className="expiry-watch-row" key={product.id}><span className="expiry-watch-copy"><strong>{product.name}</strong><span>{product.stock} left · reorder at {product.reorderLevel}</span></span><span className={`expiry-status ${product.stock === 0 ? "is-expired" : "is-soon"}`}>{product.stock === 0 ? "Out of stock" : "Low stock"}</span></div>)}
          </div>
        ) : (
          <div className="insight-empty">No low stock products.</div>
        )}
      </article>
      <article className="panel expiry-panel dashboard-activity">
        <div className="panel-heading"><div><h2>Recent activity</h2><p>Latest store transactions</p></div><button className="text-button" onClick={() => onNavigate("sales")}>View all <ArrowUpRight size={14} /></button></div>
        {recentSales.length ? <div className="expiry-watch-list">{recentSales.slice(0, 4).map((sale) => <div className="expiry-watch-row" key={sale.id}><span className="expiry-watch-copy"><strong>{sale.customerName ?? "Walk-in customer"}</strong><span>{sale.method} · {new Date(sale.date).toLocaleTimeString("en-GH", { hour: "2-digit", minute: "2-digit" })}</span></span><strong className="best-seller-revenue">{money(sale.total)}</strong></div>)}</div> : <div className="insight-empty">Recent activity will appear after sales are recorded.</div>}
      </article>
    </section>
  );
}
