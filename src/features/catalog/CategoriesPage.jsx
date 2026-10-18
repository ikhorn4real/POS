import { Pencil, Plus, Tags } from "lucide-react";

export function CategoriesPage({ categories, products, canManageCatalog, onAdd, onEdit }) {
  return (
    <>
      <section className="welcome-row">
        <div><h1>Categories</h1><p className="page-subtitle">Manage the categories available for product classification.</p></div>
        {canManageCatalog && <button type="button" className="primary-button" onClick={onAdd}><Plus size={17} /> Add Category</button>}
      </section>
      <section className="panel inventory-table-panel">
        <div className="table-heading"><div><h2>Product categories</h2><p>{categories.length} categories available when adding products</p></div></div>
        <div className="table-scroll">
          <table><thead><tr><th>CATEGORY</th><th>PRODUCTS</th><th>ACTIONS</th></tr></thead>
            <tbody>{categories.map((item) => <tr key={item.id}>
              <td><strong>{item.name}</strong></td><td>{products.filter((product) => product.category === item.name).length}</td>
              <td><div className="row-actions">{canManageCatalog && <button type="button" aria-label={`Edit ${item.name}`} title="Edit category" onClick={() => onEdit(item)}><Pencil size={14} /></button>}</div></td>
            </tr>)}
              {categories.length === 0 && <tr><td colSpan="3" className="table-empty"><Tags size={18} /> No categories yet. Add one to use it on products.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
