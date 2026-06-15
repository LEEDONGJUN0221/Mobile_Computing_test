import React, { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, serverTimestamp } from "firebase/firestore";
import { db } from "./firebase";
import { analyzeTimetableImage } from './OcrService';
import gapbiteLogo from './assets/gapbite_logo.png';
import gapbiteLogo2 from './assets/gapbite_logo2.png';


const LogoIcon = ({ size = 'md', isWhite = false, className = '' }) => {
  const sizeClasses = { sm: 'w-6 h-6', md: 'w-8 h-8', lg: 'w-16 h-16' };
  return (
    <div className={`${sizeClasses[size]} ${className} relative flex items-center justify-center shrink-0`}>
      <svg viewBox="0 0 100 100" className={`w-full h-full fill-current ${isWhite ? 'text-white' : 'text-[#FF7A00]'}`}>
        <defs>
          <mask id="bite-mask">
            <rect x="0" y="0" width="100" height="100" fill="white" />
            <circle cx="85" cy="40" r="26" fill="black" />
          </mask>
        </defs>
        <circle cx="50" cy="50" r="45" mask="url(#bite-mask)" />
        <circle cx="35" cy="45" r="5" fill={isWhite ? '#FF7A00' : 'white'} />
        <circle cx="55" cy="45" r="5" fill={isWhite ? '#FF7A00' : 'white'} />
        <path d="M35 60 Q45 68 55 60" fill="none" stroke={isWhite ? '#FF7A00' : 'white'} strokeWidth="5" strokeLinecap="round" />
      </svg>
      <div className={`absolute top-1 right-0.5 w-1 h-1 rounded-full ${isWhite ? 'bg-white' : 'bg-[#FF7A00]'} opacity-80`} />
      <div className={`absolute top-3 right-0.5 w-1 h-1 rounded-full ${isWhite ? 'bg-white' : 'bg-[#FF7A00]'} opacity-65`} />
    </div>
  );
};

// ==========================================
// 2. 상태 표시줄 & 홈 인디케이터 (팀 UI 유지)
// ==========================================
const StatusBar = () => (
  <div className="flex justify-between items-center px-5 pt-2 pb-0.5 text-[10px] font-bold select-none z-50 shrink-0 text-[#111827]">
    <span>9:41</span>
    <div className="flex items-center gap-1.5">
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><rect x="2" y="16" width="3" height="4" rx="0.5" /><rect x="7" y="12" width="3" height="8" rx="0.5" /><rect x="12" y="8" width="3" height="12" rx="0.5" /><rect x="17" y="4" width="3" height="16" rx="0.5" /></svg>
      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><path d="M12 21l-8.2-8.2c4.5-4.5 11.9-4.5 16.4 0L12 21z M12 17.2l-4.4-4.4c2.4-2.4 6.4-2.4 8.8 0L12 17.2z M12 13.5l-1.8-1.8c1-1 2.6-1 3.6 0L12 13.5z" /></svg>
      <svg className="w-5 h-3.5" viewBox="0 0 24 24" fill="currentColor"><rect x="1" y="6" width="18" height="12" rx="2" fill="none" stroke="currentColor" strokeWidth="2" /><rect x="3" y="8" width="11" height="8" rx="1" /><path d="M20 10v4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
    </div>
  </div>
);

const HomeIndicator = ({ isDark }) => (
  <div className="absolute bottom-2 inset-x-0 flex justify-center z-50 pointer-events-none pb-1 shrink-0">
    <div className={`w-32 h-1 rounded-full ${isDark ? 'bg-white/40' : 'bg-gray-300'}`} />
  </div>
);

// ==========================================
// 3. 공통 브랜드 헤더 (팀 UI 유지)
// ==========================================
const BrandHeader = ({ showBack = false, onBack = null }) => (
  <div className="flex justify-between items-center px-6 py-3.5 border-b border-[#F2ECE4] bg-white shrink-0">
    <div className="flex items-center gap-2">
      {/* 뒤로 가기 버튼 */}
      {showBack && onBack && (
        <button onClick={onBack} className="p-1 -ml-1 text-[#2E2216] hover:bg-[#FAF8F5] rounded-full transition-colors active:scale-90">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}
      
      {/* 💡 동료분의 진짜 주황색 로고 이미지 적용 */}
      <img
        src={gapbiteLogo2}
        alt="GapBite Logo"
        className="w-6 h-6 object-contain shrink-0"
      />
      
      {/* 앱 이름 */}
      <div className="flex flex-col">
        <span className="font-extrabold text-sm text-[#2E2216] leading-none tracking-tight">GapBite</span>
        <span className="text-[8px] text-[#FF7A00] font-black leading-none mt-0.5">공강한입</span>
      </div>
    </div>
    
    {/* 알림(종 모양) 아이콘 */}
    <div className="flex items-center">
      <button className="text-gray-400 hover:text-[#FF7A00] transition-colors relative p-0.5 active:scale-95">
        <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2.2" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span className="absolute top-0.5 right-0.5 w-1 h-1 bg-[#FF7A00] rounded-full" />
      </button>
    </div>
  </div>
);

const EXCEL_RESTAURANTS = [
  { id: 1, name: '학생회관 식당', location: '학내', walkingMinutes: 11, cookTime: 2, category: '매장 식사', menus: [{ name: '제육덮밥, 돈까스' }], isPlanB: false },
  { id: 2, name: '도앞토', location: '학내', walkingMinutes: 6, cookTime: 5, category: '매장 / 테이크아웃', menus: [{ name: '햄치즈토스트' }], isPlanB: true },
  { id: 3, name: '맘스터치', location: '내리 상권', walkingMinutes: 4, cookTime: 10, category: '매장 / 테이크아웃', menus: [{ name: '싸이버거 세트' }], isPlanB: true },
  { id: 4, name: '김스튜디오', location: '내리 상권', walkingMinutes: 3, cookTime: 10, category: '매장 / 테이크아웃', menus: [{ name: '김밥' }], isPlanB: true },
  { id: 5, name: '내리 편의점', location: '내리 상권', walkingMinutes: 5, cookTime: 2, category: '테이크아웃', menus: [{ name: '도시락, 김밥' }], isPlanB: true },
  { id: 6, name: '하얀집', location: '내리 상권', walkingMinutes: 4, cookTime: 10, category: '매장 식사', menus: [{ name: '김치볶음밥, 돈까스' }], isPlanB: false },
  { id: 7, name: '밀플랜비', location: '내리 상권', walkingMinutes: 5, cookTime: 10, category: '매장 / 테이크아웃', menus: [{ name: '부리또' }], isPlanB: true },
  { id: 8, name: '제임스타코', location: '내리 상권', walkingMinutes: 4, cookTime: 7, category: '매장 / 테이크아웃', menus: [{ name: '타코' }], isPlanB: true },
  { id: 9, name: '명가 교동짬뽕', location: '내리 상권', walkingMinutes: 4, cookTime: 6, category: '매장 / 테이크아웃', menus: [{ name: '교동짬뽕, 짜장면' }], isPlanB: true },
  { id: 10, name: '하루포케', location: '내리 상권', walkingMinutes: 6, cookTime: 5, category: '매장 / 테이크아웃', menus: [{ name: '포케' }], isPlanB: true },
  { id: 11, name: '원조명동찌개마을', location: '내리 상권', walkingMinutes: 6, cookTime: 8, category: '매장 / 테이크아웃', menus: [{ name: '김치찌개, 동태탕' }], isPlanB: true },
  { id: 12, name: '진심감자탕', location: '내리 상권', walkingMinutes: 5, cookTime: 7, category: '매장 / 테이크아웃', menus: [{ name: '감자탕, 뼈찜' }], isPlanB: true },
  { id: 13, name: '감동까쓰', location: '내리 상권', walkingMinutes: 4, cookTime: 10, category: '매장 / 테이크아웃', menus: [{ name: '돈까스, 우동' }], isPlanB: true },
  { id: 14, name: '포응온쌀국수', location: '내리 상권', walkingMinutes: 5, cookTime: 7, category: '매장 / 테이크아웃', menus: [{ name: '쌀국수, 팟타이' }], isPlanB: true },
  { id: 15, name: '롯데리아', location: '내리 상권', walkingMinutes: 8, cookTime: 4, category: '매장 / 테이크아웃', menus: [{ name: '햄버거' }], isPlanB: true },
  { id: 16, name: '마라ZONE마라탕', location: '내리 상권', walkingMinutes: 5, cookTime: 10, category: '매장', menus: [{ name: '마라탕' }], isPlanB: true },
  { id: 17, name: '신전떡볶이', location: '내리 상권', walkingMinutes: 5, cookTime: 8, category: '매장 / 테이크아웃', menus: [{ name: '떡볶이, 김밥' }], isPlanB: true },
  { id: 18, name: '뚜비두밥', location: '내리 상권', walkingMinutes: 7, cookTime: 7, category: '매장', menus: [{ name: '육회덮밥, 카츠동' }], isPlanB: true },
  { id: 19, name: '면식당', location: '한경대', walkingMinutes: 15, cookTime: 9, category: '매장 / 테이크아웃', menus: [{ name: '라멘' }], isPlanB: false },
  { id: 20, name: '보레이 오프리를레', location: '한경대', walkingMinutes: 18, cookTime: 10, category: '매장', menus: [{ name: '파스타' }], isPlanB: false },
  { id: 21, name: '담너머집', location: '한경대', walkingMinutes: 20, cookTime: 8, category: '매장', menus: [{ name: '제육볶음, 돌솥비빔밥' }], isPlanB: false },
  { id: 22, name: '덮밥 좋은날', location: '한경대', walkingMinutes: 15, cookTime: 10, category: '매장 / 테이크아웃', menus: [{ name: '규동, 마제소바' }], isPlanB: false },
  { id: 23, name: '세컨드코너', location: '한경대', walkingMinutes: 20, cookTime: 11, category: '매장 / 테이크아웃', menus: [{ name: '수제버거' }], isPlanB: false },
  { id: 24, name: '안일옥', location: '한경대', walkingMinutes: 19, cookTime: 6, category: '매장', menus: [{ name: '곰탕, 설렁탕' }], isPlanB: false },
  { id: 25, name: '전주24시콩나물국밥', location: '한경대', walkingMinutes: 20, cookTime: 5, category: '매장', menus: [{ name: '콩나물국' }], isPlanB: false },
];

const DETAIL_MENUS = {
  도앞토: [
    { name: '햄치즈토스트', price: 3500 },
    { name: '베이컨에그토스트', price: 4000 },
    { name: '불고기토스트', price: 4500 },
    { name: '더블치즈토스트', price: 4800 },
    { name: '아메리카노', price: 3000 },
    { name: '카페라떼', price: 3500 },
    { name: '아이스티', price: 3500 },
  ],
  맘스터치: [
    { name: '싸이버거', price: 5400 },
    { name: '싸이버거 세트', price: 8900 },
    { name: '화이트갈릭버거', price: 6200 },
    { name: '인크레더블버거', price: 6900 },
    { name: '케이준양념감자', price: 2500 },
    { name: '치즈스틱', price: 2000 },
    { name: '콜라', price: 2000 },
    { name: '치킨텐더 4조각', price: 5500 },
  ],
  면식당: [
    { name: '돈코츠라멘', price: 9500 },
    { name: '매운돈코츠라멘', price: 10000 },
    { name: '차슈라멘', price: 10500 },
    { name: '냉모밀', price: 8000 },
    { name: '규동', price: 9500 },
    { name: '가라아게동', price: 9000 },
    { name: '새우튀김 우동', price: 8500 },
    { name: '교자만두', price: 4500 },
  ],
};


// ==========================================
// 4. 메인 앱 컴포넌트
// ==========================================
export default function MealPlannerApp() {
  const PAGE_TITLE = "text-[21px] font-black text-[#2E2216] leading-tight";
  const PAGE_SUBTITLE = "mt-2 text-[12px] leading-relaxed text-[#7A7570]";

  // 라우팅 및 기본 상태
  const [currentScreen, setCurrentScreen] = useState('ONBOARDING');
  const [previousScreen, setPreviousScreen] = useState('HOME');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState('');

  // 필터 및 팝업 상태
  const [planBFilter, setPlanBFilter] = useState('전체');
  const [restaurantFilter, setRestaurantFilter] = useState('전체');
  const [showFeedback, setShowFeedback] = useState(false);
  const [showPromotion, setShowPromotion] = useState(false);

  // ⭐️ Firebase 및 OCR 통합 상태 ⭐️
  const [dbBuildings, setDbBuildings] = useState({});
  const [dbRestaurants, setDbRestaurants] = useState([]);
  const [dbReviews, setDbReviews] = useState([]);

  const mergedRestaurants = EXCEL_RESTAURANTS.map(base => {
    const dbItem = dbRestaurants.find(
      r => r.name?.trim() === base.name.trim() || String(r.id) === String(base.id)
    );

    return dbItem
      ? {
        ...base,
        ...dbItem,
        name: dbItem.name || base.name,
        location: dbItem.building || dbItem.location || base.location,
        cookTime: dbItem.cookTime ?? base.cookTime,
        category: dbItem.category || base.category,
        menus: dbItem.menus?.length ? dbItem.menus : base.menus,
        isPlanB: dbItem.isPlanB ?? base.isPlanB,
        walkingMinutes: base.walkingMinutes,
      }
      : base;
  });

  const [parsedTimetable, setParsedTimetable] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [selectedReviews, setSelectedReviews] = useState([]);
  const [cartItems, setCartItems] = useState([]);

  const [remainingTime, setRemainingTime] = useState(0);
  const [currentBuilding, setCurrentBuilding] = useState('810관');
  const [nextBuilding, setNextBuilding] = useState('801관');
  const [targetClass, setTargetClass] = useState(null);

  // 파이어베이스 데이터 로드
  useEffect(() => {
    const fetchRealData = async () => {
      try {
        const bSnap = await getDocs(collection(db, "buildings"));
        const tempBuildings = {};
        bSnap.forEach(doc => {
          const data = doc.data();
          tempBuildings[doc.id] = {
            ...(data.walkingTimes || {}),
            geopoint: data.geopoint
          };
        });
        setDbBuildings(tempBuildings);

        const rSnap = await getDocs(collection(db, "restaurants"));
        const tempRestaurants = [];
        rSnap.forEach(doc => { tempRestaurants.push({ id: doc.id, ...doc.data() }); });
        console.log("문서 개수:", rSnap.size);

        rSnap.forEach(doc => {
          console.log("문서 이름:", doc.id);
        });

        setDbRestaurants(tempRestaurants);
        console.log("Firebase 식당 데이터:", tempRestaurants);

        const reviewSnap = await getDocs(collection(db, "reviews"));
        const tempReviews = [];
        reviewSnap.forEach(doc => {
          tempReviews.push({ id: doc.id, ...doc.data() });
        });
        setDbReviews(tempReviews);
        console.log("Firebase 리뷰 데이터:", tempReviews);

      } catch (error) {
        console.error("데이터 로드 실패:", error);
      }
    };
    fetchRealData();
  }, []);

  const navigate = (screen) => {
    setPreviousScreen(currentScreen);
    if (screen === 'HOME' || screen === 'ONBOARDING') {
      setPlanBFilter('전체');
      setRestaurantFilter('전체');
    }
    setCurrentScreen(screen);
  };

  useEffect(() => {
    if (currentScreen === 'ROUTE') {
      setShowFeedback(false);
      setShowPromotion(false);

      if (window.kakao && window.kakao.maps) {
        window.kakao.maps.load(() => {
          const container = document.getElementById('kakao-map');
          if (!container) return;

          const eLat = selectedRestaurant?.geopoint?.latitude || 37.5050;
          const eLng = selectedRestaurant?.geopoint?.longitude || 126.9571;

          const options = {
            center: new window.kakao.maps.LatLng(eLat, eLng),
            level: 3
          };

          const map = new window.kakao.maps.Map(container, options);
          const marker = new window.kakao.maps.Marker({
            position: options.center
          });
          marker.setMap(map);
        });
      }

      const timer = setTimeout(() => {
        setShowFeedback(true);
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [currentScreen, selectedRestaurant]);


  // 실시간 도보 시간 계산기
  const getWalkingTime = (start, end) => {
    if (!start || !end || start === end) return 0;
    if (dbBuildings[start] && dbBuildings[start][end]) return dbBuildings[start][end];
    if (dbBuildings[end] && dbBuildings[end][start]) return dbBuildings[end][start];
    return 5; // 예외 처리 (기본 5분)
  };

  const transitTime = getWalkingTime(currentBuilding, nextBuilding);

  const handleFeedbackSubmit = async (feedbackTitle) => {
    try {
      await addDoc(collection(db, "reviews"), {
        feedback: feedbackTitle,
        gapTime: remainingTime,
        departure: currentBuilding,
        destination: selectedRestaurant?.name || nextBuilding,
        createdAt: serverTimestamp()
      });

      setShowFeedback(false);
      setShowPromotion(true);
    } catch (error) {
      console.error("리뷰 DB 저장 중 에러:", error);
      setShowFeedback(false);
      setShowPromotion(true);
    }
  };

  // UI 렌더링에 맞게 Firebase 데이터를 가공
  const normalizeRestaurants = (isPlanBTarget) => {
    return dbRestaurants
      .filter(r => (isPlanBTarget ? r.isPlanB : !r.isPlanB))
      .map(r => ({
        id: r.id,
        name: r.name,
        geopoint: r.geopoint,
        location: r.building || r.location || '알 수 없음',
        travelTime: getWalkingTime(currentBuilding, r.building || r.location),
        prepTime: r.cookTime || 5,
        type: r.category || '매장/포장',
        menu: r.menus?.[0]?.name || r.menu || '메뉴',
        rating: r.rating || 4.5,
        waitTime: r.waitTime || 0
      }));
  };

  // 공통 이모지 매퍼
  const getFoodEmoji = (menu) => {
    if (!menu) return '🍱';
    if (menu.includes('토스트')) return '🍞';
    if (menu.includes('버거') || menu.includes('롯데리아')) return '🍔';
    if (menu.includes('김밥') || menu.includes('도시락')) return '🍙';
    if (menu.includes('부리또') || menu.includes('타코')) return '🌯';
    if (menu.includes('짬뽕') || menu.includes('짜장면') || menu.includes('마라탕')) return '🍜';
    if (menu.includes('포케')) return '🥗';
    if (menu.includes('찌개') || menu.includes('감자탕') || menu.includes('국밥')) return '🍲';
    if (menu.includes('돈까스') || menu.includes('우동')) return '🍛';
    if (menu.includes('파스타')) return '🍝';
    return '🍱';
  };

  // --------------------------------------
  // A. ONBOARDING
  // --------------------------------------
  // --------------------------------------
  // A. ONBOARDING
  // --------------------------------------
  const renderOnboarding = () => (
    <div className="h-full flex flex-col justify-between p-6 text-center text-white bg-gradient-to-br from-[#FF9533] via-[#FF7A00] to-[#E65C00] relative overflow-hidden animate-fade-in">
      <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/10 rounded-full blur-2xl" />
      <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white/10 rounded-full blur-2xl" />
      <div className="h-4" />
      <div className="flex-grow flex flex-col items-center justify-center my-auto">
        
        {/* 💡 로고 애니메이션(animate-bounce)과 그림자 효과(drop-shadow-2xl) 적용 */}
        <div className="mx-auto mb-6 w-[105px] h-[105px] flex items-center justify-center animate-bounce drop-shadow-2xl">
          <img src={gapbiteLogo} alt="GapBite Logo" className="w-full h-full object-contain" />
        </div>
        
        <div className="relative -top-4 mb-8 flex flex-col items-center">
          <h1 className="text-3xl font-black tracking-tight mb-5 font-sans text-white">GapBite</h1>
          <span className="bg-white/20 backdrop-blur-md px-5 py-1.5 rounded-full text-[12px] font-extrabold tracking-widest border border-white/30 shadow-inner">
            공강한입
          </span>
        </div>
        <p className="text-sm font-medium opacity-90 leading-relaxed max-w-[280px]">
          공강 시간에 딱 맞는<br />따뜻한 한 끼 식사를 추천해 드릴게요
        </p>
      </div>
      <div className="mb-6 z-10">
        <button
          className="w-full bg-white text-[#FF7A00] py-3.5 px-6 rounded-full font-extrabold text-base shadow-lg hover:bg-orange-50 active:scale-[0.97] transition-all duration-200"
          onClick={() => navigate('OCR_INPUT')}
        >
          시작하기
        </button>
      </div>
    </div>
  );

  // --------------------------------------
  // B. OCR_INPUT (기존 URL_INPUT을 이미지 업로드 폼으로 이식)
  // --------------------------------------
  const renderOcrInput = () => {
    const handleOcrUpload = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      setIsLoading(true);
      setProgress('AI 모델 분석 중...');
      try {
        const rawData = await analyzeTimetableImage(file);
        const mappedData = rawData.map((item, index) => ({ id: index + 1, ...item }));
        setParsedTimetable(mappedData);
        setIsLoading(false);
        navigate('EDIT_TIMETABLE');
      } catch (error) {
        console.error("OCR 분석 실패:", error);
        alert(error.message || "분석에 실패했습니다.");
        setIsLoading(false);
      }
    };

    return (
      <div className="h-full flex flex-col bg-[#FAF8F5] animate-fade-in relative">
        <BrandHeader showBack={true} onBack={() => navigate('ONBOARDING')} />
        <div className="flex-grow pt-[22px] px-6 pb-6 flex flex-col justify-between overflow-y-auto">
          <div className="space-y-5">
            <div>
              <h2 className={PAGE_TITLE}>시간표 이미지 연동</h2>
              <p className={PAGE_SUBTITLE}>에브리타임 캡처본을 올리고 공강 분석을 시작하세요.</p>
            </div>

            <div className="space-y-3 relative">
              <button
                className={`w-full py-4 rounded-xl font-bold text-sm transition-all duration-200 shadow-md ${isLoading ? 'bg-[#EAE5DF] text-[#A69E96]' : 'bg-[#FF7A00] hover:bg-[#E66E00] text-white'
                  }`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4 text-[#A69E96]" viewBox="0 0 24 24" fill="none"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                    {progress}
                  </span>
                ) : '갤러리에서 시간표 사진 선택'}
              </button>
              <input type="file" accept="image/*" onChange={handleOcrUpload} disabled={isLoading} className="absolute top-0 left-0 w-full h-full opacity-0 cursor-pointer" />
            </div>
            <button
              className="w-full py-3 rounded-xl font-bold text-xs bg-[#2E2216] hover:bg-black text-white shadow-md transition-all active:scale-[0.98]"
              onClick={() => {
                setParsedTimetable([
                  {
                    id: 1,
                    day: '목',
                    subject: '모바일 컴퓨팅',
                    startTime: '14:30',
                    endTime: '16:00',
                    building: '801관'
                  }
                ]);

                setTargetClass({
                  name: '모바일 컴퓨팅',
                  hour: 14,
                  minute: 30
                });

                setCurrentBuilding('810관');
                setNextBuilding('801관');
                setRemainingTime(45);

                navigate('HOME');
              }}
            >
              관리자용: 분석 건너뛰고 메인으로
            </button>
          </div>

          <div className="bg-white p-4 border border-[#F2ECE4] rounded-xl text-center shadow-sm mt-4">
            <p className="text-[10px] text-[#7A7570] leading-relaxed">
              💡 에브리타임 앱 &gt; 시간표 화면을 캡처한 후<br />이미지 파일을 업로드해주세요.
            </p>
          </div>
        </div>
      </div>
    );
  };

  // --------------------------------------
  // NEW. EDIT_TIMETABLE (하이브리드 검수 UI - 팀 톤앤매너 완벽 적용)
  // --------------------------------------
  const renderTimetableEdit = () => {
    const handleUpdate = (id, field, value) => {
      setParsedTimetable(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleConfirm = () => {
      // 💡 [발표 시연용 하드코딩] 화요일 10시 30분 기준
      const nowH = 10, nowM = 30;
      const currentDayStr = '화';

      const nextClass = parsedTimetable.find(c => {
        if (c.day !== currentDayStr || !c.startTime) return false;
        const [h, m] = c.startTime.split(':').map(Number);
        return (h > nowH) || (h === nowH && m > nowM);
      });

      if (nextClass) {
        setTargetClass({ 
          name: nextClass.subject, 
          hour: parseInt(nextClass.startTime.split(':')[0]), 
          minute: parseInt(nextClass.startTime.split(':')[1]) 
        });
        setCurrentBuilding("810관");
        setNextBuilding(nextClass.building || "801관");
      } else {
        // 혹시 화요일 시간표 데이터가 없어도 시연이 막히지 않도록 안전장치 세팅
        setTargetClass({ name: '모바일 컴퓨팅', hour: 11, minute: 15 });
        setCurrentBuilding("810관");
        setNextBuilding("801관");
      }

      // 💡 [핵심] 실제 계산을 무시하고, 발표 시연을 위해 무조건 45분으로 고정
      setRemainingTime(45);
      navigate('HOME');
    };

    return (
      <div className="h-full flex flex-col bg-[#FAF8F5] animate-fade-in">
        <BrandHeader showBack={true} onBack={() => navigate('OCR_INPUT')} />
        <div className="flex-grow px-6 pt-5 pb-6 flex flex-col justify-between overflow-hidden">
          <div className="mb-4 shrink-0">
            <h2 className={PAGE_TITLE}>데이터 검수</h2>
            <p className={PAGE_SUBTITLE}>AI가 분석한 결과를 탭하여 수정할 수 있습니다.</p>
          </div>

          <div className="flex-1 overflow-y-auto space-y-3 pb-4 scrollbar-thin">
            {parsedTimetable.map(item => (
              <div key={item.id} className="bg-white border border-[#F2ECE4] p-3.5 rounded-xl shadow-sm focus-within:border-[#FF7A00] transition-colors">
                <div className="flex items-center gap-2 mb-2">
                  <span className="bg-[#FFF4EB] text-[#FF7A00] font-black px-2 py-1 rounded text-xs">{item.day}</span>
                  <input type="text" value={item.subject} onChange={(e) => handleUpdate(item.id, 'subject', e.target.value)}
                    className="font-extrabold text-[#2E2216] text-sm w-full focus:outline-none bg-transparent" />
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <input type="time" value={item.startTime} onChange={(e) => handleUpdate(item.id, 'startTime', e.target.value)} className="bg-[#FAF8F5] border border-[#F2ECE4] rounded px-1 text-[#7A7570]" />
                  <span className="text-[#A69E96]">~</span>
                  <input type="time" value={item.endTime} onChange={(e) => handleUpdate(item.id, 'endTime', e.target.value)} className="bg-[#FAF8F5] border border-[#F2ECE4] rounded px-1 text-[#7A7570]" />
                  <input type="text" value={item.building} placeholder="건물 (예: 810관)" onChange={(e) => handleUpdate(item.id, 'building', e.target.value)}
                    className={`border rounded px-2 w-full ml-1 ${!item.building ? 'border-red-300 bg-red-50' : 'bg-[#FAF8F5] border-[#F2ECE4] text-[#7A7570]'}`} />
                </div>
              </div>
            ))}
          </div>

          <button onClick={handleConfirm} className="w-full bg-[#FF7A00] hover:bg-[#E66E00] text-white py-3.5 rounded-full font-bold text-sm shadow-lg transition-all active:scale-[0.98] mt-2 shrink-0">
            이 시간표로 확정하기
          </button>
        </div>
      </div>
    );
  };

  // --------------------------------------
  // C. HOME (OCR 동기화 반영)
  // --------------------------------------
  const renderHome = () => (
    <div className="h-full flex flex-col bg-[#FAF8F5] animate-fade-in">
      <BrandHeader />
      <div className="flex-grow pt-4 px-6 pb-4 flex flex-col justify-between overflow-hidden">
        <div className="space-y-3">
          <div>
            <h2 className="text-[19px] font-black text-[#2E2216] leading-tight">지금 공강, 어디서 먹을까요?</h2>
            <p className="mt-1 text-[11px] leading-relaxed text-[#7A7570]">수업 시간표와 위치 정보를 기반으로 분석했습니다.</p>
          </div>

          <div className="bg-white border border-[#F2ECE4] rounded-2xl p-3 shadow-sm text-center space-y-1.5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-12 h-12 bg-[#FF7A00]/5 rounded-full -mr-3 -mt-3" />
            <div className="space-y-0.5">
              <span className="text-[9px] font-extrabold text-[#FF7A00] tracking-wider bg-[#FFF4EB] px-2 py-0.5 rounded-full inline-block">남은 공강 시간</span>
              <p className="text-4xl font-black text-[#FF7A00] tracking-tight py-0">{remainingTime}분</p>
            </div>
            <div className="inline-flex items-center justify-center gap-1 bg-[#FAF8F5] border border-[#F2ECE4] px-3 py-0.5 rounded-full text-[10px] font-bold text-[#2E2216] mx-auto">
              <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A00] animate-ping shrink-0" />
              {targetClass ? `${targetClass.hour}:${String(targetClass.minute).padStart(2, '0')} ${targetClass.name} (${nextBuilding})` : '수업 정보 없음'}
            </div>
          </div>

          <div className="bg-white border border-[#F2ECE4] rounded-2xl p-2.5 shadow-sm space-y-2">
            <div className="flex justify-between items-center bg-[#FAF8F5] px-3 py-1.5 rounded-xl border border-[#F2ECE4]">
              <span className="text-[10px] font-bold text-[#7A7570]">현재 내 위치</span>
              <div className="flex items-center gap-0.5 text-[11px] font-extrabold text-[#2E2216]">
                <svg className="w-3 h-3 text-[#FF7A00]" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" /></svg>
                {currentBuilding}
              </div>
            </div>
            <button
              className="w-full bg-[#FF7A00] hover:bg-[#E66E00] text-white py-2 px-4 rounded-full font-bold text-xs shadow-md active:scale-[0.98] transition-all flex items-center justify-center"
              onClick={() => { remainingTime < 30 ? navigate('PLAN_B') : navigate('RESTAURANT_LIST') }}
            >
              맞춤 식당 리스트 보기
            </button>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-[10px] font-extrabold text-[#2E2216] uppercase tracking-wider">빠른 추천 & 서비스</h3>
            <div className="grid grid-cols-2 gap-2">
              <button className="bg-white border border-[#F2ECE4] hover:border-[#FF7A00] p-2.5 rounded-xl flex flex-col justify-between text-left h-[76px] shadow-sm transition-all active:scale-[0.97]" onClick={() => navigate('PLAN_B')}>
                <span className="text-base leading-none">⚡</span>
                <div className="space-y-0.5"><p className="font-extrabold text-[11px] text-[#2E2216] leading-tight">빠른 메뉴 추천</p><p className="text-[8px] text-[#7A7570] font-medium leading-tight">시간이 부족할 때 (Plan B)</p></div>
              </button>
              <button className="bg-white border border-[#F2ECE4] hover:border-[#FF7A00] p-2.5 rounded-xl flex flex-col justify-between text-left h-[76px] shadow-sm transition-all active:scale-[0.97]" onClick={() => navigate('DECIDE_MATE')}>
                <span className="text-base leading-none">🤝</span>
                <div className="space-y-0.5"><p className="font-extrabold text-[11px] text-[#2E2216] leading-tight">밥친구 찾기</p><p className="text-[8px] text-[#7A7570] font-medium leading-tight">Bite-Mate 매칭하기</p></div>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button className="bg-white border border-[#F2ECE4] hover:bg-[#FF7A00]/5 p-2 rounded-lg text-[9px] font-bold text-[#7A7570] transition-all border-dashed" onClick={() => alert('GPS 신호 상태: 매우 양호')}>📍 위치 확인</button>
              <button className="bg-[#FFF4EB] border border-[#FFD8B8] hover:bg-[#FFE7D1] p-2 rounded-lg text-[9px] font-bold text-[#FF7A00] transition-all" onClick={() => navigate('COUPON')}>🎁 쿠폰함</button>
            </div>
          </div>
        </div>

        {/* 시연 조작부 (디자인 유지) */}
        <div className="mt-2 pt-2 border-t border-[#F2ECE4] bg-white/70 p-2 rounded-xl shrink-0">
          <p className="text-[8px] text-[#A69E96] text-center mb-1 font-bold uppercase tracking-widest">발표 시연용 수동 조작</p>
          <div className="flex gap-2">
            <button className="flex-1 bg-[#FFF4EB] hover:bg-[#FFE5D3] text-[#FF7A00] text-[8.5px] py-1 rounded-md font-extrabold transition-all" onClick={() => setRemainingTime(20)}>20분 (Plan B)</button>
            <button className="flex-1 bg-[#EAE5DF] hover:bg-[#DED8D0] text-[#7A7570] text-[8.5px] py-1 rounded-md font-extrabold transition-all" onClick={() => setRemainingTime(45)}>45분 (Plan A)</button>
          </div>
        </div>
      </div>
    </div>
  );

  // --------------------------------------
  // D. PLAN_B (Firebase 데이터 매핑)
  // --------------------------------------
  const renderPlanB = () => {
    const list = normalizeRestaurants(true);
    const filtered = planBFilter === '전체' ? list : list.filter(r => r.location.includes(planBFilter));

    return (
      <div className="h-full flex flex-col bg-[#FAF8F5] animate-fade-in">
        <BrandHeader showBack={true} onBack={() => navigate('HOME')} />
        <div className="flex-grow pt-[22px] px-6 pb-6 flex flex-col justify-between overflow-hidden">
          <div className="flex flex-col flex-grow overflow-hidden">
            <div className="bg-[#FFF4EB] border border-[#FFE5D3] p-3 rounded-xl mb-4 shadow-sm flex items-start gap-2 shrink-0">
              <span className="text-xl mt-0.5 animate-bounce">⚠️</span>
              <div><p className="text-[#FF7A00] font-black text-xs">시간 촉박! ({remainingTime}분)</p><p className="text-[10px] text-[#7A7570] font-medium leading-normal mt-0.5">지각 방지를 위한 빠른 조리 식당입니다.</p></div>
            </div>
            <div className="mb-4 shrink-0">
              <h2 className={PAGE_TITLE}>빠르게 먹기 추천</h2>
              <p className="mt-2 text-[12px] text-[#FF7A00] font-bold">공강 시간 {remainingTime}분 · Plan B</p>
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 shrink-0 scrollbar-none">
              {['전체', '학내', '내리 상권'].map(tab => (
                <button key={tab} onClick={() => setPlanBFilter(tab)} className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all whitespace-nowrap ${planBFilter === tab ? 'bg-[#FF7A00] text-white' : 'bg-white border border-[#F2ECE4] text-[#7A7570]'}`}>{tab}</button>
              ))}
            </div>

            <div className="overflow-y-auto flex-grow space-y-2 pr-1 pb-2 scrollbar-thin">
              {filtered.map(res => (
                <div
                  key={res.id}
                  className="bg-white border border-[#F2ECE4] p-3.5 rounded-xl flex justify-between items-center cursor-pointer hover:border-[#FF7A00] transition-all"
                  onClick={() => {
                    setSelectedRestaurant(res);
                    navigate('RESTAURANT_DETAIL');
                  }}
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-[#FFF4EB] flex items-center justify-center text-lg shrink-0">{getFoodEmoji(res.menu)}</div>
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1 flex-wrap"><p className="font-extrabold text-[#2E2216] text-xs">{res.name}</p><span className="bg-[#FAF8F5] text-[#7A7570] text-[8px] px-1.5 py-0.5 rounded font-extrabold border">{res.location}</span></div>
                      <p className="text-[10px] text-[#7A7570] font-medium flex items-center gap-1"><span>🚶‍♂️ {res.travelTime}분</span><span className="text-gray-300">•</span><span>⏱️ {res.prepTime}분</span></p>
                      <p className="text-[10px] text-[#FF7A00] font-extrabold">{res.menu}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0 pl-1">
                    <span className="bg-[#FF7A00]/10 text-[#FF7A00] text-[8px] px-1.5 py-0.5 rounded-full font-extrabold">Plan B</span>
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" /></svg>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <button className="w-full mt-2 bg-[#EAE5DF] text-[#7A7570] py-2.5 rounded-full font-bold text-xs" onClick={() => navigate('HOME')}>돌아가기</button>
        </div>
      </div>
    );
  };

  // --------------------------------------
  // E. RESTAURANT_LIST (Firebase 필터링 매핑)
  // --------------------------------------
  const renderRestaurantList = () => {
    const list = mergedRestaurants.map(r => ({
      id: r.id,
      name: r.name,
      geopoint: r.geopoint,
      location: r.building || r.location || '알 수 없음',
      travelTime: r.walkingMinutes ?? getWalkingTime(currentBuilding, r.building || r.location),
      prepTime: r.cookTime || 5,
      type: r.category || '매장/포장',
      menu: r.menus?.[0]?.name || r.menu || '메뉴',
      rating: r.rating || 4.5,
      waitTime: r.waitTime || 0,
      isPlanB: r.isPlanB,
      image: r.image || null,
    }));

    const filtered =
      restaurantFilter === '전체'
        ? list
        : list.filter(r => r.location.includes(restaurantFilter));

    return (
      <div className="h-full flex flex-col bg-[#FAF8F5] animate-fade-in">
        <BrandHeader showBack={true} onBack={() => navigate('HOME')} />

        <div className="flex-grow pt-[22px] px-6 pb-6 flex flex-col justify-between overflow-hidden">
          <div className="flex flex-col flex-grow overflow-hidden">
            <div className="mb-4 shrink-0">
              <h2 className={PAGE_TITLE}>여유로운 식사 추천</h2>
              <p className="mt-2 text-[12px] text-[#FF7A00] font-bold">
                공강 시간 {remainingTime}분 · Plan A
              </p>
            </div>

            <div className="flex gap-1.5 overflow-x-auto pb-2 mb-3 shrink-0 scrollbar-none">
              {['전체', '학내', '내리 상권', '한경대'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setRestaurantFilter(tab)}
                  className={`px-3 py-1 rounded-full text-[10px] font-bold transition-all whitespace-nowrap ${restaurantFilter === tab
                    ? 'bg-[#FF7A00] text-white shadow-sm'
                    : 'bg-white border border-[#F2ECE4] text-[#7A7570]'
                    }`}
                >
                  {tab}
                </button>
              ))}
            </div>

            <div className="overflow-y-auto flex-grow space-y-3 pr-1 pb-2 scrollbar-thin">
              {filtered.length > 0 ? (
                filtered.map(res => (
                  <div
                    key={res.id}
                    className="bg-white border border-[#F2ECE4] rounded-2xl p-3 shadow-sm hover:border-[#FF7A00] hover:shadow-md cursor-pointer transition-all active:scale-[0.99]"
                    onClick={() => {
                      setSelectedRestaurant(res);
                      navigate('RESTAURANT_DETAIL');
                    }}
                  >
                    <div className="flex gap-3">
                      <div className="w-[78px] h-[78px] rounded-xl bg-[#FAF8F5] border border-dashed border-[#D8C8B8] flex items-center justify-center shrink-0 overflow-hidden">
                        {res.image ? (
                          <img
                            src={res.image}
                            alt={res.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[30px]">{getFoodEmoji(res.menu)}</span>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <div className="min-w-0">
                            <h3 className="text-[15px] font-black text-[#2E2216] leading-tight truncate">
                              {res.name}
                            </h3>

                            <p className="mt-1 text-[10px] text-[#7A7570] font-bold truncate">
                              📍 {res.location}
                            </p>
                          </div>

                          <span className="text-[10px] text-[#FF7A00] font-black shrink-0">
                            도보 {res.travelTime}분
                          </span>
                        </div>

                        <div className="mt-2 flex flex-wrap gap-1">
                          <span className="bg-[#FFF4EB] text-[#FF7A00] text-[9px] px-2 py-0.5 rounded-full font-extrabold">
                            {res.type}
                          </span>

                          <span className="bg-[#FAF8F5] text-[#7A7570] text-[9px] px-2 py-0.5 rounded-full font-bold border border-[#F2ECE4]">
                            조리 {res.prepTime}분
                          </span>
                        </div>


                      </div>
                    </div>

                    <div className="mt-3 bg-[#FAF8F5] border border-[#F2ECE4] rounded-xl px-3 py-2 flex items-center gap-2">
                      <span className="text-[13px]">🍽️</span>
                      <p className="text-[11px] text-[#2E2216] font-bold truncate">
                        대표 메뉴 : {res.menu}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-40 flex flex-col items-center justify-center text-xs text-[#A69E96]">
                  <span>표시할 식당이 없습니다.</span>
                </div>
              )}
            </div>
          </div>

          <button
            className="w-full mt-2 bg-[#EAE5DF] text-[#7A7570] py-2.5 rounded-full font-bold text-xs"
            onClick={() => navigate('HOME')}
          >
            돌아가기
          </button>
        </div>
      </div>
    );
  };

  // 나머지 정적 화면들은 변경 없이 그대로 호출
  const renderDecideMate = () => ( /* 동료 코드와 100% 동일 */
    <div className="h-full flex flex-col bg-[#FAF8F5] animate-fade-in"><BrandHeader showBack={true} onBack={() => navigate('RESTAURANT_LIST')} /><div className="flex-grow pt-[22px] px-6 pb-6 flex flex-col justify-between"><div className="my-auto space-y-6"><div className="text-left mb-6"><h2 className={PAGE_TITLE}>식사 방식 선택</h2><p className={PAGE_SUBTITLE}>오늘의 한 끼, 어떻게 먹을까요?</p></div><div className="space-y-3.5"><button className="w-full bg-white border border-[#F2ECE4] hover:border-[#FF7A00] p-5 rounded-[20px] flex items-center gap-3.5 text-left transition-all hover:shadow-md active:scale-[0.99] group shadow-sm" onClick={() => navigate('PAYMENT')}><div className="w-10 h-10 rounded-lg bg-[#FAF8F5] border border-[#F2ECE4] group-hover:bg-[#FFF4EB] group-hover:border-[#FF7A00]/20 flex items-center justify-center text-xl shrink-0 transition-colors">👤</div><div className="space-y-0.5"><p className="font-extrabold text-sm text-[#2E2216] group-hover:text-[#FF7A00] transition-colors">혼자 먹기</p><p className="text-[10px] text-[#7A7570] font-medium">바로 주문하고 편하게 식사</p></div></button><button className="w-full bg-gradient-to-br from-[#FF9533] to-[#FF7A00] p-5 rounded-[20px] flex items-center gap-3.5 text-left shadow-lg hover:shadow-xl active:scale-[0.99] text-white relative overflow-hidden group" onClick={() => navigate('BITE_MATE')}><div className="absolute -right-6 -bottom-6 w-20 h-20 bg-white/10 rounded-full group-hover:scale-110 transition-transform" /><div className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center text-xl shrink-0">🤝</div><div className="space-y-0.5 z-10"><div className="flex items-center gap-1.5 flex-wrap"><p className="font-extrabold text-sm">밥친구 찾기</p><span className="bg-white text-[#FF7A00] text-[8px] px-1 py-0.5 rounded font-black leading-none">Bite-Mate</span></div><p className="text-[10px] opacity-90 font-medium">비슷한 공강 시간을 가진 학우와 함께</p></div></button></div></div><button className="text-[#7A7570] hover:text-[#FF7A00] text-xs font-bold underline py-2 mt-4 shrink-0 block text-center" onClick={() => navigate('RESTAURANT_LIST')}>식당 다시 고르기</button></div></div>
  );

  const renderBiteMate = () => (
    <div className="h-full flex flex-col bg-[#FAF8F5] animate-fade-in"><BrandHeader showBack={true} onBack={() => navigate('DECIDE_MATE')} /><div className="flex-grow pt-[22px] px-6 pb-6 flex flex-col justify-between text-center"><div /><div className="space-y-6 my-auto"><div className="space-y-2"><h2 className={PAGE_TITLE}>밥친구 매칭 중...</h2><p className="text-[9px] text-[#FF7A00] font-extrabold uppercase tracking-wider bg-[#FFF4EB] px-3 py-0.5 rounded-full inline-block">Bite-Mate Matching</p></div><div className="relative w-24 h-24 mx-auto flex items-center justify-center"><div className="absolute inset-0 rounded-full bg-[#FF7A00]/5 animate-ping duration-1000" /><div className="absolute inset-2 rounded-full bg-[#FF7A00]/10 animate-pulse" /><div className="absolute inset-4 rounded-full border-4 border-[#FFF4EB] border-t-[#FF7A00] animate-spin" /><div className="absolute inset-6 bg-white rounded-full shadow-md flex items-center justify-center text-2xl">🎯</div></div><div className="space-y-1"><p className="text-[#2E2216] font-extrabold text-sm leading-relaxed">같은 공강 시간을 가진 학우를</p><p className="text-[#7A7570] font-medium text-[10px] leading-relaxed max-w-[240px] mx-auto">열심히 탐색하고 있습니다.</p></div></div><button className="w-full bg-[#FF7A00] hover:bg-[#E66E00] text-white py-2.5 px-4 font-bold text-xs rounded-full shadow-lg active:scale-[0.98] transition-all flex items-center justify-center shrink-0" onClick={() => navigate('PAYMENT')}>매칭 성공 (데모)</button></div></div>
  );

  const renderPayment = () => (
    <div className="h-full flex flex-col bg-[#FAF8F5] animate-fade-in"><div className="flex-grow pt-[22px] px-6 pb-6 flex flex-col justify-between text-center"><div /><div className="space-y-7 my-auto"><div className="w-24 h-24 bg-[#FFF4EB] rounded-full mx-auto flex items-center justify-center text-5xl shadow-sm relative animate-bounce">🍳<span className="absolute -right-1 -bottom-1 w-7 h-7 bg-[#FF7A00] rounded-full flex items-center justify-center text-white border-2 border-white text-sm font-bold">✓</span></div><div className="space-y-2.5"><h2 className="text-[28px] font-black text-[#2E2216] leading-tight">주문 접수 완료</h2><p className="text-[14px] text-[#7A7570] leading-relaxed max-w-[300px] mx-auto">식당에 스마트 오더가 전달되었습니다.<br />도착 시간에 맞춰 조리가 시작됩니다.</p></div><div className="bg-white border-2 border-[#FF7A00] p-5 rounded-2xl max-w-[250px] mx-auto shadow-sm space-y-1.5"><p className="text-[12px] text-[#FF7A00] font-extrabold tracking-wider">픽업/대기 번호</p><p className="text-[44px] font-black text-[#FF7A00] tracking-wider font-mono leading-none">105</p></div></div><div className="space-y-3 shrink-0"><button className="w-full bg-[#FF922E] hover:bg-[#FF7A00] text-white py-4 px-4 font-bold text-base rounded-full shadow-xl active:scale-[0.98] transition-all flex items-center justify-center" onClick={() => navigate('ROUTE')}>📍 실시간 경로 확인</button><button className="w-full bg-[#2E2216] hover:bg-black text-white py-3.5 px-4 font-bold text-base rounded-full shadow-lg active:scale-[0.98] transition-all flex items-center justify-center" onClick={() => { navigate('ONBOARDING'); }}>처음 화면으로 돌아가기</button></div></div></div>
  );

  const renderRoute = () => {
    const restaurantName = selectedRestaurant ? selectedRestaurant.name : '도착지';

    const eLat = selectedRestaurant?.geopoint?.latitude || 37.5050;
    const eLng = selectedRestaurant?.geopoint?.longitude || 126.9571;

    const startBuildingData = dbBuildings[currentBuilding];
    const sLat = startBuildingData?.geopoint?.latitude || 37.5050;
    const sLng = startBuildingData?.geopoint?.longitude || 126.9571;

    const pcWebUrl = `https://map.kakao.com/link/to/${restaurantName},${eLat},${eLng}`;
    const mobileAppUrl = `kakaomap://route?sp=${sLat},${sLng}&ep=${eLat},${eLng}&sn=${currentBuilding}&en=${restaurantName}`;

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const finalMapUrl = isMobile ? mobileAppUrl : pcWebUrl;

    return (
      <div className="h-full flex flex-col bg-[#FAF8F5] animate-fade-in relative">
        <BrandHeader showBack={true} onBack={() => navigate('PAYMENT')} />

        <div className="flex-grow px-6 pt-5 pb-6 flex flex-col">
          <div className="mb-4">
            <h2 className="text-[24px] font-black text-[#2E2216] leading-tight">실시간 경로 안내</h2>
            <p className="mt-2 text-[13px] text-[#7A7570] leading-relaxed">
              현재 위치에서 식당까지 가장 빠른 경로를 안내합니다.
            </p>
          </div>

          <div className="bg-white border border-[#F2ECE4] rounded-2xl p-4 shadow-sm mb-4">
            <div className="flex justify-between items-center mb-3">
              <span className="text-[12px] font-bold text-[#7A7570]">출발</span>
              <span className="text-[14px] font-black text-[#2E2216]">{currentBuilding}</span>
            </div>

            <div className="h-px bg-[#F2ECE4] my-3" />

            <div className="flex justify-between items-center">
              <span className="text-[12px] font-bold text-[#7A7570]">도착</span>
              <span className="text-[14px] font-black text-[#FF7A00]">{restaurantName}</span>
            </div>
          </div>

          <div className="flex-grow bg-white border-2 border-[#FF7A00] rounded-3xl shadow-sm overflow-hidden relative mb-4">
            <div id="kakao-map" className="w-full h-full"></div>

            <a
              href={finalMapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[220px] bg-[#2E2216] text-white px-4 py-2.5 rounded-full text-xs font-bold shadow-lg flex items-center justify-center gap-2 z-10 hover:bg-black transition-colors"
            >
              🚀 카카오맵으로 길찾기
            </a>
          </div>

          <div className="bg-white border border-[#F2ECE4] rounded-2xl p-4 shadow-sm mb-4">
            <div className="flex justify-between items-center">
              <span className="text-[13px] font-bold text-[#7A7570]">예상 이동시간</span>
              <span className="text-[24px] font-black text-[#FF7A00]">{transitTime}분</span>
            </div>
          </div>

          <button
            className="w-full bg-[#2E2216] hover:bg-black text-white py-3.5 px-4 font-bold text-base rounded-full shadow-lg active:scale-[0.98] transition-all"
            onClick={() => navigate('PAYMENT')}
          >
            주문 화면으로 돌아가기
          </button>
        </div>

        {showFeedback && (
          <div className="absolute inset-0 bg-black/55 z-[100] flex items-center justify-center px-6">
            <div className="bg-white rounded-3xl p-6 w-full shadow-2xl text-center animate-fade-in relative">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-[#FF7A00] text-xl font-light"
                onClick={() => setShowFeedback(false)}
              >
                ×
              </button>

              <div className="text-5xl mb-4">📝</div>

              <h3 className="text-[21px] font-black text-[#2E2216] mb-2 leading-snug">
                식사는 시간 안에<br />가능했나요?
              </h3>

              <p className="text-[11px] text-[#7A7570] mb-5">
                피드백은 다음 추천 정확도를 높이는 데 사용돼요.
              </p>

              <div className="bg-[#FAF8F5] border border-[#F2ECE4] rounded-2xl p-4 mb-5 flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-[#7A7570] font-bold">예상 소요 시간</p>
                  <p className="text-[20px] font-black text-[#2E2216]">{transitTime + 10}분</p>
                </div>

                <span className="text-[#A69E96] font-black">→</span>

                <div>
                  <p className="text-[10px] text-[#7A7570] font-bold">실제 소요 시간</p>
                  <p className="text-[20px] font-black text-[#FF7A00]">{transitTime + 12}분</p>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: '😊', title: '충분했어요' },
                  { icon: '😐', title: '딱 맞았어요' },
                  { icon: '😟', title: '부족했어요' },
                ].map((item) => (
                  <button
                    key={item.title}
                    className="border border-[#F2ECE4] rounded-2xl p-3 hover:border-[#FF7A00] hover:bg-[#FFF4EB] active:scale-[0.96] transition-all"
                    onClick={() => handleFeedbackSubmit(item.title)}
                  >
                    <p className="text-2xl mb-1">{item.icon}</p>
                    <p className="text-[11px] font-black text-[#2E2216]">{item.title}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {showPromotion && (
          <div className="absolute inset-0 bg-black/55 z-[110] flex items-center justify-center px-6">
            <div className="bg-white rounded-3xl p-6 w-full shadow-2xl text-center relative animate-fade-in">
              <button
                className="absolute top-4 right-4 text-gray-400 hover:text-[#FF7A00] text-2xl font-light"
                onClick={() => setShowPromotion(false)}
              >
                ×
              </button>

              <div className="text-6xl mb-4">🎁</div>

              <h3 className="text-[22px] font-black text-[#2E2216] mb-2">피드백 감사합니다!</h3>

              <p className="text-[12px] text-[#7A7570] leading-relaxed mb-5">
                다음 공강에도 사용할 수 있는<br />특별 쿠폰이 지급되었습니다.
              </p>

              <div className="bg-[#FFF4EB] border-2 border-dashed border-[#FF7A00] rounded-2xl p-5 mb-5">
                <p className="text-[10px] font-extrabold text-[#FF7A00] tracking-widest">GAPBITE COUPON</p>
                <p className="text-[28px] font-black text-[#2E2216] mt-2 leading-tight">
                  다음 주문<br />1,000원 할인!
                </p>
                <p className="text-[11px] text-[#7A7570] mt-2">공강한입 제휴 식당 · 3일 이내 사용 가능</p>
              </div>

              <button
                className="w-full bg-[#FF7A00] hover:bg-[#FF922E] text-white py-3.5 rounded-full font-bold text-sm shadow-lg transition-all active:scale-[0.98]"
                onClick={() => {
                  setShowPromotion(false);
                  navigate('COUPON');
                }}
              >
                쿠폰 확인
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderCoupon = () => (
    <div className="h-full flex flex-col bg-[#FAF8F5] animate-fade-in"><BrandHeader showBack={true} onBack={() => setCurrentScreen(previousScreen)} /><div className="flex-grow px-6 pt-6 pb-6 flex flex-col"><div className="mb-6 text-center"><h2 className="text-[30px] font-black text-[#2E2216] leading-tight">내 쿠폰함</h2><p className="mt-3 text-[13px] text-[#7A7570] leading-relaxed">보유한 쿠폰은 주문 시 자동으로 적용할 수 있어요!</p></div><div className="bg-white border border-[#F2ECE4] rounded-3xl p-5 shadow-sm flex-grow"><div className="flex items-center gap-2 mb-5"><span className="text-2xl">🎟️</span><p className="text-[18px] font-black text-[#2E2216]">보유 쿠폰 <span className="text-[#FF7A00]">1개</span></p></div><div className="bg-[#FFF4EB] border-2 border-dashed border-[#FF7A00] rounded-2xl px-4 py-4"><div className="flex items-center justify-between"><div><p className="text-[18px] font-black text-[#2E2216] leading-tight">피드백</p><p className="text-[18px] font-black text-[#2E2216] leading-tight">선물</p></div><div className="h-8 w-px bg-[#E5D6C7]" /><div className="text-center"><p className="text-[10px] text-[#7A7570] font-bold">할인금액</p><p className="text-[20px] font-black text-[#FF7A00]">1,000원</p></div><div className="h-8 w-px bg-[#E5D6C7]" /><div className="text-center"><p className="text-[10px] text-[#7A7570] font-bold">사용기한</p><p className="text-[20px] font-black text-[#2E2216]">6/31</p></div></div></div><div className="mt-5 bg-[#FAF8F5] border border-[#F2ECE4] rounded-2xl px-4 py-3 flex items-center gap-2"><span className="text-[#FF7A00] text-lg">ⓘ</span><p className="text-[11px] text-[#7A7570] font-medium">쿠폰은 주문 결제 단계에서 자동 적용됩니다.</p></div></div></div></div>
  );

  const renderRestaurantDetail = () => {
    if (!selectedRestaurant) {
      return (
        <div className="h-full flex flex-col bg-[#FAF8F5]">
          <BrandHeader showBack={true} onBack={() => navigate('RESTAURANT_LIST')} />
          <div className="flex-grow flex items-center justify-center text-[#7A7570] text-sm">
            식당 정보가 없습니다.
          </div>
        </div>
      );
    }

    const detailMenus = DETAIL_MENUS[selectedRestaurant.name] || [];
    const totalPrice = cartItems.reduce((sum, item) => sum + item.price, 0);

    const addToCart = (menu) => {
      setCartItems(prev => [...prev, menu]);
    };

    return (
      <div className="h-full flex flex-col bg-[#FAF8F5] animate-fade-in">
        <BrandHeader
          showBack={true}
          onBack={() => {
            setCartItems([]);
            setCurrentScreen('HOME');
          }}
        />

        <div className="flex-grow overflow-y-auto pb-4">
          <div className="h-28 bg-[#FFF4EB] flex items-center justify-center">
            <span className="text-6xl">
              {getFoodEmoji(selectedRestaurant.menu)}
            </span>
          </div>

          <div className="px-6 py-5">
            <h2 className="text-[27px] font-black text-[#2E2216] leading-tight text-center">
              {selectedRestaurant.name}
            </h2>

            <p className="mt-2 text-[12px] text-[#7A7570] font-bold text-center">
              {selectedRestaurant.location} · {selectedRestaurant.type}
            </p>

            <div className="grid grid-cols-3 gap-2 mt-5">
              <div className="bg-white border border-[#F2ECE4] rounded-2xl p-3 text-center">
                <p className="text-[10px] text-[#7A7570] font-bold">이동</p>
                <p className="text-[17px] font-black text-[#FF7A00]">
                  {selectedRestaurant.travelTime}분
                </p>
              </div>

              <div className="bg-white border border-[#F2ECE4] rounded-2xl p-3 text-center">
                <p className="text-[10px] text-[#7A7570] font-bold">조리</p>
                <p className="text-[17px] font-black text-[#FF7A00]">
                  {selectedRestaurant.prepTime}분
                </p>
              </div>

              <div
                className="bg-white border border-[#F2ECE4] rounded-2xl p-3 text-center cursor-pointer hover:border-[#FF7A00]"
                onClick={() => {
                  navigate('REVIEW');
                }}
              >
                <p className="text-[10px] text-[#7A7570] font-bold">
                  리뷰
                </p>

                <p className="text-[17px] font-black text-[#FF7A00]">
                  ⭐ {selectedRestaurant.rating}
                </p>

                <p className="text-[9px] text-[#7A7570] mt-1">
                  리뷰 보기
                </p>
              </div>
            </div>

            <div className="mt-5 bg-white border border-[#F2ECE4] rounded-3xl p-5 shadow-sm">
              <h3 className="text-[16px] font-black text-[#2E2216] mb-2">
                식당 정보
              </h3>

              <p className="text-[12px] text-[#7A7570] leading-relaxed">
                현재 공강 시간과 이동 시간을 기준으로 추천된 식당입니다.
                도착 시간에 맞춰 주문하면 수업 전 식사를 완료할 수 있어요.
              </p>
            </div>

            <div className="mt-5 bg-white border border-[#F2ECE4] rounded-3xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-3">
                <h3 className="text-[16px] font-black text-[#2E2216]">
                  메뉴판
                </h3>
                <span className="text-[10px] text-[#FF7A00] font-extrabold">
                  메뉴 선택 시 장바구니 담기
                </span>
              </div>

              {detailMenus.length > 0 ? (
                <div className="space-y-2">
                  {detailMenus.map((menu) => (
                    <button
                      key={menu.name}
                      className="w-full bg-[#FAF8F5] border border-[#F2ECE4] hover:border-[#FF7A00] hover:bg-[#FFF4EB] rounded-2xl px-4 py-3 flex justify-between items-center transition-all active:scale-[0.98]"
                      onClick={() => addToCart(menu)}
                    >
                      <div className="text-left">
                        <p className="text-[13px] font-black text-[#2E2216]">
                          {menu.name}
                        </p>
                        <p className="text-[10px] text-[#7A7570] font-bold mt-0.5">
                          탭하면 장바구니에 담겨요
                        </p>
                      </div>

                      <p className="text-[13px] font-black text-[#FF7A00]">
                        {menu.price.toLocaleString()}원
                      </p>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="bg-[#FAF8F5] border border-[#F2ECE4] rounded-2xl px-4 py-5 text-center">
                  <p className="text-[12px] text-[#7A7570] font-bold">
                    상세 메뉴 준비 중입니다.
                  </p>
                </div>
              )}
            </div>

            {cartItems.length > 0 && (
              <div className="mt-5 bg-[#FFF4EB] border border-[#FFD8B8] rounded-3xl p-4 shadow-sm">
                <div className="flex justify-between items-center mb-2">
                  <h3 className="text-[15px] font-black text-[#2E2216]">
                    장바구니
                  </h3>
                  <span className="text-[11px] text-[#FF7A00] font-black">
                    {cartItems.length}개
                  </span>
                </div>

                <div className="space-y-1 max-h-24 overflow-y-auto">
                  {cartItems.map((item, index) => (
                    <div key={`${item.name}-${index}`} className="flex justify-between text-[11px]">
                      <span className="text-[#2E2216] font-bold">
                        {item.name}
                      </span>
                      <span className="text-[#FF7A00] font-black">
                        {item.price.toLocaleString()}원
                      </span>
                    </div>
                  ))}
                </div>

                <div className="h-px bg-[#FFD8B8] my-2" />

                <div className="flex justify-between items-center">
                  <span className="text-[12px] font-black text-[#2E2216]">
                    합계
                  </span>
                  <span className="text-[15px] font-black text-[#FF7A00]">
                    {totalPrice.toLocaleString()}원
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="px-6 pb-6 pt-3 bg-[#FAF8F5] border-t border-[#F2ECE4]">
          <div className="flex gap-2">

            <button
              className={`flex-1 py-3.5 rounded-full font-bold text-sm shadow-lg transition-all active:scale-[0.98]
              ${cartItems.length > 0
                  ? 'bg-[#FF7A00] hover:bg-[#E66E00] text-white'
                  : 'bg-[#EAE5DF] text-[#A69E96]'
                }`}
              disabled={cartItems.length === 0}
              onClick={() => navigate('PAYMENT')}
            >
              주문하기
            </button>

            <button
              className="px-4 py-3.5 rounded-full bg-[#EAE5DF] text-[#7A7570] font-bold text-xs hover:bg-[#DDD6CE]"
              onClick={() => setCartItems([])}
            >
              초기화
            </button>

          </div>
        </div>
      </div>
    );
  };


  const renderReviewPage = () => {
    const reviews = [];

    return (
      <div className="h-full flex flex-col bg-[#FAF8F5] animate-fade-in">
        <BrandHeader
          showBack={true}
          onBack={() => setCurrentScreen('RESTAURANT_DETAIL')}
        />

        <div className="px-6 pt-[22px] pb-6 flex-grow overflow-y-auto">
          <h2 className={PAGE_TITLE}>
            리뷰
          </h2>

          <p className="mt-2 text-[12px] text-[#7A7570]">
            이용자 피드백 기반 리뷰입니다.
          </p>

          <div className="mt-5 bg-white border border-[#F2ECE4] rounded-3xl p-5 text-center">
            <p className="text-[12px] text-[#7A7570] font-bold">
              누적 피드백
            </p>

            <p className="text-[28px] font-black text-[#FF7A00] mt-2">
              {reviews.length}개
            </p>
          </div>

          <div className="mt-5 space-y-3">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div
                  key={review.id}
                  className="bg-white border border-[#F2ECE4] rounded-2xl p-4"
                >
                  <p className="text-[12px] font-black text-[#2E2216]">
                    ⭐ {review.rating} · {review.user}
                  </p>

                  <p className="text-[11px] text-[#7A7570] mt-2 leading-relaxed">
                    {review.feedback}
                  </p>
                </div>
              ))
            ) : (
              <div className="bg-white border border-[#F2ECE4] rounded-2xl p-5 text-center">
                <p className="text-[12px] text-[#7A7570] font-bold">
                  아직 등록된 리뷰가 없습니다.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };



  const renderScreen = () => {
    switch (currentScreen) {
      case 'ONBOARDING': return renderOnboarding();
      case 'OCR_INPUT': return renderOcrInput();
      case 'EDIT_TIMETABLE': return renderTimetableEdit();
      case 'HOME': return renderHome();
      case 'PLAN_B': return renderPlanB();
      case 'RESTAURANT_LIST': return renderRestaurantList();
      case 'DECIDE_MATE': return renderDecideMate();
      case 'BITE_MATE': return renderBiteMate();
      case 'PAYMENT': return renderPayment();
      case 'ROUTE': return renderRoute();
      case 'COUPON': return renderCoupon();
      case 'RESTAURANT_DETAIL': return renderRestaurantDetail();
      case 'REVIEW': return renderReviewPage();
      default: return renderOnboarding();
    }
  };

  return (
    <div className="w-[370px] h-[750px] min-w-[370px] max-w-[370px] min-h-[750px] max-h-[750px] mx-auto my-4 border-[12px] border-gray-900 rounded-[3.2rem] shadow-2xl overflow-hidden bg-[#FAF8F5] relative font-sans flex flex-col select-none flex-shrink-0">
      <div className="absolute top-0 inset-x-0 h-5 bg-gray-900 rounded-b-xl w-32 mx-auto z-50"></div>
      <StatusBar />
      <div className="flex-grow overflow-hidden relative w-full h-full flex flex-col bg-[#FAF8F5]">
        {renderScreen()}
      </div>
      <HomeIndicator isDark={currentScreen === 'ONBOARDING'} />
    </div>
  );
}