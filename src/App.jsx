// src/App.jsx (파일 수정)

import React, { useState, useEffect } from 'react';
import { Calendar, Users, CheckSquare, Send, Clock, Heart, RefreshCw, AlertCircle } from 'lucide-react'; 
// 1. ✨ 경로 수정: components 폴더 아래에 있는 모달 컴포넌트를 정확히 임포트합니다.
import EventCreationModal from './components/EventCreationModal'; 

// API_URL은 App.jsx에 그대로 유지합니다.
const API_URL = 'https://script.google.com/macros/s/AKfycbweIo6I1uYrgVeqEn7cv_kGmdplp8F0TjZQXobaXfP35G_PeFPAma3vEO641HrjrpU/exec'; 

// ... (createEventAPI 함수는 EventCreationModal.jsx로 이동했으므로 App.jsx에서는 삭제)

// ... (StatCard, ActionButton, StatusBadge, RsvpBadge 함수 정의 유지)

export default function EventFlowDashboard() {
    // ... (기존 data, loading, error, actionLoading, fetchData, executeAction 함수 유지)

    const [isModalOpen, setIsModalOpen] = useState(false); // 👈 모달 상태 추가

    // ... (handleEventCreated 함수 유지)

    // ... (useEffect, 로딩/에러 화면 렌더링 유지)

    // ... (config, counts, speakers, attendees, tasks, logs 데이터 구조 파괴 유지)

    return (
        <div className="min-h-screen bg-gray-50">
            {/* ... (상단 헤더 섹션 렌더링 유지) ... */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-2xl font-semibold text-gray-900">
                                {config?.title || 'EventFlow'}
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {config?.confirmedDatetime || '일정 미확정'} · {config?.location || '장소 미정'}
                            </p>
                        </div>
                        
                        {/* 2. ✨ 새 행사 생성 버튼 및 새로고침 버튼 */}
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setIsModalOpen(true)} // 클릭 시 모달 열기
                                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors text-sm"
                            >
                                🚀 새 행사 생성
                            </button>
                            <button
                                onClick={fetchData}
                                disabled={loading}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>
                    {/* ... (StatCard 및 Attendance Rate 렌더링 유지) ... */}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* ... (작업 실행, 강사, 참석자, 체크리스트, 로그 섹션 유지) ... */}
            </div>
            
            {/* 3. ✨ EventCreationModal 컴포넌트 통합 및 API_URL 전달 */}
            <EventCreationModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onEventCreated={handleEventCreated}
                apiUrl={API_URL} // 👈 API_URL을 prop으로 전달
            />
        </div>
    );
}