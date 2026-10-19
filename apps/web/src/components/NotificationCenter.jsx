import { Bell, Boxes, CalendarDays, Check } from "lucide-react";
import "./NotificationCenter.css";

export function NotificationCenter({
  items,
  open,
  onToggle,
  onViewInventory,
  onSelectAlert,
}) {
  const orderedItems = [...items].sort(
    (a, b) =>
      Number(b.severity === "critical") - Number(a.severity === "critical"),
  );

  return (
    <div className="notification-center">
      <button
        type="button"
        className="icon-button notification-button"
        aria-label={
          items.length
            ? `Notifications, ${items.length} active alerts`
            : "Notifications, no active alerts"
        }
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Open notifications"
        onClick={onToggle}
      >
        <Bell size={18} />
        {items.length > 0 && (
          <span className="notification-count">
            {items.length > 99 ? "99+" : items.length}
          </span>
        )}
      </button>
      {open && (
        <section
          className={`notification-panel${items.length ? "" : " is-empty"}`}
          role="dialog"
          aria-label="Notification center"
        >
          <div className="notification-panel-heading">
            <div>
              <h2>Notifications</h2>
            </div>
          </div>
          {items.length ? (
            <div className="notification-list">
              {orderedItems.slice(0, 8).map((item) => (
                <button
                  type="button"
                  className="notification-item"
                  key={item.id}
                  onClick={() => onSelectAlert(item)}
                >
                  <span className={`notification-item-icon ${item.severity}`}>
                    {item.type === "expiry" ? (
                      <CalendarDays size={16} />
                    ) : (
                      <Boxes size={16} />
                    )}
                  </span>
                  <span className="notification-item-copy">
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
                  </span>
                  <span className={`notification-severity ${item.severity}`}>
                    {item.severity === "critical" ? "Urgent" : "Review"}
                  </span>
                </button>
              ))}
            </div>
          ) : (
            <div className="notification-empty">
              <span>
                <Check size={17} />
              </span>
              <strong>No active alerts</strong>
            </div>
          )}
          {items.length > 8 && (
            <div className="notification-panel-footer">
              Showing 8 of {items.length} alerts
            </div>
          )}
        </section>
      )}
    </div>
  );
}
