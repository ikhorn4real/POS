import { useEffect, useMemo, useState } from "react";
import { ArrowDownUp, Plus, Search, X } from "lucide-react";
import { ProductArtwork } from "../../components/Common.jsx";

export function CheckoutCatalog({
  products,
  productSearchTerm,
  productSearchRef,
  query,
  onQueryChange,
  onScanSku,
  checkoutLocked,
  onAddProduct,
  formatMoney,
}) {
  const [activeCategory, setActiveCategory] = useState("All items");
  const categories = useMemo(
    () => ["All items", ...new Set(products.map((product) => product.category).filter(Boolean).sort((a, b) => a.localeCompare(b)))],
    [products],
  );
  useEffect(() => {
    if (!categories.includes(activeCategory)) setActiveCategory("All items");
  }, [activeCategory, categories]);
  const filteredProducts = useMemo(() => {
    const normalizedQuery = productSearchTerm;
    return products.filter((product) => {
      const matchesCategory = activeCategory === "All items" || product.category === activeCategory;
      const matchesQuery = !normalizedQuery || `${product.name} ${product.sku}`.toLocaleLowerCase().includes(normalizedQuery);
      return matchesCategory && matchesQuery;
    });
  }, [activeCategory, productSearchTerm, products]);

  return (
    <section className="catalog-panel" aria-labelledby="catalog-heading">
      <div className="catalog-heading">
        <div>
          <p className="pos-section-kicker">PRODUCT CATALOG</p>
          <h2 id="catalog-heading">Find products</h2>
          <p>Search or browse available items</p>
        </div>
        <span className="catalog-result-count" aria-live="polite">
          {filteredProducts.length} {filteredProducts.length === 1 ? "item" : "items"}
        </span>
      </div>
      <div className="catalog-toolbar">
        <div className="catalog-search-control">
          <label className="search-field" htmlFor="checkout-product-search">
            <Search size={18} aria-hidden="true" />
            <input
              id="checkout-product-search"
              ref={productSearchRef}
              value={query}
              onChange={(event) => onQueryChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  onScanSku(query);
                }
              }}
              placeholder="Scan barcode or search by name or SKU"
              aria-label="Search products"
              aria-controls="checkout-product-results"
              autoComplete="off"
            />
            <kbd>Enter to add SKU</kbd>
          </label>
          {query && (
            <button
              type="button"
              className="search-clear"
              aria-label="Clear product search"
              onClick={() => onQueryChange("")}
            >
              <X size={15} />
            </button>
          )}
        </div>
      </div>
      <div className="catalog-category-row" role="group" aria-label="Filter products by category">
        <span className="catalog-category-label"><ArrowDownUp size={13} aria-hidden="true" /> Category</span>
        <div className="catalog-category-options">
          {categories.map((category) => (
            <button
              type="button"
              className={activeCategory === category ? "is-active" : ""}
              aria-pressed={activeCategory === category}
              key={category}
              onClick={() => setActiveCategory(category)}
            >
              {category}
            </button>
          ))}
        </div>
      </div>
      <div className="product-grid" id="checkout-product-results">
        {filteredProducts.map((product) => (
          <button
            className="catalog-product"
            key={product.id}
            disabled={checkoutLocked}
            onClick={() => onAddProduct(product)}
          >
            <ProductArtwork product={product} />
            <span className="catalog-product-info">
              <strong>{product.name}</strong>
              <span className="catalog-product-sku">SKU {product.sku}</span>
              <span className="catalog-price-row">
                <strong className="catalog-price">{formatMoney(product.price)}</strong>
                <span className="catalog-add-hint">Add item</span>
              </span>
            </span>
            <span className={`stock-count${product.stock <= product.reorderLevel ? " stock-count--low" : ""}`}>
              {product.stock} left
            </span>
            <span className="add-product-icon"><Plus size={15} /></span>
          </button>
        ))}
        {filteredProducts.length === 0 && (
          <div className="empty-state catalog-empty">
            <Search size={19} aria-hidden="true" />
            <strong>{productSearchTerm || activeCategory !== "All items" ? "No matching products" : "No products in stock"}</strong>
            <span>{productSearchTerm || activeCategory !== "All items" ? "Try another search or choose a different category." : "Restock products to make them available for checkout."}</span>
          </div>
        )}
      </div>
    </section>
  );
}
