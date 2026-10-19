import { Building2, Check, Pencil, Plus, X } from "lucide-react";

export function StoresPage({ stores, role, isDemo, storeLabel, onAdd, onEdit, onToggleStatus }) {
  const isOwner = role === "owner";
  return (
    <>
      <section className="welcome-row">
        <div><h1>Stores</h1><p className="page-subtitle">{isDemo ? "Connect a store account to add locations with separate inventory." : isOwner ? "Create and edit locations, then assign staff to each store." : "View all store locations. Only an administrator can add or edit stores."}</p></div>
        {isOwner && <button type="button" className="primary-button" disabled={isDemo} onClick={onAdd}><Plus size={17} /> Add branch</button>}
      </section>
      <section className="panel inventory-table-panel">
        <div className="table-heading"><div><h2>Stores</h2><p>{stores.length} location{stores.length === 1 ? "" : "s"} visible to your account</p></div></div>
        <div className="table-scroll">
          <table><thead><tr><th>STORE / BRAND</th><th>BRANCH &amp; LOCATION</th><th>CONTACT</th><th>ACCESS</th><th>STATUS</th>{isOwner && <th>ACTIONS</th>}</tr></thead>
            <tbody>{stores.map((store) => <tr key={store.id}>
              <td><strong>{store.name}</strong></td>
              <td><strong>{store.branch || "—"}</strong>{store.location && <small>{store.location}</small>}</td>
              <td>{store.phone && <small>{store.phone}</small>}{store.email && <small>{store.email}</small>}{!store.phone && !store.email && "—"}</td>
              <td>All stores</td>
              <td><span className={`status-pill ${store.active ? "status-ok" : "status-out"}`}><i />{store.active ? "Active" : "Inactive"}</span></td>
              {isOwner && <td><div className="row-actions">
                <button type="button" aria-label={`Edit ${storeLabel(store)}`} title="Edit branch" disabled={isDemo} onClick={() => onEdit(store)}><Pencil size={14} /></button>
                <button type="button" aria-label={`${store.active ? "Deactivate" : "Activate"} ${storeLabel(store)}`} title={store.active ? "Deactivate store" : "Activate store"} disabled={isDemo} onClick={() => onToggleStatus(store)}>{store.active ? <X size={14} /> : <Check size={14} />}</button>
              </div></td>}
            </tr>)}
              {stores.length === 0 && <tr><td colSpan={isOwner ? 6 : 5} className="table-empty"><Building2 size={18} /> No stores found.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
