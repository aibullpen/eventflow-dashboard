// App.jsx (최종 오류 방지 수정 버전)

// ... (모든 import 및 API_URL 정의 유지)

export default function EventFlowDashboard() {
    // ... (기존 data, loading, error, actionLoading, fetchData, executeAction 함수 유지)

    const [isModalOpen, setIsModalOpen] = useState(false); // 👈 모달 상태 추가

    // ... (handleEventCreated 함수 유지)
    // ... (useEffect, 로딩/에러 화면 렌더링 유지)


    // 🐛 버그 방지: 데이터 파괴는 로딩/에러 체크가 끝난 후에 실행합니다.
    const { config, counts, speakers, attendees, tasks, logs } = data || {}; 

    // 🐛 안전한 참조를 위해, data가 없을 경우 0을 반환하도록 합니다.
    const attendanceRate = counts?.registered ? Math.round((counts.attending / counts.registered) * 100) : 0;
    
    // 📌 로딩/에러 화면 (이 부분은 config에 접근하지 않으므로 안전합니다)
    if (loading && !data) {
        // ... (로딩 JSX 반환)
    }
    if (error && !data) {
        // ... (에러 JSX 반환)
    }


    return (
        <div className="min-h-screen bg-gray-50">
            {/* ... (기존 구조 유지) ... */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center justify-between">
                        <div>
                            {/* 📌 안전한 참조: data가 null이면 config도 null이므로 ?. 사용 */}
                            <h1 className="text-2xl font-semibold text-gray-900">
                                {config?.title || 'EventFlow'}
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                {config?.confirmedDatetime || '일정 미확정'} · {config?.location || '장소 미정'}
                            </p>
                        </div>
                        
                        {/* ... (버튼 섹션 유지) ... */}
                    </div>
                    {/* ... (StatCard 및 Attendance Rate 렌더링 유지) ... */}
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* 📌 주의: data가 null일 경우 speakers?.map()처럼 반드시 ?. 사용 */}
                {/* ... (작업 실행, 강사, 참석자, 체크리스트, 로그 섹션 유지) ... */}
            </div>
            
            <EventCreationModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onEventCreated={handleEventCreated}
                apiUrl={API_URL} 
            />
        </div>
    );
}