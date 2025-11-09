// src/apiClient.jsx (새로 생성)

// Vercel 환경 변수에서 URL을 가져옵니다.
// React 환경에서는 보통 VITE_ 접두사를 사용하지만, Vercel에서는 NEXT_PUBLIC_ 접두사도 호환됩니다.
const GAS_API_URL = process.env.NEXT_PUBLIC_GAS_API_URL || import.meta.env.VITE_GAS_API_URL;

/**
 * 범용 API 호출 함수
 */
export async function callApi(payload) {
    if (!GAS_API_URL) {
        throw new Error("API URL이 설정되지 않았습니다.");
    }
    
    const response = await fetch(GAS_API_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
    });

    const data = await response.json();
    
    if (data.ok === false) {
        // GAS 백엔드에서 발생한 오류 처리
        throw new Error(data.error || '백엔드 처리 오류');
    }

    return data;
}


/**
 * [액션 함수]: 새로운 행사 생성 API 호출
 */
export async function createEvent(eventData) {
    
    const payload = {
        action: 'create_event', // 👈 GAS doPost 함수의 스위치 문과 일치
        eventTitle: eventData.eventTitle,
        location: eventData.location,
        // UI에서 받은 날짜 배열을 그대로 사용 (ISO String으로 넘어온다고 가정)
        dates: eventData.dates, 
        initialSpeakers: eventData.initialSpeakers,
    };
    
    return callApi(payload); 
}

/**
 * [액션 함수]: 대시보드 요약 데이터 읽기 (기존 함수 대체)
 */
export async function getSummaryData() {
    return callApi({ action: 'get_summary_data' });
}

// ... (다른 액션 함수들: sendSpeakerInvites, lockOnFirstSpeakerConfirm 등도 여기에 추가)