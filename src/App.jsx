// src/App.jsx
import React, { useEffect, useState } from "react";
import AuthScreen from "./components/AuthScreen";
import EventListScreen from "./components/EventListScreen";
import AppContainer from "./AppContainer"; // 기존 대시보드(기존 app.jsx 내용 옮긴 파일)
import LoadingSpinner from "./components/LoadingSpinner"; // 선택사항. 없으면 간단한 텍스트로 대체 가능.

// *** 반드시 본인의 Apps Script (또는 백엔드) 배포 URL로 변경하세요 ***
const API_URL = "https://script.google.com/macros/s/AKfycbxC_vYO_vzmcz9j29Uz_2oL40ioNXe0_bnm7n69c7Fb9BOSNvCnNIo_J4gWpDE4SRrX/exec";

export default function App() {
  // 상태: userId 기준으로 로그인 여부 판단, eventId 선택으로 화면 전환
  const [user, setUser] = useState(null); // 예: { id: "...", name: "..." }
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 로컬저장소에서 유저 복원 (앱 로드 시)
  useEffect(() => {
    const saved = localStorage.getItem("app_user");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setUser(parsed);
      } catch (e) {
        console.warn("Failed to parse saved user", e);
        localStorage.removeItem("app_user");
      }
    }
    setLoading(false);
  }, []);

  // 로그인된 경우 이벤트 목록 로드
  useEffect(() => {
    if (!user) {
      setEvents([]);
      return;
    }

    setLoading(true);
    setError(null);

    // 예시: GAS API에 ?action=getEvents&userId=xxx 로 요청
    const url = `${API_URL}?action=getEvents&userId=${encodeURIComponent(user.id)}`;
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`Network response was not ok (${res.status})`);
        return res.json();
      })
      .then((data) => {
        // 백엔드 응답 포맷에 맞게 조정하세요 (예: { events: [...] } )
        const list = Array.isArray(data.events) ? data.events : data;
        setEvents(list);
      })
      .catch((err) => {
        console.error("Failed to fetch events:", err);
        setError("행사 목록을 불러오지 못했습니다.");
      })
      .finally(() => setLoading(false));
  }, [user]);

  // 사용자 로그인 처리 (AuthScreen에서 호출)
  const handleLogin = async (userData) => {
    // userData 예: { id: "user@example.com", name: "홍길동" }
    setUser(userData);
    localStorage.setItem("app_user", JSON.stringify(userData));
    // 이벤트 목록은 user 상태 변경에 의해 자동으로 로드됩니다.
  };

  // 로그아웃
  const handleLogout = () => {
    setUser(null);
    setSelectedEvent(null);
    setEvents([]);
    localStorage.removeItem("app_user");
  };

  // 행사 선택
  const handleSelectEvent = (event) => {
    setSelectedEvent(event);
  };

  // 행사 선택 해제(뒤로가기)
  const handleBackToList = () => {
    setSelectedEvent(null);
  };

  // (선택) 새 행사 생성 후 목록 갱신용 함수
  const refreshEvents = () => {
    if (!user) return;
    setLoading(true);
    fetch(`${API_URL}?action=getEvents&userId=${encodeURIComponent(user.id)}`)
      .then((res) => res.json())
      .then((data) => setEvents(Array.isArray(data.events) ? data.events : data))
      .catch((err) => {
        console.error(err);
        setError("행사 목록 갱신 실패");
      })
      .finally(() => setLoading(false));
  };

  // 로딩 UI
  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: "center" }}>
        {LoadingSpinner ? <LoadingSpinner message="불러오는 중..." /> : <p>불러오는 중...</p>}
      </div>
    );
  }

// App.jsx (로그인 체크 부분)
if (!user) {
  return (
    <div style={{ minHeight: "100vh" }}>
      <AuthScreen
        // 로그인 성공 시 handleLogin 호출
        onLogin={(loggedInUser) => {
          console.log("로그인 성공:", loggedInUser);
          handleLogin(loggedInUser); // 상위 상태 업데이트
        }}
        apiUrl={API_URL} // AuthScreen에서 API 호출에 사용
      />
    </div>
  );
}


  // 로그인 상태이며 행사 선택이 없을 때 => EventListScreen
  if (user && !selectedEvent) {
    return (
      <div style={{ minHeight: "100vh" }}>
        <EventListScreen
          user={user}
          events={events}
          onSelectEvent={handleSelectEvent}
          onLogout={handleLogout}
          onRefresh={refreshEvents}
          apiUrl={API_URL} // Event 생성/수정 API에서 사용
          error={error}
        />
      </div>
    );
  }

  // 로그인 상태이며 행사 선택이 있을 때 => 기존 대시보드(AppContainer) 렌더링
  return (
    <div style={{ minHeight: "100vh" }}>
      <AppContainer
        user={user}
        event={selectedEvent}
        onLogout={handleLogout}
        onBack={handleBackToList}
        apiUrl={API_URL}
        refreshEvents={refreshEvents} // 필요 시 사용
      />
    </div>
  );
}
