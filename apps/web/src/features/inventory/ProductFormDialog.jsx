import { Check, Plus, X } from "lucide-react";
import { AccessibleDialog } from "../../components/Common.jsx";

export function ProductFormDialog({
  product, categories, suppliers, stores, activeStoreId, storeLabel,
  onDismiss, onSubmit, onAddCategory, onAddSupplier,
}) {
  const isEditing = Boolean(product);
  return (
    <AccessibleDialog className="modal-backdrop" labelledBy="product-dialog-heading" onDismiss={onDismiss}>
      <form className="product-modal product-modal--wide" key={product?.id ?? "new-product"} onSubmit={onSubmit}>
        <div className="modal-heading"><div><h2 id="product-dialog-heading">{isEditing ? "Edit product" : "Add a Product"}</h2></div><button className="icon-button" type="button" aria-label="Close dialog" onClick={onDismiss}><X size={18} /></button></div>
        <div className="product-form-grid">
          <label>Product Name<input name="name" required maxLength="120" placeholder="e.g. Canvas tote bag" defaultValue={product?.name ?? ""} /></label>
          {isEditing && <label>SKU<input name="sku" required maxLength="64" pattern="[A-Za-z0-9][A-Za-z0-9._/\x2d]{0,63}" title="Use letters, numbers, dots, dashes, underscores, or slashes." defaultValue={product.sku} /></label>}
          <label>Description<input name="productionDescription" maxLength="2000" placeholder="Add a product description" defaultValue={product?.productionDescription ?? ""} /></label>
          <div className="product-supplier-field"><label htmlFor="product-category">Category</label><select id="product-category" name="category" required defaultValue={product?.category ?? ""}><option value="" disabled>Select a Category</option>{categories.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}</select><button type="button" className="supplier-add-link" onClick={onAddCategory}><Plus size={13} /> Add Category</button></div>
          <div className="product-supplier-field"><label htmlFor="product-supplier">Supplier</label><select id="product-supplier" name="supplierId" defaultValue={product?.supplierId ?? ""}><option value="">No Supplier</option>{suppliers.map((supplier) => <option key={supplier.id} value={supplier.id}>{supplier.name}</option>)}</select><button type="button" className="supplier-add-link" onClick={onAddSupplier}><Plus size={13} /> Add Supplier</button></div>
          {!isEditing && <div className="product-supplier-field"><label htmlFor="product-opening-stock">Opening Stock</label><input id="product-opening-stock" name="stock" type="number" min="0" max="1000000" step="1" required placeholder="0" defaultValue="0" /></div>}
          <label>Reorder Level<input name="reorderLevel" type="number" min="0" max="1000000" step="1" required defaultValue={product?.reorderLevel ?? 5} /></label>
          <label>Selling Price (GHS)<input name="price" type="number" min="0.01" max="1000000" step="0.01" required placeholder="0.00" defaultValue={product?.price ?? ""} /></label>
          <div className="product-supplier-field"><label htmlFor="product-cost-price">Cost Price (GHS)</label><input id="product-cost-price" name="costPrice" type="number" min="0" max="1000000" step="0.01" required placeholder="0.00" defaultValue={product?.costPrice ?? ""} /></div>
          <label>Wholesale Price (GHS)<input name="wholesalePrice" type="number" min="0" max="1000000" step="0.01" required placeholder="0.00" defaultValue={product?.wholesalePrice ?? ""} /></label>
          <label>Wholesale Quantity<input name="wholesaleQuantity" type="number" min="0" max="1000000" step="1" defaultValue={product?.wholesaleQuantity ?? 0} /></label>
          <label>Manufacturing Date<input name="mftDate" type="date" defaultValue={product?.mftDate ?? ""} /></label>
          <label>Expiry Date<input name="expiryDate" type="date" defaultValue={product?.expiryDate ?? ""} /></label>
        </div>
        {!isEditing && <div className="product-supplier-field"><label htmlFor="product-store">Store</label><select id="product-store" name="storeId" required defaultValue={activeStoreId}>{stores.map((store) => <option key={store.id} value={store.id}>{storeLabel(store)}</option>)}</select></div>}
        <div className="modal-actions"><button type="button" className="secondary-button" onClick={onDismiss}>Cancel</button><button type="submit" className="primary-button">{isEditing ? <Check size={16} /> : <Plus size={16} />}{isEditing ? "Save Changes" : "Add Product"}</button></div>
      </form>
    </AccessibleDialog>
  );
}
