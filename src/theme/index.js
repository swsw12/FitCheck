// FitCheck 디자인 토큰 — Figma FitCheck_UI 기준
export const colors = {
  // 브랜드
  navy: '#051A2B',          // 주요 버튼/포인트 (bg-[#051a2b])
  black: '#000000',
  ink: '#1C1B1C',           // 본문 강조 텍스트
  title: '#222222',         // 타이틀 (블랙 토큰 #222222)
  gray700: '#45474A',       // 보조 텍스트
  gray500: '#6E7277',       // 흐린 보조 텍스트
  gray300: '#C5C6CA',       // 경계선
  gray200: '#E5E2E2',       // 프로그레스 트랙
  surface: '#FAFAFD',       // 카드 배경
  white: '#FFFFFF',
  blue: '#35618D',          // 수치 강조 (+4 cm)
  border: 'rgba(197,198,202,0.4)',
  headerBorder: 'rgba(5,26,43,0.2)',
  error: '#D32F2F',
  success: '#2E7D32',
};

export const font = {
  regular: 'Pretendard-Regular',
  medium: 'Pretendard-Medium',
  semibold: 'Pretendard-SemiBold',
  bold: 'Pretendard-Bold',
};

export const type = {
  h1: { fontFamily: font.medium, fontSize: 24, lineHeight: 32, color: colors.black },
  h2: { fontFamily: font.medium, fontSize: 20, lineHeight: 28, color: colors.black },
  body: { fontFamily: font.regular, fontSize: 16, lineHeight: 24, color: colors.gray700 },
  bodyInk: { fontFamily: font.regular, fontSize: 16, lineHeight: 24, color: colors.ink },
  label: { fontFamily: font.regular, fontSize: 14, lineHeight: 20, color: colors.gray700, letterSpacing: 0.28 },
  caption: { fontFamily: font.regular, fontSize: 12, lineHeight: 16, color: colors.gray700, letterSpacing: 0.12 },
  display: { fontFamily: font.medium, fontSize: 32, lineHeight: 48, color: colors.black, letterSpacing: -1 },
};

export const layout = {
  screenPadding: 20,
  radius: 4,
};
