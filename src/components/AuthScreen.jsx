// src/components/AuthScreen.jsx
import React, { useState } from "react";

export default function AuthScreen({ onLogin, apiUrl }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const validate = () => {
    if (!name.trim()) return "이름을 입력하세요.";
    if (!email.trim()) return "이메일(아이디)을 입력하세요.";
    // 간단 이메일 형식 검사
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!re.test(email.trim())) return "유효한 이메일을 입력하세요.";
    return null;
  };

  const handleSubmit = async (e) => {
    e && e.preventDefault();
    setError(null);
    const v = validate();
    if (v) {
      setError(v);
      return;
    }

    if (!apiUrl) {
      setError("API URL이 설정되지 않았습니다.");
      return;
    }

    setLoading(true);
    try {
      // Apps Script가 POST를 지원하면 body JSON으로, 아니면 GET으로 변경 가능
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "login",
          name: name.trim(),
          email: email.trim(),
        }),
      });

      // 일부 GAS 스크립트는 200을 주지만 JSON을 감싸서 주기도 합니다.
      if (!res.ok) {
        // GET fallback (간혹 GAS 배포 설정에 따라 POST 차단된 경우)
        const fallback = await fetch(`${apiUrl}?action=login&name=${encodeURIComponent(name.trim())}&email=${encodeURIComponent(email.trim())}`);
        if (!fallback.ok) throw new Error("로그인 요청 실패");
        const fdata = await fallback.json();
        if (!fdata || !fdata.ok) throw new Error(fdata?.message || "로그인 실패");
        onLogin(fdata.user || { id: email.trim(), name: name.trim() });
        return;
      }

      const data = await res.json();
      if (!data) throw new Error("빈 응답");
      if (!data.ok) throw new Error(data.message || "로그인 실패");
      // 데이터 포맷: { ok:true, user: { id, name, ... } }
      const user = data.user || { id: email.trim(), name: name.trim() };
      onLogin(user);
    } catch (err) {
      console.error("Auth error:", err);
      setError(err.message || "로그인 중 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.wrap}>
      <div style={styles.card}>
        <h1 style={styles.title}>로그인 / 회원가입</h1>

        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>
            이름
            <input
              style={styles.input}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="홍길동"
              disabled={loading}
            />
          </label>

          <label style={styles.label}>
            이메일 (ID)
            <input
              style={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              disabled={loading}
            />
          </label>

          {error && <div style={styles.error}>{error}</div>}

          <div style={styles.actions}>
            <button type="submit" style={styles.primary} disabled={loading}>
              {loading ? "처리중..." : "계속"}
            </button>
          </div>

          <p style={styles.note}>
            ※ Google OAuth 대신 간단 인증을 사용합니다. 이메일(ID)로 사용자 구분이 됩니다.
          </p>
        </form>
      </div>
    </div>
  );
}

const styles = {
  wrap: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
    background: "#f7f8fb",
  },
  card: {
    width: 420,
    maxWidth: "95%",
    padding: 20,
    borderRadius: 8,
    boxShadow: "0 6px 20px rgba(0,0,0,0.06)",
    background: "#fff",
  },
  title: { margin: 0, marginBottom: 12, fontSize: 20 },
  form: { display: "flex", flexDirection: "column", gap: 10 },
  label: { display: "flex", flexDirection: "column", fontSize: 13, color: "#333" },
  input: {
    marginTop: 6,
    padding: "8px 10px",
    fontSize: 14,
    borderRadius: 6,
    border: "1px solid #ddd",
  },
  actions: { marginTop: 8, display: "flex", justifyContent: "flex-end" },
  primary: {
    padding: "8px 14px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: 6,
    cursor: "pointer",
  },
  note: { marginTop: 12, fontSize: 12, color: "#666" },
  error: { marginTop: 6, color: "#b91c1c", fontSize: 13 },
};
