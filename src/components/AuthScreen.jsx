// src/components/AuthScreen.jsx
import React, { useState, useRef } from "react";

export default function AuthScreen({ onLogin }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const emailRef = useRef(null);
  const nameRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const email = emailRef.current.value.trim();
      const name = nameRef.current.value.trim();

      if (!email || !name) {
        setError("이름과 이메일을 모두 입력해주세요.");
        setLoading(false);
        return;
      }

      const url =
        import.meta.env.VITE_GAS_URL ||
        "https://script.google.com/macros/s/AKfycbxfNZp3eLz3q_ZG5u99prUFafW3nBHD5sEndclRu57d-Ycdi6S6KVdukINlSBeCO3Nv/exec";

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json", // ✅ 필수
        },
        body: JSON.stringify({
          action: "login",
          idToken: email, // 실제 구현 시 OAuth 토큰
          name: name,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(data.error || "로그인 실패");
      }

      console.log("Login success:", data.user);
      onLogin && onLogin(data.user); // 상위 컴포넌트에 사용자 전달
    } catch (err) {
      console.error("Auth error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2>EventFlow 로그인</h2>
      <form onSubmit={handleSubmit} style={styles.form}>
        <input
          type="text"
          placeholder="이름"
          ref={nameRef}
          style={styles.input}
        />
        <input
          type="email"
          placeholder="이메일"
          ref={emailRef}
          style={styles.input}
        />
        <button type="submit" style={styles.button} disabled={loading}>
          {loading ? "로그인 중..." : "로그인"}
        </button>
        {error && <div style={styles.error}>{error}</div>}
      </form>
    </div>
  );
}

const styles = {
  container: {
    maxWidth: 400,
    margin: "80px auto",
    padding: 24,
    border: "1px solid #ddd",
    borderRadius: 8,
    background: "#fff",
    boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
    textAlign: "center",
  },
  form: { display: "flex", flexDirection: "column", gap: 12 },
  input: {
    padding: 10,
    borderRadius: 6,
    border: "1px solid #ccc",
    fontSize: 16,
  },
  button: {
    padding: 10,
    borderRadius: 6,
    border: "none",
    background: "#0ea5e9",
    color: "#fff",
    fontSize: 16,
    cursor: "pointer",
  },
  error: {
    marginTop: 12,
    color: "#b91c1c",
    fontSize: 14,
  },
};
