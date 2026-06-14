import React, { useState } from 'react';
import Papa from 'papaparse'; 
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebase"; // Step 2에서 만든 firebase 연동 파일

export default function UploadData() {
  const [status, setStatus] = useState("대기 중...");

  // 1. 도보 시간 CSV (1,000줄) 업로드 함수
  const handleCsvUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setStatus("CSV 파일 읽는 중...");
    Papa.parse(file, {
      header: true, // 첫 줄(출발지, 도착지 등)을 키(Key)값으로 사용
      skipEmptyLines: true,
      complete: async (results) => {
        setStatus("파이어베이스로 전송 시작... (약 10~20초 소요)");
        const rows = results.data;

        try {
          for (const row of rows) {
            const start = row['출발지'];
            const end = row['도착지'];
            const time = Number(row['소요시간(분)']); // 문자열을 숫자로 변환

            if (start && end) {
              // 'buildings' 컬렉션에 출발지 이름으로 문서 지정
              const buildingRef = doc(db, "buildings", start);

              // merge: true 를 쓰면 기존 출발지 데이터가 삭제되지 않고, 새 도착지 시간이 옆에 계속 추가(병합)됩니다!
              await setDoc(buildingRef, {
                name: start,
                walkingTimes: {
                  [end]: time
                }
              }, { merge: true });
            }
          }
          setStatus("✅ 도보 시간 1,000개 데이터 전송 완벽 성공!");
        } catch (error) {
          console.error(error);
          setStatus("❌ 전송 중 오류 발생: 브라우저 콘솔을 확인하세요.");
        }
      }
    });
  };

  // 2. 식당 정보 + 메뉴 JSON 데이터 업로드 함수
  const handleRestaurantUpload = async () => {
    setStatus("식당 데이터 전송 시작...");
    // 엑셀로 주신 내용을 바탕으로 구조화한 데이터
    const restaurantDB = [
      { id: 2, name: "도앞토", category: "토스트/카페", rating: 4.4, reviews: 87, location: "학내", cookTime: 5, waitTime: 2, isPlanB: true, 
        menus: [{ id: 'm1', name: "햄치즈토스트", price: 3500 }, { id: 'm2', name: "베이컨에그토스트", price: 4000 }, { id: 'm3', name: "불고기토스트", price: 4500 }, { id: 'm4', name: "더블치즈토스트", price: 4800 }, { id: 'm5', name: "아메리카노", price: 3000 }] },
      { id: 3, name: "맘스터치", category: "패스트푸드", rating: 4.5, reviews: 324, location: "내리 상권", cookTime: 10, waitTime: 4, isPlanB: true, 
        menus: [{ id: 'm6', name: "싸이버거 단품", price: 4600 }, { id: 'm7', name: "싸이버거 세트", price: 6900 }, { id: 'm8', name: "화이트갈릭버거 세트", price: 7500 }] },
      { id: 19, name: "면식당", category: "일식/면류", rating: 4.2, reviews: 156, location: "한경대 (대중교통)", cookTime: 9, waitTime: 5, isPlanB: false, 
        menus: [{ id: 'm9', name: "돈코츠라멘", price: 8500 }, { id: 'm10', name: "마제소바", price: 8900 }, { id: 'm11', name: "냉소바", price: 8000 }] }
    ];

    try {
      for (const rest of restaurantDB) {
        // 식당 이름을 문서 ID로 지정하여 업로드
        const restRef = doc(db, "restaurants", rest.name);
        await setDoc(restRef, rest);
      }
      setStatus("✅ 식당 및 메뉴 데이터 전송 성공!");
    } catch (error) {
      console.error(error);
      setStatus("❌ 식당 전송 오류 발생");
    }
  };

  return (
    <div className="p-5 bg-blue-50 border-2 border-dashed border-blue-400 rounded-xl my-5 z-50 relative">
      <h3 className="font-extrabold text-lg mb-2 text-blue-900">🛠️ 관리자용 DB 업로더</h3>
      <p className="text-sm mb-4 text-red-600 font-bold bg-white p-2 rounded inline-block shadow-sm">현재 상태: {status}</p>

      <div className="space-y-4">
        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm font-bold mb-2">1. 도보 시간 CSV (cau_davinci_walking_times.csv) 선택</p>
          <input type="file" accept=".csv" onChange={handleCsvUpload} className="text-sm w-full" />
        </div>

        <div className="bg-white p-4 rounded-xl shadow-sm border">
          <p className="text-sm font-bold mb-2">2. 식당 & 메뉴 데이터 (JSON) 업로드</p>
          <button onClick={handleRestaurantUpload} className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg font-bold">
            식당 데이터 파이어베이스로 쏘기 ➔
          </button>
        </div>
      </div>
    </div>
  );
}