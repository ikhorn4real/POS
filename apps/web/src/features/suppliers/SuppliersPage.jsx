import { Pencil, Plus, Truck } from "lucide-react";

export function SuppliersPage({ suppliers, canManageCatalog, onAdd, onEdit }) {
  return (
    <>
      <section className="welcome-row">
        <div><h1>Suppliers</h1><p className="page-subtitle">Keep supplier details here and assign them to products.</p></div>
        {canManageCatalog && <button type="button" className="primary-button" onClick={onAdd}><Plus size={17} /> Add Supplier</button>}
      </section>
      <section className="panel inventory-table-panel">
        <div className="table-heading"><div><h2>Supplier directory</h2><p>{suppliers.length} suppliers available for product selection</p></div></div>
        <div className="table-scroll">
          <table><thead><tr><th>SUPPLIER</th><th>CONTACT PERSON</th><th>EMAIL</th><th>PHONE</th><th>ACTIONS</th></tr></thead>
            <tbody>{suppliers.map((supplier) => <tr key={supplier.id}>
              <td><strong>{supplier.name}</strong></td><td>{supplier.contactName || "—"}</td><td>{supplier.email || "—"}</td><td>{supplier.phone || "—"}</td>
              <td><div className="row-actions">{canManageCatalog && <button type="button" aria-label={`Edit ${supplier.name}`} title="Edit supplier" onClick={() => onEdit(supplier)}><Pencil size={14} /></button>}</div></td>
            </tr>)}
              {suppliers.length === 0 && <tr><td colSpan="5" className="table-empty"><Truck size={18} /> No suppliers yet. Add one to assign it to products.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
