// src/components/EventCreationModal.jsx
import React, { useState } from "react";

export default function EventCreationModal({ onClose, onCreate, loading }) {
  const [name, setName] = useState("");
  const [datesInput, setDatesInput] = useState(""); // 여러 날짜를 문자열로 입력받음
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    // datesInput을 쉼표 기준으로 분리하고 공백 제거
    const dates = datesInput
      .split(",")
      .map((d) => d.trim())
      .filter((d) => d.length > 0);

    if (!name.trim()) {
      setError("행사 이름을 입력해주세요.");
      return;
    }

    if (dates.length === 0) {
      setError("날짜를 하나 이상 입력해주세요.");
      return;
    }

    try {
      await onCreate({
        name,
        dates,       // 배열 형태로 전달
        location,
        description,
      });
    } catch (err) {
      console.error(err);
      setError(err.message || "행사 생성 중 오류가 발생했습니다.");
    }
  };

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <h3 style={{ marginTop: 0 }}>새 행사 생성</h3>
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            행사 이름
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
              placeholder="예: AI 트렌드 세미나"
            />
          </label>

          <label style={styles.label}>
            일시 (쉼표로 여러 개 입력 가능)
            <input
              type="text"
              value={datesInput}
              onChange={(e) => setDatesInput(e.target.value)}
              style={styles.input}
              placeholder="예: 2025-11-20, 2025-11-27"
            />
          </label>

          <label style={styles.label}>
            장소
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              style={styles.input}
              placeholder="예: 울산창조경제혁신센터"
            />
          </label>

          <label style={styles.label}>
            설명
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={styles.textarea}
              placeholder="행사에 대한 간단한 설명을 입력하세요."
            />
          </label>

          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.actions}>
            <button type="button" onClick={onClose} style={styles.ghost}>
              취소
            </button>
            <button type="submit" disabled={loading} style={styles.primary}>
              {loading ? "생성 중..." : "생성"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

const styles = {
  overlay: {
    position: "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    background: "rgba(0,0,0,0.4)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 1000,
  },
  modal: {
    background: "#fff",
    padding: 24,
    borderRadius: 10,
    width: "90%",
    maxWidth: 420,
    boxShadow: "0 6px 20px rgba(0,0,0,0.1)",
  },
  form: { display: "flex", flexDirection: "column", gap: 12 },
  label: { fontSize: 14, fontWeight: 500, display: "flex", flexDirection: "column", gap: 4 },
  input: {
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid #ccc",
    fontSize: 14,
  },
  textarea: {
    padding: "8px 10px",
    borderRadius: 6,
    border: "1px solid #ccc",
    fontSize: 14,
    minHeight: 60,
  },
  actions: { display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 10 },
  primary: { background: "#0ea5e9", color: "#fff", padding: "8px 14px", border: "none", borderRadius: 6, cursor: "pointer" },
  ghost: { background: "#f3f4f6", color: "#333", padding: "8px 14px", border: "none", borderRadius: 6, cursor: "pointer" },
  error: { color: "#b91c1c", fontSize: 13, marginTop: 4 },
};
