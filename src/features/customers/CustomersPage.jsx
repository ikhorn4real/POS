import { Clock3, Pencil, Plus, Search, Users } from "lucide-react";

export function CustomersPage({ customers, search, onSearchChange, onAdd, onEdit, onHistory }) {
  return (
    <>
      <section className="welcome-row">
        <div>
          <h1>Customers</h1>
          <p className="page-subtitle">Manage customer details and review purchase history.</p>
        </div>
        <button type="button" className="primary-button" onClick={onAdd}>
          <Plus size={17} /> Add Customer
        </button>
      </section>
      <section className="panel inventory-table-panel">
        <div className="table-heading">
          <div>
            <h2>Customer directory</h2>
            <p>{customers.length} {customers.length === 1 ? "customer" : "customers"}</p>
          </div>
          <label className="search-field inventory-search">
            <Search size={16} />
            <input value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search name, phone, email..." aria-label="Search customers" />
          </label>
        </div>
        <div className="table-scroll">
          <table>
            <thead><tr><th>CUSTOMER</th><th>PHONE</th><th>EMAIL</th><th>ACTIONS</th></tr></thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id}>
                  <td><strong>{customer.name}</strong></td>
                  <td>{customer.phone || "—"}</td>
                  <td>{customer.email || "—"}</td>
                  <td><div className="row-actions">
                    <button type="button" aria-label={`Edit ${customer.name}`} title="Edit customer" onClick={() => onEdit(customer)}><Pencil size={14} /></button>
                    <button type="button" aria-label={`View history for ${customer.name}`} title="View purchase history" onClick={() => onHistory(customer)}><Clock3 size={14} /></button>
                  </div></td>
                </tr>
              ))}
              {customers.length === 0 && <tr><td colSpan="4" className="table-empty"><Users size={18} /> No customers match this search.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
