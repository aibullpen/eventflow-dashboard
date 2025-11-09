import React, { useState, useEffect } from 'react';
import { Calendar, Users, CheckSquare, Send, Clock, Heart, RefreshCw, AlertCircle } from 'lucide-react'; 
// 1. ✨ React Hooks를 정확히 임포트합니다.
// 2. ✨ 모달 컴포넌트를 정확한 경로에서 임포트합니다.
import EventCreationModal from './components/EventCreationModal'; 

// GAS Web App URL (Execute API, Read API 모두 사용)
const API_URL = 'https://script.google.com/macros/s/AKfycbweIo6I1uYrgVeqEn7cv_kGmdplp8F0TjZQXobaXfP35G_PeFPAma3vEO641HrjrpU/exec'; 

// =========================================================================
// StatCard, ActionButton 등 컴포넌트 정의 유지
// =========================================================================

function StatCard({ icon: Icon, label, value, color = 'blue' }) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
    };

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-600">{label}</p>
                    <p className="text-2xl font-semibold text-gray-900 mt-1">{value}</p>
                </div>
                <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                    <Icon className="w-5 h-5" />
                </div>
            </div>
        </div>
    );
}

function ActionButton({ onClick, loading, icon: Icon, children }) {
    return (
        <button
            onClick={onClick}
            disabled={loading}
            className="flex items-center justify-center gap-2 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm font-medium text-gray-700"
        >
            {loading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
                <Icon className="w-4 h-4" />
            )}
            {children}
        </button>
    );
}

function StatusBadge({ status }) {
    const colors = {
        'CONFIRMED': 'bg-green-100 text-green-800',
        'RESPONDED': 'bg-blue-100 text-blue-800',
        'INVITED': 'bg-yellow-100 text-yellow-800',
        'DONE': 'bg-green-100 text-green-800',
        'REGISTERED': 'bg-gray-100 text-gray-800',
        '가등록 (PENDING)': 'bg-pink-100 text-pink-800',
    };

    const colorClass = colors[status] || 'bg-gray-100 text-gray-800';

    return (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>
            {status}
        </span>
    );
}

function RsvpBadge({ rsvp }) {
    const isAttending = /참석|참가|yes|y|true|1/i.test(String(rsvp || ''));
    const colorClass = isAttending ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';

    return (
        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${colorClass}`}>
            {rsvp || '-'}
        </span>
    );
}
// =========================================================================


export default function EventFlowDashboard() {
    // 3. ✨ 상태 정의
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [actionLoading, setActionLoading] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false); // 모달 상태

    const fetchData = async () => {
        try {
            setLoading(true);
            // 4. GET 요청으로 데이터 읽기 (기존 방식 유지)
            const response = await fetch(`${API_URL}?action=getSummary`);
            const result = await response.json();
            
            if (result.ok) {
                setData(result);
                setError(null);
            } else {
                setError(result.error || '데이터 로딩 실패');
            }
        } catch (err) {
            setError('서버 연결 실패: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    const executeAction = async (action, label) => {
        // 기존 코드: confirm()은 UI/UX를 위해 커스텀 모달로 대체하는 것이 좋습니다.
        if (!confirm(`${label}을(를) 실행하시겠습니까?`)) return; 
        
        try {
            setActionLoading(action);
            const response = await fetch(`${API_URL}?action=${action}`);
            const result = await response.json();
            
            if (result.ok) {
                alert('✅ ' + (result.message || '완료'));
                fetchData();
            } else {
                alert('❌ ' + (result.error || '실패'));
            }
        } catch (err) {
            alert('❌ 오류: ' + err.message);
        } finally {
            setActionLoading(null);
        }
    };
    
    // 5. ✨ 행사 생성 완료 핸들러
    const handleEventCreated = () => {
        setIsModalOpen(false); 
        fetchData(); 
    };

// src/App.jsx 파일 내부에 추가

// 워크플로우 단계를 정의
const WORKFLOW_STEPS = [
    { id: 'SETUP', label: '행사 생성 및 설정', requiredData: 'config.title' },
    { id: 'SPEAKER_INVITE', label: '강사 초대 발송', requiredData: 'speakers.count > 0' },
    { id: 'SCHEDULE_CONFIRM', label: '일정 확정', requiredData: 'config.confirmedDatetime' },
    { id: 'ATTENDEE_INVITE', label: '참석자 초대 발송', requiredData: 'counts.registered > 0' },
    { id: 'REMINDER_READY', label: '리마인더 발송 준비', requiredData: 'tasks.tasksOpen < tasks.tasksTotal' },
    { id: 'COMPLETE', label: '준비 완료', requiredData: 'logs.finalCheckOk' },
];

// 현재 진행 단계를 계산하는 함수 (data 객체를 기반으로)
const getCurrentStep = (data) => {
    if (!data?.config?.title) return 'SETUP'; // 1단계: 설정 필요

    const confirmedSpeaker = data.speakers?.find(s => s.status === 'CONFIRMED');
    if (!confirmedSpeaker) {
        // 초대 메일 발송이 필요하거나 응답 대기 중
        const invitedCount = data.speakers?.filter(s => s.status === 'INVITED').length;
        if (invitedCount > 0) return 'SPEAKER_INVITE';
        // 가등록만 있다면 SETUP 상태로 남아있게 됩니다.
    } else if (!data.config.confirmedDatetime) {
        // 강사가 응답했으나 최종 확정 날짜가 config에 기록되지 않은 경우 (Lock 단계 필요)
        return 'SCHEDULE_CONFIRM';
    }
    
    // 일정 확정 이후
    if (data.config.confirmedDatetime) {
        if (data.counts.registered > 0) {
            // 참석자 모집 중
            return 'ATTENDEE_INVITE';
        }
        // 참석자가 없거나 아직 초대 이메일 발송 전
    }

    // 최종 단계 판단 로직은 복잡하므로, 일단 확정만 체크
    if (data.config.confirmedDatetime) {
        return 'REMINDER_READY'; // 리마인더/최종 점검 단계
    }
    
    return 'SETUP'; // 기본값 (혹은 로직에 따라 적절히 변경)
};

// 📌 이 함수를 EventFlowDashboard 컴포넌트 내부에서 호출하여 상태를 사용합니다.
const currentStepId = getCurrentStep(data);

    useEffect(() => {
        fetchData();
        const interval = setInterval(fetchData, 30000);
        return () => clearInterval(interval);
    }, []);

    // 6. 🐛 오류 방지: data가 null일 때 안전하게 처리
    const { config, counts, speakers, attendees, tasks, logs } = data || {}; 
    const attendanceRate = counts?.registered ? Math.round((counts.attending / counts.registered) * 100) : 0;


    // 7. 로딩/에러 화면 (JSX 유지)
    if (loading && !data) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 animate-spin mx-auto mb-2 text-blue-500" />
                    <p className="text-gray-600">로딩 중...</p>
                </div>
            </div>
        );
    }

    if (error && !data) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-sm border border-red-200 p-6 max-w-md">
                    <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-red-600 text-center">{error}</p>
                    <button 
                        onClick={fetchData}
                        className="mt-4 w-full px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                    >
                        다시 시도
                    </button>
                </div>
            </div>
        );
    }
    
    // 8. 메인 UI 렌더링
    return (
        <div className="min-h-screen bg-gray-50">
            {/* 상단 헤더 섹션 */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            {/* 🐛 오류 방지: config가 null일 수 있으므로 ?. 사용 */}
                            <h1 className="text-2xl font-semibold text-gray-900">
                                {config?.title || 'EventFlow'}
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {config?.confirmedDatetime || '일정 미확정'} · {config?.location || '장소 미정'}
                            </p>
                        </div>
                        
                        {/* 9. ✨ 새 행사 생성 버튼 및 새로고침 버튼 */}
                        <div className="flex items-center gap-3">
                            <button 
                                onClick={() => setIsModalOpen(true)}
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
                    
                    // App.jsx return 문 내, <div className="max-w-7xl mx-auto px-4 ..."> 섹션 내부에 추가

// 1단계: 상태 표시기 UI
<div className="mt-6 bg-white p-4 rounded-lg border border-gray-200">
    <h3 className="text-md font-semibold text-gray-800 mb-3">
        진행 상황 ({WORKFLOW_STEPS.find(s => s.id === currentStepId)?.label})
    </h3>
    <div className="flex justify-between items-start space-x-1 sm:space-x-4 overflow-x-auto pb-2">
        {WORKFLOW_STEPS.map((step, index) => {
            const isActive = step.id === currentStepId;
            const isCompleted = WORKFLOW_STEPS.findIndex(s => s.id === currentStepId) > index;
            
            let circleClass = 'bg-gray-300';
            if (isCompleted) circleClass = 'bg-green-500';
            if (isActive) circleClass = 'bg-indigo-600 ring-4 ring-indigo-200';
            
            return (
                <div key={step.id} className="flex flex-col items-center min-w-[100px] sm:min-w-0">
                    <div className="flex items-center w-full">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${circleClass}`} />
                        {/* 마지막 단계가 아니면 선을 추가 */}
                        {index < WORKFLOW_STEPS.length - 1 && (
                            <div className={`h-0.5 flex-grow ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`} />
                        )}
                    </div>
                    <p className={`mt-2 text-xs text-center font-medium ${isActive ? 'text-indigo-600' : 'text-gray-500'}`}>
                        {step.label}
                    </p>
                </div>
            );
        })}
    </div>
</div>

// 이 코드를 기존 StatCard grid 바로 위에 삽입합니다.

                    {/* StatCard 및 Attendance Rate 렌더링 유지 */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        <StatCard icon={Users} label="등록" value={counts?.registered || 0} />
                        <StatCard icon={CheckSquare} label="참석 확정" value={counts?.attending || 0} color="green" />
                        <StatCard icon={Send} label="초대 발송" value={counts?.invited || 0} />
                        <StatCard icon={Clock} label="할일" value={`${counts?.tasksOpen || 0}/${counts?.tasksTotal || 0}`} />
                    </div>

                    <div className="mt-6">
                        <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-gray-600">참석률</span>
                            <span className="font-medium text-gray-900">{attendanceRate}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${attendanceRate}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 작업 실행 섹션 */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">작업 실행</h2>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                        <ActionButton
                            onClick={() => executeAction('sendSpeakerInvites', '강사 초대메일')}
                            loading={actionLoading === 'sendSpeakerInvites'}
                            icon={Send}
                        >
                            강사 초대메일
                        </ActionButton>
                        <ActionButton
                            onClick={() => executeAction('confirmFirstSpeaker', '강사 응답확정')}
                            loading={actionLoading === 'confirmFirstSpeaker'}
                            icon={CheckSquare}
                        >
                            강사 응답확정
                        </ActionButton>
                        <ActionButton
                            onClick={() => executeAction('createCalendar', '캘린더 생성')}
                            loading={actionLoading === 'createCalendar'}
                            icon={Calendar}
                        >
                            캘린더 생성
                        </ActionButton>
                        <ActionButton
                            onClick={() => executeAction('sendAttendeeInvites', '참석자 초대')}
                            loading={actionLoading === 'sendAttendeeInvites'}
                            icon={Users}
                        >
                            참석자 초대
                        </ActionButton>
                        <ActionButton
                            onClick={() => executeAction('remindD1', 'D-1 리마인드')}
                            loading={actionLoading === 'remindD1'}
                            icon={Clock}
                        >
                            D-1 리마인드
                        </ActionButton>
                        <ActionButton
                            onClick={() => executeAction('sendThanks', '감사메일')}
                            loading={actionLoading === 'sendThanks'}
                            icon={Heart}
                        >
                            감사/설문 메일
                        </ActionButton>
                    </div>
                </div>

                {/* 강사 목록 */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">강사</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">이름</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">이메일</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">상태</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">확정시간</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">주제</th>
                                </tr>
                            </thead>
                            <tbody>
                                {speakers?.map((s, i) => (
                                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4 text-sm text-gray-900">{s.name}</td>
                                        <td className="py-3 px-4 text-sm text-gray-500">{s.email}</td>
                                        <td className="py-3 px-4">
                                            <StatusBadge status={s.status} />
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600">{s.confirmedAt}</td>
                                        <td className="py-3 px-4 text-sm text-gray-600">{s.topic}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 참석자 목록 */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">참석자</h2>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-gray-200">
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">이름</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">이메일</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">RSVP</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">상태</th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">응답시각</th>
                                </tr>
                            </thead>
                            <tbody>
                                {attendees?.map((a, i) => (
                                    <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                        <td className="py-3 px-4 text-sm text-gray-900">{a.name}</td>
                                        <td className="py-3 px-4 text-sm text-gray-500">{a.email}</td>
                                        <td className="py-3 px-4">
                                            <RsvpBadge rsvp={a.rsvp} />
                                        </td>
                                        <td className="py-3 px-4 text-sm text-gray-600">{a.status}</td>
                                        <td className="py-3 px-4 text-sm text-gray-500">{a.ts}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* 체크리스트 및 로그 섹션 유지 */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">체크리스트</h2>
                    {/* ... (테이블 렌더링 유지) */}
                </div>

                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <h2 className="text-lg font-medium text-gray-900 mb-4">실행 로그</h2>
                    {/* ... (테이블 렌더링 유지) */}
                </div>
            </div>
            
            {/* 10. EventCreationModal 컴포넌트 통합 및 API_URL 전달 */}
            <EventCreationModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onEventCreated={handleEventCreated}
                apiUrl={API_URL} 
            />
        </div>
    );
}