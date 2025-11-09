// src/components/EventCreationModal.jsx (최종 코드)
import React, { useState } from 'react';
import { RefreshCw } from 'lucide-react';

const initialSpeaker = { name: '', email: '' };

// 1. URL을 prop으로 받는 API 호출 함수로 변경
const createEventAPI = async (apiUrl, payload) => {
    const finalPayload = { 
        action: 'create_event', 
        ...payload 
    };
    
    const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(finalPayload),
    });
    
    return response.json(); 
};


// 2. 컴포넌트 정의 시 apiUrl prop 추가
// (App.jsx에서 API_URL을 전달받습니다.)
const EventCreationModal = ({ isOpen, onClose, onEventCreated, apiUrl }) => { 
    const [formState, setFormState] = useState({
        eventTitle: '',
        location: '',
        dates: ['', ''],
        initialSpeakers: [initialSpeaker],
    });
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    if (!isOpen) return null;

    // --- 핸들러 함수 ---
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormState(prev => ({ ...prev, [name]: value }));
    };

    const handleDateChange = (index, value) => {
        const newDates = [...formState.dates];
        newDates[index] = value;
        setFormState(prev => ({ ...prev, dates: newDates }));
    };

    const handleSpeakerChange = (index, field, value) => {
        const newSpeakers = [...formState.initialSpeakers];
        newSpeakers[index][field] = value;
        setFormState(prev => ({ ...prev, initialSpeakers: newSpeakers }));
    };

    const addSpeaker = () => {
        setFormState(prev => ({ 
            ...prev, 
            initialSpeakers: [...prev.initialSpeakers, { name: '', email: '' }] // 빈 객체 추가
        }));
    };
    // ---

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setIsLoading(true);

        const { eventTitle, location, dates, initialSpeakers } = formState;

        // 유효성 검사 및 데이터 정제
        const validDates = dates.filter(d => d);
        if (!eventTitle || validDates.length === 0) {
            setError('행사 제목과 후보 날짜(최소 1개)를 입력해주세요.');
            setIsLoading(false);
            return;
        }
        const validSpeakers = initialSpeakers.filter(s => s.email && s.name);
        const isoDates = validDates.map(dateStr => new Date(dateStr).toISOString());

        try {
            // API 호출 시 apiUrl prop 전달
            const result = await createEventAPI(apiUrl, { 
                eventTitle,
                location,
                dates: isoDates,
                initialSpeakers: validSpeakers,
            });
            
            if (result.ok) {
                alert(`✅ ${result.message || '행사 생성 완료'}`);
                onEventCreated(); 
            } else {
                alert(`❌ ${result.error || '생성 실패: 백엔드 오류'}`);
                setError(`생성 실패: ${result.error || '백엔드 오류'}`);
            }

        } catch (error) {
            alert(`❌ 통신 오류: ${error.message}`);
            setError(`통신 오류: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
            <div className="bg-white p-6 rounded-lg w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold mb-4">🚀 새 행사 생성</h2>
                
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && <p className="text-red-500 bg-red-100 p-2 rounded text-sm">{error}</p>}
                    
                    {/* 행사 기본 정보 */}
                    <label className="block text-sm font-medium text-gray-700">행사 주제:
                        <input name="eventTitle" value={formState.eventTitle} onChange={handleInputChange} required className="w-full p-2 border border-gray-300 rounded-md mt-1" />
                    </label>
                    <label className="block text-sm font-medium text-gray-700">장소:
                        <input name="location" value={formState.location} onChange={handleInputChange} className="w-full p-2 border border-gray-300 rounded-md mt-1" />
                    </label>

                    {/* 후보 날짜 입력 */}
                    <div className="grid grid-cols-2 gap-4">
                        <label className="block text-sm font-medium text-gray-700">후보 날짜 1 (필수):
                            <input type="datetime-local" value={formState.dates[0]} onChange={(e) => handleDateChange(0, e.target.value)} required className="w-full p-2 border border-gray-300 rounded-md mt-1" />
                        </label>
                        <label className="block text-sm font-medium text-gray-700">후보 날짜 2 (선택):
                            <input type="datetime-local" value={formState.dates[1]} onChange={(e) => handleDateChange(1, e.target.value)} className="w-full p-2 border border-gray-300 rounded-md mt-1" />
                        </label>
                    </div>
                    
                    {/* 초기 강사 목록 입력 */}
                    <h4 className="font-semibold pt-2 text-gray-700">초기 강사 목록 (가등록)</h4>
                    {formState.initialSpeakers.map((speaker, index) => (
                        <div key={index} className="flex gap-2 mb-2">
                            <input type="text" placeholder="이름" value={speaker.name} onChange={(e) => handleSpeakerChange(index, 'name', e.target.value)} className="w-1/3 p-2 border rounded-md" />
                            <input type="email" placeholder="이메일 (필수)" value={speaker.email} onChange={(e) => handleSpeakerChange(index, 'email', e.target.value)} required={!!speaker.name || index === 0} className="w-2/3 p-2 border rounded-md" />
                        </div>
                    ))}
                    <button type="button" onClick={addSpeaker} className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                        + 강사 추가
                    </button>

                    {/* 버튼 그룹 */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 mt-4">
                        <button type="button" onClick={onClose} disabled={isLoading} className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50">
                            취소
                        </button>
                        <button type="submit" disabled={isLoading} className="flex items-center gap-2 px-4 py-2 text-white bg-indigo-600 rounded-lg hover:bg-indigo-700 disabled:opacity-50">
                            {isLoading && <RefreshCw className="w-4 h-4 animate-spin" />}
                            {!isLoading ? '행사 생성 및 초기 설정' : '생성 중...'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default EventCreationModal;