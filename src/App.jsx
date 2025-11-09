import React, { useState, useEffect } from 'react';
import { Calendar, Users, CheckSquare, Send, Clock, Heart, RefreshCw, AlertCircle } from 'lucide-react';

const API_URL = 'https://script.google.com/macros/s/AKfycbweIo6I1uYrgVeqEn7cv_kGmdplp8F0TjZQXobaXfP35G_PeFPAma3vEO641HrjrpU/exec';

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

export default function EventFlowDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchData = async () => {
    try {
      setLoading(true);
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

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

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

  const { config, counts, speakers, attendees, tasks, logs } = data || {};
  const attendanceRate = counts?.registered ? Math.round((counts.attending / counts.registered) * 100) : 0;

  return (
    <div className="min-h-screen bg-gray-50">
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
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <RefreshCw className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

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

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">체크리스트</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">작업</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">담당</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">마감</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">상태</th>
                </tr>
              </thead>
              <tbody>
                {tasks?.map((t, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{t.task}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{t.owner}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">{t.deadline}</td>
                    <td className="py-3 px-4">
                      <StatusBadge status={t.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">실행 로그</h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">시각</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">액션</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">상태</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">메시지</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">건수</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">사용자</th>
                </tr>
              </thead>
              <tbody>
                {logs?.map((log, i) => (
                  <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-500">{log.ts}</td>
                    <td className="py-3 px-4 text-sm text-gray-900">{log.action}</td>
                    <td className="py-3 px-4">
                      <span className={`text-sm font-medium ${log.status === 'OK' ? 'text-green-600' : 'text-red-600'}`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-gray-600">{log.message}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{log.count}</td>
                    <td className="py-3 px-4 text-sm text-gray-500">{log.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}