import { Check, KeyRound, Pencil, Plus, Users, X } from "lucide-react";

export function TeamPage({ members, role, busyId, storeLabel, onAdd, onEdit, onResetPassword, onToggleStatus }) {
  return (
    <>
      <section className="welcome-row">
        <div><h1>Team</h1><p className="page-subtitle">Manage staff accounts and their store roles.</p></div>
        <button type="button" className="primary-button" onClick={onAdd}><Plus size={17} /> Add team member</button>
      </section>
      <section className="panel inventory-table-panel">
        <div className="table-heading"><div><h2>Team members</h2><p>{role === "manager" ? "Manage team members assigned to your store." : "Manage managers and cashiers across stores."}</p></div></div>
        <div className="table-scroll">
          <table><thead><tr><th>NAME</th><th>EMAIL</th><th>ROLE</th><th>STORES</th><th>STATUS</th><th>ACTIONS</th></tr></thead>
            <tbody>{members.map((member) => <tr key={member.id}>
              <td><div className="team-person"><div className="profile-avatar">{member.name.split(/\s+/).map((part) => part[0]).slice(0, 2).join("").toUpperCase()}</div><strong>{member.name}</strong></div></td>
              <td>{member.email}</td>
              <td><span className="role-pill">{member.role === "owner" ? "Administrator" : member.role}</span></td>
              <td>{(member.stores ?? []).map(storeLabel).filter(Boolean).join(", ") || "—"}</td>
              <td><span className={`status-pill ${member.active ? "status-ok" : "status-out"}`}><i />{member.active ? "Active" : "Inactive"}</span></td>
              <td>{member.role === "cashier" || ((role === "owner" || role === "manager") && member.role === "manager") ? (
                <div className="row-actions">
                  <button type="button" aria-label={`Edit ${member.name}`} title={`Edit ${member.role}`} onClick={() => onEdit(member)}><Pencil size={14} /></button>
                  <button type="button" aria-label={`Reset password for ${member.name}`} title="Reset password" disabled={busyId === String(member.id)} onClick={() => onResetPassword(member)}><KeyRound size={14} /></button>
                  <button type="button" aria-label={`${member.active ? "Deactivate" : "Activate"} ${member.name}`} title={`${member.active ? "Deactivate" : "Activate"} ${member.role}`} disabled={busyId === String(member.id)} onClick={() => onToggleStatus(member)}>{member.active ? <X size={14} /> : <Check size={14} />}</button>
                </div>
              ) : <span className="optional-label">—</span>}</td>
            </tr>)}
              {members.length === 0 && <tr><td colSpan="6" className="table-empty"><Users size={18} /> No team members are assigned to this store.</td></tr>}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
