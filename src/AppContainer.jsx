import React, { useState, useEffect } from 'react';
import { Calendar, Users, CheckSquare, Send, Clock, Heart, RefreshCw, AlertCircle, Mail, UserCheck, CalendarCheck } from 'lucide-react';

const API_URL = 'https://script.google.com/macros/s/AKfycbweIo6I1uYrgVeqEn7cv_kGmdplp8F0TjZQXobaXfP35G_PeFPAma3vEO641HrjrpU/exec';

export default function EventFlowDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');

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
      setError('서버 연결 실패');
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
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
        <div style={{ textAlign: 'center' }}>
          <RefreshCw style={{ width: '32px', height: '32px', margin: '0 auto 8px', color: '#3b82f6', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: '#6b7280' }}>로딩 중...</p>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb', padding: '16px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #fecaca', padding: '24px', maxWidth: '400px' }}>
          <AlertCircle style={{ width: '32px', height: '32px', margin: '0 auto 8px', color: '#ef4444' }} />
          <p style={{ color: '#dc2626', textAlign: 'center' }}>{error}</p>
          <button 
            onClick={fetchData}
            style={{ marginTop: '16px', width: '100%', padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', borderRadius: '8px', border: 'none', cursor: 'pointer' }}
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
    <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}>
      {/* Header */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb', padding: '24px 0' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
            <div>
              <h1 style={{ fontSize: '28px', fontWeight: '600', color: '#111827', margin: '0 0 8px 0' }}>
                {config?.title || 'EventFlow'}
              </h1>
              <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>
                {config?.confirmedDatetime || '일정 미확정'} · {config?.location || '장소 미정'}
              </p>
            </div>
            <button
              onClick={fetchData}
              disabled={loading}
              style={{ padding: '8px', backgroundColor: 'transparent', border: 'none', borderRadius: '8px', cursor: 'pointer' }}
            >
              <RefreshCw style={{ width: '20px', height: '20px', color: '#6b7280' }} />
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <StatCard icon={Users} label="등록" value={counts?.registered || 0} />
            <StatCard icon={CheckSquare} label="참석 확정" value={counts?.attending || 0} color="green" />
            <StatCard icon={Send} label="초대 발송" value={counts?.invited || 0} />
            <StatCard icon={Clock} label="할일" value={`${counts?.tasksOpen || 0}/${counts?.tasksTotal || 0}`} />
          </div>

          {/* Progress */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '8px' }}>
              <span style={{ color: '#6b7280' }}>참석률</span>
              <span style={{ fontWeight: '600', color: '#111827' }}>{attendanceRate}%</span>
            </div>
            <div style={{ width: '100%', backgroundColor: '#e5e7eb', borderRadius: '4px', height: '8px', overflow: 'hidden' }}>
              <div style={{ height: '100%', backgroundColor: '#3b82f6', width: `${attendanceRate}%`, transition: 'width 0.3s' }} />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ backgroundColor: 'white', borderBottom: '1px solid #e5e7eb' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 16px', display: 'flex', gap: '8px' }}>
          <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>개요</TabButton>
          <TabButton active={activeTab === 'speakers'} onClick={() => setActiveTab('speakers')}>강사</TabButton>
          <TabButton active={activeTab === 'attendees'} onClick={() => setActiveTab('attendees')}>참석자</TabButton>
          <TabButton active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')}>체크리스트</TabButton>
          <TabButton active={activeTab === 'logs'} onClick={() => setActiveTab('logs')}>로그</TabButton>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '24px 16px' }}>
        {activeTab === 'overview' && (
          <div>
            {/* Actions */}
            <Card title="작업 실행">
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                <ActionButton onClick={() => executeAction('sendSpeakerInvites', '강사 초대메일')} loading={actionLoading === 'sendSpeakerInvites'} icon={Mail}>강사 초대</ActionButton>
                <ActionButton onClick={() => executeAction('confirmFirstSpeaker', '강사 응답확정')} loading={actionLoading === 'confirmFirstSpeaker'} icon={UserCheck}>강사 확정</ActionButton>
                <ActionButton onClick={() => executeAction('createCalendar', '캘린더 생성')} loading={actionLoading === 'createCalendar'} icon={CalendarCheck}>캘린더 생성</ActionButton>
                <ActionButton onClick={() => executeAction('sendAttendeeInvites', '참석자 초대')} loading={actionLoading === 'sendAttendeeInvites'} icon={Users}>참석자 초대</ActionButton>
                <ActionButton onClick={() => executeAction('remindD1', 'D-1 리마인드')} loading={actionLoading === 'remindD1'} icon={Clock}>D-1 리마인드</ActionButton>
                <ActionButton onClick={() => executeAction('sendThanks', '감사메일')} loading={actionLoading === 'sendThanks'} icon={Heart}>감사메일</ActionButton>
              </div>
            </Card>

            {/* Quick Overview */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginTop: '16px' }}>
              <Card title="강사">
                {speakers?.slice(0, 3).map((s, i) => (
                  <div key={i} style={{ padding: '12px 0', borderBottom: i < 2 ? '1px solid #f3f4f6' : 'none' }}>
                    <div style={{ fontWeight: '500', color: '#111827' }}>{s.name}</div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>{s.email}</div>
                    <StatusBadge status={s.status} />
                  </div>
                ))}
              </Card>

              <Card title="최근 참석자">
                {attendees?.slice(0, 3).map((a, i) => (
                  <div key={i} style={{ padding: '12px 0', borderBottom: i < 2 ? '1px solid #f3f4f6' : 'none' }}>
                    <div style={{ fontWeight: '500', color: '#111827' }}>{a.name}</div>
                    <div style={{ fontSize: '13px', color: '#6b7280', marginTop: '4px' }}>{a.email}</div>
                    <RsvpBadge rsvp={a.rsvp} />
                  </div>
                ))}
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'speakers' && (
          <Card title="강사 목록">
            <SimpleTable headers={['이름', '이메일', '상태', '확정시간', '주제']}>
              {speakers?.map((s, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px', fontWeight: '500' }}>{s.name}</td>
                  <td style={{ padding: '12px', color: '#6b7280' }}>{s.email}</td>
                  <td style={{ padding: '12px' }}><StatusBadge status={s.status} /></td>
                  <td style={{ padding: '12px', color: '#6b7280', fontSize: '13px' }}>{s.confirmedAt}</td>
                  <td style={{ padding: '12px', color: '#6b7280' }}>{s.topic}</td>
                </tr>
              ))}
            </SimpleTable>
          </Card>
        )}

        {activeTab === 'attendees' && (
          <Card title="참석자 목록">
            <SimpleTable headers={['이름', '이메일', 'RSVP', '상태', '응답시각']}>
              {attendees?.map((a, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px', fontWeight: '500' }}>{a.name}</td>
                  <td style={{ padding: '12px', color: '#6b7280' }}>{a.email}</td>
                  <td style={{ padding: '12px' }}><RsvpBadge rsvp={a.rsvp} /></td>
                  <td style={{ padding: '12px', fontSize: '13px' }}>{a.status}</td>
                  <td style={{ padding: '12px', color: '#6b7280', fontSize: '13px' }}>{a.ts}</td>
                </tr>
              ))}
            </SimpleTable>
          </Card>
        )}

        {activeTab === 'tasks' && (
          <Card title="체크리스트">
            <SimpleTable headers={['작업', '담당', '마감', '상태']}>
              {tasks?.map((t, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px', fontWeight: '500' }}>{t.task}</td>
                  <td style={{ padding: '12px', color: '#6b7280' }}>{t.owner}</td>
                  <td style={{ padding: '12px', color: '#6b7280', fontSize: '13px' }}>{t.deadline}</td>
                  <td style={{ padding: '12px' }}><StatusBadge status={t.status} /></td>
                </tr>
              ))}
            </SimpleTable>
          </Card>
        )}

        {activeTab === 'logs' && (
          <Card title="실행 로그">
            <SimpleTable headers={['시각', '액션', '상태', '메시지']}>
              {logs?.map((log, i) => (
                <tr key={i} style={{ borderBottom: '1px solid #f3f4f6' }}>
                  <td style={{ padding: '12px', fontSize: '13px', color: '#6b7280' }}>{log.ts}</td>
                  <td style={{ padding: '12px', fontWeight: '500' }}>{log.action}</td>
                  <td style={{ padding: '12px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: log.status === 'OK' ? '#16a34a' : '#dc2626' }}>
                      {log.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px', color: '#6b7280', fontSize: '13px' }}>{log.message}</td>
                </tr>
              ))}
            </SimpleTable>
          </Card>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color = 'blue' }) {
  const colors = {
    blue: { bg: '#eff6ff', text: '#2563eb' },
    green: { bg: '#f0fdf4', text: '#16a34a' },
  };
  const c = colors[color];

  return (
    <div style={{ backgroundColor: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <p style={{ fontSize: '13px', color: '#6b7280', margin: '0 0 8px 0' }}>{label}</p>
          <p style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: 0 }}>{value}</p>
        </div>
        <div style={{ padding: '12px', borderRadius: '10px', backgroundColor: c.bg }}>
          <Icon style={{ width: '24px', height: '24px', color: c.text }} />
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '12px 20px',
        backgroundColor: 'transparent',
        border: 'none',
        borderBottom: active ? '2px solid #3b82f6' : '2px solid transparent',
        color: active ? '#3b82f6' : '#6b7280',
        fontWeight: active ? '600' : '500',
        cursor: 'pointer',
        fontSize: '14px'
      }}
    >
      {children}
    </button>
  );
}

function Card({ title, children }) {
  return (
    <div style={{ backgroundColor: 'white', borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', border: '1px solid #e5e7eb', padding: '24px' }}>
      {title && <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#111827', margin: '0 0 20px 0' }}>{title}</h2>}
      {children}
    </div>
  );
}

function ActionButton({ onClick, loading, icon: Icon, children }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        padding: '12px 16px',
        backgroundColor: 'white',
        border: '1px solid #d1d5db',
        borderRadius: '8px',
        cursor: loading ? 'not-allowed' : 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151',
        opacity: loading ? 0.6 : 1,
        transition: 'all 0.2s'
      }}
      onMouseOver={(e) => !loading && (e.currentTarget.style.backgroundColor = '#f9fafb')}
      onMouseOut={(e) => (e.currentTarget.style.backgroundColor = 'white')}
    >
      {loading ? <RefreshCw style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} /> : <Icon style={{ width: '16px', height: '16px' }} />}
      {children}
    </button>
  );
}

function StatusBadge({ status }) {
  const colors = {
    'CONFIRMED': { bg: '#dcfce7', text: '#166534' },
    'RESPONDED': { bg: '#dbeafe', text: '#1e40af' },
    'INVITED': { bg: '#fef3c7', text: '#92400e' },
    'DONE': { bg: '#dcfce7', text: '#166534' },
    'REGISTERED': { bg: '#f3f4f6', text: '#374151' },
  };
  const c = colors[status] || colors['REGISTERED'];

  return (
    <span style={{ display: 'inline-block', padding: '4px 10px', fontSize: '12px', fontWeight: '600', borderRadius: '12px', backgroundColor: c.bg, color: c.text }}>
      {status}
    </span>
  );
}

function RsvpBadge({ rsvp }) {
  const isAttending = /참석|참가|yes|y|true|1/i.test(String(rsvp || ''));
  const c = isAttending ? { bg: '#dcfce7', text: '#166534' } : { bg: '#fee2e2', text: '#991b1b' };

  return (
    <span style={{ display: 'inline-block', padding: '4px 10px', fontSize: '12px', fontWeight: '600', borderRadius: '12px', backgroundColor: c.bg, color: c.text }}>
      {rsvp || '-'}
    </span>
  );
}

function SimpleTable({ headers, children }) {
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
            {headers.map((h, i) => (
              <th key={i} style={{ padding: '12px', textAlign: 'left', fontSize: '13px', fontWeight: '600', color: '#6b7280' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
    </div>
  );
}