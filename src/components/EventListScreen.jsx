// src/components/EventListScreen.jsx
import React, { useState } from "react";
import EventCreationModal from "./EventCreationModal";

export default function EventListScreen({ user, events = [], onSelectEvent, onLogout, onRefresh, apiUrl, error }) {
  const [showCreate, setShowCreate] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [creating, setCreating] = useState(false);

  const handleCreate = async (payload) => {
    // payload 예: { name, date, description }
    setLocalError(null);
    if (!apiUrl) {
      setLocalError("API URL 설정이 필요합니다.");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "createEvent", userId: user.id, ...payload }),
      });

      if (!res.ok) {
        // fallback to GET-style
        const q = `${apiUrl}?action=createEvent&userId=${encodeURIComponent(user.id)}&name=${encodeURIComponent(payload.name || "")}&date=${encodeURIComponent(payload.date || "")}&description=${encodeURIComponent(payload.description || "")}`;
        const fallback = await fetch(q);
        if (!fallback.ok) throw new Error("행사 생성 실패");
        const fdata = await fallback.json();
        if (!fdata.ok) throw new Error(fdata.message || "생성 실패");
        setShowCreate(false);
        onRefresh && onRefresh();
        return;
      }

      const data = await res.json();
      if (!data.ok) throw new Error(data.message || "행사 생성에 실패했습니다.");
      setShowCreate(false);
      onRefresh && onRefresh();
    } catch (err) {
      console.error("Create event error:", err);
      setLocalError(err.message || "행사 생성 중 오류가 발생했습니다.");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div style={styles.wrap}>
      <header style={styles.header}>
        <div>
          <h2 style={{ margin: 0 }}>내 행사</h2>
          <div style={{ fontSize: 13, color: "#666" }}>{user.name} ({user.id})</div>
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={() => setShowCreate(true)} style={styles.primary}>새 행사 생성</button>
          <button onClick={onRefresh} style={styles.ghost}>새로고침</button>
          <button onClick={onLogout} style={styles.danger}>로그아웃</button>
        </div>
      </header>

      <main style={styles.main}>
        {error && <div style={styles.error}>{error}</div>}
        {localError && <div style={styles.error}>{localError}</div>}

        {Array.isArray(events) && events.length > 0 ? (
          <ul style={styles.list}>
            {events.map((ev) => (
              <li key={ev.id || ev.eventId || ev.name} style={styles.item}>
                <div style={{ flex: 1 }}>
                  <div style={styles.eventName}>{ev.name || ev.title || "(무명 행사)"}</div>
                  <div style={styles.eventMeta}>{ev.date ? `일시: ${ev.date}` : ""} {ev.location ? ` · ${ev.location}` : ""}</div>
                </div>
                <div style={{ marginLeft: 12 }}>
                  <button onClick={() => onSelectEvent(ev)} style={styles.select}>열기</button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div style={styles.empty}>
            등록된 행사가 없습니다. 새 행사를 생성해보세요.
          </div>
        )}
      </main>

      {showCreate && (
        <EventCreationModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreate}
          loading={creating}
        />
      )}
    </div>
  );
}

const styles = {
  wrap: { padding: 20, minHeight: "100vh", background: "#f4f6fb" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  primary: { background: "#0ea5e9", color: "#fff", padding: "8px 12px", borderRadius: 6, border: "none", cursor: "pointer" },
  ghost: { background: "transparent", padding: "8px 12px", borderRadius: 6, border: "1px solid #ddd", cursor: "pointer" },
  danger: { background: "#ef4444", color: "#fff", padding: "8px 12px", borderRadius: 6, border: "none", cursor: "pointer" },
  main: { marginTop: 8 },
  list: { listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 10 },
  item: { display: "flex", alignItems: "center", padding: 12, background: "#fff", borderRadius: 8, boxShadow: "0 2px 6px rgba(0,0,0,0.04)" },
  eventName: { fontWeight: 600 },
  eventMeta: { fontSize: 13, color: "#666", marginTop: 6 },
  select: { padding: "6px 10px", borderRadius: 6, border: "1px solid #ddd", background: "#fff", cursor: "pointer" },
  empty: { padding: 40, textAlign: "center", color: "#666", background: "#fff", borderRadius: 8 },
  error: { marginBottom: 10, color: "#b91c1c" },
};
