// src/OcrService.js
import { GoogleGenerativeAI } from "@google/generative-ai";

// 💡 .env 파일에 저장된 키를 안전하게 로드합니다. (깃허브 노출 방지)
const API_KEY = import.meta.env.VITE_GEMINI_API_KEY; 
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });

const fileToGenerativePart = async (file) => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      resolve({ inlineData: { data: reader.result.split(',')[1], mimeType: file.type } });
    };
    reader.readAsDataURL(file);
  });
};

export const analyzeTimetableImage = async (imageFile, retryCount = 3) => {
  if (!API_KEY) {
    throw new Error("VITE_GEMINI_API_KEY가 설정되지 않았습니다. .env 파일을 확인해주세요.");
  }

  const imagePart = await fileToGenerativePart(imageFile);
  const prompt = `
      너는 대학교 시간표를 완벽하게 분석하는 AI야. 첨부된 이미지는 '에브리타임' 앱의 시간표야.
      수업 블록 안에는 과목명과 건물명(예: 810관, 801관 등)이 적혀 있어.

      [🔥 핵심 절대 규칙 : 칸(Cell) 내부 위치 기반 시간 계산법]
      시간표 맨 왼쪽의 숫자(9, 10, 11, 12, 1, 2, 3...)는 단순한 선이 아니라, 1시간짜리 '칸(Row)'을 의미해.
      오후 숫자(1, 2, 3...)는 무조건 +12를 해서 13:00, 14:00, 15:00으로 계산해.

      1. 숫자 'X'가 적힌 칸(Row)의 시간 규칙:
         - 그 칸의 '맨 위쪽 선' = X:00 (정각)
         - 그 칸의 '정중앙(절반)' = X:30 (30분)

      [🚨 100% 강제 적용 규칙: 분 단위 고정]
      - 시작 시간과 종료 시간의 '분(minute)' 값은 무조건 "00" 아니면 "30"으로만 출력해!
      - 이미지가 애매해 보이더라도 "15", "20", "45", "50" 같은 숫자는 절대 사용 금지.
      - 블록이 선에 가까우면 "00", 중간에 가까우면 무조건 "30"으로 맞춰.

      2. 시작 시간 공식: 블록의 '상단'이 숫자 칸 안에서 어디에 위치하는지 봐.
         (예: '11'이 적힌 칸의 정중앙에서 시작하면 -> 11:30)
         (예: '1'이 적힌 칸의 맨 위쪽 선에서 시작하면 -> 13:00)

      3. 종료 시간 공식: 블록의 '하단'이 숫자 칸 안에서 어디에 위치하는지 봐.
         (예: '2'가 적힌 칸의 정중앙에서 끝나면 -> 14:30)

      [추가 규칙]
      - 과목명에 적힌 괄호 내용(예: 영어A강의)은 무조건 지우고 핵심 과목명만 적어.
      - 건물명이 안 적혀있으면 "building": "" 처럼 빈 문자열로 둬.

      결과는 무조건 아래 JSON 배열 형태로만 출력하고, 마크다운 코드블록이나 다른 말은 절대 덧붙이지 마.
      [
        { "day": "월", "subject": "과목명", "startTime": "09:30", "endTime": "12:30", "building": "810관" }
      ]
    `;

  for (let i = 0; i < retryCount; i++) {
    try {
      const result = await model.generateContent([prompt, imagePart]);
      const response = await result.response;
      let text = response.text().replace(/```json/g, '').replace(/```/g, '').trim();
      return JSON.parse(text);
    } catch (error) {
      console.warn(`API 호출 실패 (시도 ${i + 1}/${retryCount}):`, error.message);
      if (i < retryCount - 1) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      } else {
        throw new Error("구글 서버가 바쁩니다. 잠시 후 다시 시도해 주세요.");
      }
    }
  }
};