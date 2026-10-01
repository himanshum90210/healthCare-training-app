import { useEffect, useRef, useState } from "react";
import { Bell } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/ui/Button";
import type { NotificationItem } from "../../types/notification";
import { timeAgo } from "../../utils/format";
import { useMarkAllNotificationsRead, useMarkNotificationRead, useNotifications } from "./useNotifications";

export function NotificationBell() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const { data } = useNotifications();
  const markRead = useMarkNotificationRead();
  const markAll = useMarkAllNotificationsRead();

  const unread = data?.meta.unread ?? 0;
  const items = data?.items ?? [];

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const openItem = (n: NotificationItem) => {
    if (!n.readAt) markRead.mutate(n.id);
    setOpen(false);
    navigate("/appointments");
  };

  return (
    <div className="bell" ref={rootRef}>
      <Button
        variant="ghost"
        className="btn--icon"
        aria-label={unread > 0 ? `Notifications, ${unread} unread` : "Notifications"}
        aria-haspopup="true"
        aria-expanded={open}
        icon={<Bell size={18} />}
        onClick={() => setOpen((v) => !v)}
      />
      {unread > 0 && (
        <span className="bell__badge" aria-hidden="true">
          {unread > 99 ? "99+" : unread}
        </span>
      )}

      {open && (
        <div className="bell__panel" role="region" aria-label="Notifications">
          <div className="bell__header">
            <span>Notifications</span>
            <Button
              variant="ghost"
              className="btn--sm"
              disabled={unread === 0}
              onClick={() => markAll.mutate()}
            >
              Mark all read
            </Button>
          </div>

          {items.length === 0 ? (
            <p className="bell__empty">You're all caught up.</p>
          ) : (
            <ul className="bell__list">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={`bell__item${n.readAt ? "" : " is-unread"}`}
                    onClick={() => openItem(n)}
                  >
                    <span className="bell__title">
                      {!n.readAt && <span className="bell__dot" aria-label="Unread" />}
                      {n.title}
                    </span>
                    <span className="bell__msg">{n.message}</span>
                    <span className="bell__time">{timeAgo(n.createdAt)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}