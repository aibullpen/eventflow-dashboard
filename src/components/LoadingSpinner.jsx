// src/components/LoadingSpinner.jsx
import React from "react";

export default function LoadingSpinner({ message = "불러오는 중..." }) {
  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: 12,
      background: "#f7f8fb"
    }}>
      <div style={{
        width: 48,
        height: 48,
        borderRadius: "50%",
        border: "6px solid #eee",
        borderTopColor: "#2563eb",
        animation: "spin 1s linear infinite"
      }} />
      <div style={{ color: "#333" }}>{message}</div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
