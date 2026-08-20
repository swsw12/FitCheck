/**
 * FitCheck 프로필 추정 치수 테스트 — 키 170 / 몸무게 60
 *
 * 목적: 프로필 2단계에서 키·몸무게만 넣고 저장했을 때
 *       서버가 어깨너비/가슴둘레/허리둘레/팔길이를 얼마로 "추정" 채우는지 확인.
 *       (앱 화면에서 "-- cm 추정"으로 보이던 값이 저장 후 실제로 채워지는지 검증)
 *
 * 실행: node test-profile-170-60.mjs
 */

const BASE_URL = 'https://web-production-19ef6.up.railway.app';

// ── 테스트 입력값 (여기만 바꾸면 다른 케이스도 테스트 가능) ──
const HEIGHT = 170;
const WEIGHT = 60;
const GENDER = '남성'; // '남성' | '여성' | '밝히지 않음'

const TEST_EMAIL = `profile_${HEIGHT}_${WEIGHT}_${Date.now()}@test.com`;
const TEST_PASSWORD = 'Test1234!';

// 화면 라벨 매핑 (서버 key → 한글 라벨)
const LABELS = { shoulder: '어깨너비', chest: '가슴둘레', waist: '허리둘레', arm: '팔길이' };

let TOKEN = null;
let pass = 0;
let fail = 0;

async function api(path, { body, method = 'GET' } = {}) {
  const headers = {};
  if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;
  let fetchBody;
  if (body && typeof body === 'object') {
    headers['Content-Type'] = 'application/json';
    fetchBody = JSON.stringify(body);
  }
  const res = await fetch(`${BASE_URL}${path}`, { method, headers, body: fetchBody });
  const data = await res.json().catch(() => null);
  if (data) data._httpStatus = res.status;
  return data || { _httpStatus: res.status };
}

function check(name, ok, detail = '') {
  if (ok) { pass++; console.log(`  ✅ ${name}`); }
  else { fail++; console.log(`  ❌ ${name} — ${detail}`); }
}

function printMeasures(measurements) {
  console.log('\n   ┌─────────────┬──────────┬────────┐');
  console.log('   │ 항목        │   값     │  출처  │');
  console.log('   ├─────────────┼──────────┼────────┤');
  for (const key of ['shoulder', 'chest', 'waist', 'arm']) {
    const m = measurements?.[key];
    const label = (LABELS[key] + '     ').slice(0, 6);
    const val = m ? `${m.value} cm`.padStart(8) : '   없음 ';
    const src = m?.source ? ` ${m.source} ` : '  -   ';
    console.log(`   │ ${label}    │ ${val} │ ${src} │`);
  }
  console.log('   └─────────────┴──────────┴────────┘');
}

async function run() {
  console.log(`\n━━━ 프로필 추정 테스트: 키 ${HEIGHT}cm · 몸무게 ${WEIGHT}kg · ${GENDER} ━━━`);
  console.log(`계정: ${TEST_EMAIL}\n`);

  // 1) 회원가입 → 토큰 발급
  const signup = await api('/auth/signup', {
    method: 'POST',
    body: { email: TEST_EMAIL, password: TEST_PASSWORD, isOver14: true },
  });
  check('회원가입 & 토큰 발급', !!signup.token, JSON.stringify(signup).slice(0, 120));
  if (!signup.token) { done(); return; }
  TOKEN = signup.token;

  // 2) 저장 전: 프로필 없음(404) 확인 — 화면에서 "-- cm"로 보이는 상태
  const before = await api('/profile');
  check('저장 전 프로필 없음 (404)', before._httpStatus === 404,
    `status=${before._httpStatus}`);

  // 3) 키/몸무게만 넣고 저장 (치수는 비움 → 서버가 추정)
  console.log(`\n[저장] PUT /profile  height=${HEIGHT}, weight=${WEIGHT}, gender=${GENDER}, measurements={}`);
  const saved = await api('/profile', {
    method: 'PUT',
    body: { height: HEIGHT, weight: WEIGHT, gender: GENDER, measurements: {} },
  });
  check('프로필 저장 성공', saved._httpStatus === 200 || saved._httpStatus === 201,
    `status=${saved._httpStatus}`);

  // 4) 저장 후 조회 → 추정 치수 확인
  const after = await api('/profile');
  check('저장 후 프로필 조회 성공', after._httpStatus === 200, `status=${after._httpStatus}`);
  check('키 반영', after.height === HEIGHT, `height=${after.height}`);
  check('몸무게 반영', after.weight === WEIGHT, `weight=${after.weight}`);

  console.log(`\n[결과] 서버가 채운 추정 치수 (정확도 ${after.accuracy ?? '-'}/5):`);
  printMeasures(after.measurements);

  // 5) 계약 검증: 4개 치수 모두 값이 있고(null 아님) 출처는 '추정'
  const keys = ['shoulder', 'chest', 'waist', 'arm'];
  for (const key of keys) {
    const m = after.measurements?.[key];
    check(`${LABELS[key]}: 값이 채워짐 (null 아님)`,
      m != null && m.value != null,
      `${LABELS[key]}=${JSON.stringify(m)}`);
    check(`${LABELS[key]}: 출처 '추정'`,
      m?.source === '추정',
      `source=${m?.source}`);
  }

  // 6) 실측 1개 입력 시 정확도가 올라가는지 (어깨너비 40cm 실측으로 저장)
  console.log(`\n[추가] 어깨너비 40cm '실측' 입력 후 재저장 → 정확도 변화 확인`);
  const saved2 = await api('/profile', {
    method: 'PUT',
    body: {
      height: HEIGHT, weight: WEIGHT, gender: GENDER,
      measurements: { shoulder: { value: 40, source: '실측' } },
      preferredGrade: '레귤러핏',
    },
  });
  check('실측 포함 재저장 성공', saved2._httpStatus === 200 || saved2._httpStatus === 201,
    `status=${saved2._httpStatus}`);
  const after2 = await api('/profile');
  printMeasures(after2.measurements);
  check('어깨너비 실측 반영', after2.measurements?.shoulder?.value === 40,
    `shoulder=${JSON.stringify(after2.measurements?.shoulder)}`);
  check('선호 핏 저장됨', after2.preferredGrade === '레귤러핏',
    `preferredGrade=${after2.preferredGrade}`);
  console.log(`   정확도: ${after.accuracy ?? '-'}/5  →  ${after2.accuracy ?? '-'}/5`);

  done();
}

function done() {
  console.log(`\n━━━ 완료: ${pass} 통과 / ${fail} 실패 ━━━`);
  if (fail === 0) console.log('🎉 전체 통과!');
  process.exit(fail === 0 ? 0 : 1);
}

run().catch((e) => {
  console.error('실행 오류:', e.message);
  process.exit(1);
});
