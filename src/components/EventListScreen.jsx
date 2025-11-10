// src/components/EventListScreen.jsx
import React, { useState } from "react";
import EventCreationModal from "./EventCreationModal";

export default function EventListScreen({ user, events = [], onSelectEvent, onLogout, onRefresh, apiUrl, apiRequest, error }) {
  const [showCreate, setShowCreate] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [creating, setCreating] = useState(false);

  const handleCreate = async (payload) => {
    // payload 예: { name, date, location, description }
    setLocalError(null);
    if ((!apiUrl) && typeof apiRequest !== "function") {
      setLocalError("API URL 설정이 필요합니다.");
      return;
    }
    setCreating(true);

    // 서버에서 기대하는 필드로 매핑
    const title = payload.name || payload.title || "(제목없음)";
    const dates = payload.date ? [payload.date] : (payload.dates || []);
    const location = payload.location || "";

    try {
      let data;

      // 1) 부모가 전달한 apiRequest(헬퍼)가 있으면 우선 사용
      if (typeof apiRequest === "function") {
        data = await apiRequest("create_new_event", {
          user_id: user.id,
          title,
          location,
          dates
        });
      } else {
        // 2) form-urlencoded POST 시도 (preflight 회피)
        const form = new URLSearchParams();
        form.append("action", "create_new_event");
        form.append("user_id", user.id);
        form.append("title", title);
        form.append("location", location);
        // dates는 JSON 문자열로 전송
        form.append("dates", JSON.stringify(dates));

        try {
          const res = await fetch(apiUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8" },
            body: form.toString(),
          });

          if (!res.ok) {
            throw new Error(`POST 요청 실패 (status ${res.status})`);
          }
          const txt = await res.text();
          data = txt ? JSON.parse(txt) : {};
        } catch (postErr) {
          // 3) POST 실패 시 GET 폴백
          const qs = new URLSearchParams({
            action: "create_new_event",
            user_id: user.id,
            title,
            location,
            dates: JSON.stringify(dates),
          });
          const url = `${apiUrl}?${qs.toString()}`;
          const res2 = await fetch(url, { method: "GET" });
          if (!res2.ok) throw new Error(`Fallback GET 실패 (status ${res2.status})`);
          const txt2 = await res2.text();
          data = txt2 ? JSON.parse(txt2) : {};
        }
      }

      // 응답 검사
      if (!data) throw new Error("서버로부터 응답이 없습니다.");
      if (data.ok === false) throw new Error(data.error || data.message || "행사 생성 실패");

      // 성공 처리: 모달 닫고 목록 갱신
      setShowCreate(false);
      onRefresh && onRefresh();
    } catch (err) {
      console.error("Create event error:", err);
      const msg = (err && err.message) ? err.message : String(err);
      // 브라우저의 'Failed to fetch' 같은 메시지면 CORS 가능성 안내
      if (msg.includes("Failed to fetch") || msg.includes("CORS")) {
        setLocalError("네트워크 요청에 실패했습니다. (CORS 또는 네트워크 문제 가능) 서버 배포 설정을 확인하세요.");
      } else {
        setLocalError(msg);
      }
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
              <li key={ev.id || ev.eventId || ev.title || ev.name} style={styles.item}>
                <div style={{ flex: 1 }}>
                  <div style={styles.eventName}>{ev.title || ev.name || "(무명 행사)"}</div>
                  <div style={styles.eventMeta}>
                    {ev.date ? `일시: ${ev.date}` : (ev.dates ? `일시: ${ev.dates}` : "")}
                    {ev.location ? ` · ${ev.location}` : ""}
                    {ev.status ? ` · 상태: ${ev.status}` : ""}
                  </div>
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
