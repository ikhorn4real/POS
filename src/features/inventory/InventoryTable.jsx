import { PackagePlus, Pencil, Search } from "lucide-react";
import { ProductArtwork } from "../../components/Common.jsx";

export function InventoryTable({
  products,
  filteredProducts,
  productsRef,
  lowStockOnly,
  onToggleLowStock,
  search,
  onSearchChange,
  canManageInventory,
  canManageCatalog,
  formatMoney,
  onEditProduct,
  onManageStock,
}) {
  return (
    <section
      ref={productsRef}
      id="inventory-products"
      className="panel inventory-table-panel"
      tabIndex={-1}
    >
      <div className="table-heading">
        <div>
          <h2>{lowStockOnly ? "Low-stock products" : "All products"}</h2>
          <p>
            {lowStockOnly
              ? `${filteredProducts.length} products need replenishment or are out of stock`
              : `${products.length} products in your catalog`}
          </p>
        </div>
        <div className="inventory-table-actions">
          <button
            type="button"
            className={`inventory-low-stock-toggle${lowStockOnly ? " is-active" : ""}`}
            aria-pressed={lowStockOnly}
            onClick={onToggleLowStock}
          >
            {lowStockOnly ? "Show all products" : "Low stock only"}
          </button>
          <label className="search-field inventory-search">
            <Search size={16} />
            <input
              value={search}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search name, SKU, supplier..."
              aria-label="Search inventory"
            />
          </label>
        </div>
      </div>
      <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th>PRODUCT</th>
              <th>SKU</th>
              <th>CATEGORY</th>
              <th>STOCK</th>
              <th>REORDER</th>
              <th>STATUS</th>
              <th>SELLING</th>
              {canManageInventory && <><th>COST</th><th>WHOLESALE</th><th>WHOLESALE QTY</th></>}
              <th>SUPPLIER</th>
              <th>EXPIRY</th>
              <th>DESCRIPTION</th>
              {canManageInventory && <th>ACTIONS</th>}
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr key={product.id} className={lowStockOnly ? "inventory-attention-row" : ""}>
                <td>
                  <div className="table-product">
                    <ProductArtwork product={product} compact />
                    <strong>{product.name}</strong>
                  </div>
                </td>
                <td className="sku-cell">{product.sku}</td>
                <td>{product.category}</td>
                <td>{product.stock} units</td>
                <td>{product.reorderLevel} units</td>
                <td>
                  <span className={`status-pill ${product.stock === 0 ? "status-out" : product.stock <= product.reorderLevel ? "status-low" : "status-ok"}`}>
                    <i />
                    {product.stock === 0 ? "Out of stock" : product.stock <= product.reorderLevel ? "Low stock" : "In stock"}
                  </span>
                </td>
                <td className="price-cell">{formatMoney(product.price)}</td>
                {canManageInventory && <>
                  <td>{formatMoney(product.costPrice)}</td>
                  <td>{formatMoney(product.wholesalePrice)}</td>
                  <td>{product.wholesaleQuantity > 0 ? `${product.wholesaleQuantity}+ units` : "Not set"}</td>
                </>}
                <td>{product.supplier || "—"}</td>
                <td>{product.expiryDate || "—"}</td>
                <td className="inventory-description-cell" title={product.productionDescription || ""}>
                  {product.productionDescription || "—"}
                </td>
                {canManageInventory && <td>
                  <div className="row-actions">
                    {canManageCatalog && <button aria-label={`Edit ${product.name}`} title="Edit Product" onClick={() => onEditProduct(product)}><Pencil size={14} /></button>}
                    <button aria-label={`Manage stock for ${product.name}`} title="Manage stock" onClick={() => onManageStock(product)}><PackagePlus size={15} /></button>
                  </div>
                </td>}
              </tr>
            ))}
            {filteredProducts.length === 0 && (
              <tr>
                <td colSpan={canManageInventory ? 14 : 10} className="table-empty">
                  {lowStockOnly
                    ? "No low-stock products match your search."
                    : "No products match your search."}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
