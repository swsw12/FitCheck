# FitCheck AI — React Native (Expo)

Figma `FitCheck_UI` 디자인을 기반으로 구현한 프론트엔드입니다.

## 실행 방법

```bash
npm install
npx expo start
```

- 휴대폰에 **Expo Go** 앱을 설치한 뒤, 터미널에 뜨는 QR 코드를 스캔하면 바로 실행됩니다.
- iOS 시뮬레이터: `i`, Android 에뮬레이터: `a`

## 화면 구성 (Figma 프레임 매핑)

| 화면 | 파일 | Figma 프레임 |
|---|---|---|
| 랜딩 | `src/screens/LandingScreen.js` | 01 랜딩 |
| 이메일 시작 | `src/screens/EmailAuthScreen.js` | 09_A_이메일 |
| 비밀번호 로그인 | `src/screens/PasswordAuthScreen.js` | 09_B_비밀번호 |
| 계정 잠김(5회 실패) | `src/screens/LoginLockedScreen.js` | 09_B_5회 실패 |
| 새 기기 인증코드 | `src/screens/NewDeviceCodeScreen.js` | 09_C_코드(새 기기) |
| 비밀번호 설정 | `src/screens/PasswordSetupScreen.js` | 09_D_비밀번호 설정 |
| 프로필 1단계 | `src/screens/ProfileStep1Screen.js` | 02 (빈 값/전부 입력/범위 초과 상태 포함) |
| 프로필 2단계 | `src/screens/ProfileStep2Screen.js` | 03 (추정 뱃지/정확도 게이지/선호 핏) |
| 전신 사진 업로드 | `src/screens/BodyPhotoUploadScreen.js` | 04 (기본/검증 중/실패/통과 상태 포함) |
| 의류 등록 | `src/screens/ClothingRegisterScreen.js` | 05 (선택 항목 펼침/이상값 감지 포함) |
| 생성 대기 | `src/screens/GenerationWaitingScreen.js` | 06 (생성중/실패) |
| 피팅 결과 | `src/screens/FittingResultScreen.js` | 07 (기본/사진 없음/추정 프로필) |
| 내 피팅 | `src/screens/MyFittingsScreen.js` | 08 (목록/빈 상태) |
| 사이즈 비교 | `src/screens/SizeCompareScreen.js` | 10 (둘 다 완료/이미지 없음/한쪽 생성 중) |

## 공용 컴포넌트

- `src/components/AppHeader.js` — 상단 헤더 (뒤로가기 + FitCheck AI 타이틀)
- `src/components/PrimaryButton.js` — CTA 버튼 (primary / outline / disabled)
- `src/components/TextField.js` — 라벨 + 인풋
- `src/components/Checkbox.js` — 약관 동의 체크박스
- `src/components/StepProgress.js` — 상단 진행 바 + "n / 4" 표기
- `src/components/FitReportCard.js` — 핏 리포트 카드 (대기/결과 화면 공용)
- `src/theme/index.js` — 색상 · 타이포 토큰 (Figma 값 기준)

## 참고 사항

- **폰트**: Pretendard(npm 패키지)를 번들에 포함해 로드합니다.
- **아이콘**: Figma 원본 SVG 에셋 대신 `@expo/vector-icons`(Feather, MaterialCommunityIcons)의 가장 유사한 글리프를 사용했습니다. 원본 에셋으로 바꾸려면 Figma에서 SVG로 export 후 `react-native-svg`로 교체하면 됩니다.
- **이미지**: AI 착용 이미지 · 모델 사진 자리에는 플레이스홀더가 들어 있습니다. 실제 API 연동 시 `Image` 소스만 교체하면 됩니다.
- **상태 데모**: 생성 대기 · 사이즈 비교 화면 하단의 "상태 전환 (데모)" 버튼으로 각 상태 UI를 확인할 수 있습니다. API 연동 시 제거하세요.
- 백엔드 연동 지점에는 `TODO` 주석을 달아두었습니다.
