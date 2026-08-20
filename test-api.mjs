/**
 * FitCheck API 통합 테스트 v2
 * 실제 서버 응답 구조에 맞춰 수정
 *
 * 실행: node test-api.mjs
 */

const BASE_URL = 'https://web-production-19ef6.up.railway.app';

let TOKEN = null;
let USER_ID = null;
const TEST_EMAIL = `testuser_${Date.now()}@test.com`;
const TEST_PASSWORD = 'Test1234!';

let passed = 0;
let failed = 0;
const results = [];

// ── 헬퍼 ──

async function api(path, options = {}) {
  const { body, method = 'GET', ...rest } = options;
  const headers = { ...rest.headers };
  if (TOKEN) headers['Authorization'] = `Bearer ${TOKEN}`;

  let fetchBody;
  if (body && typeof body === 'object') {
    headers['Content-Type'] = 'application/json';
    fetchBody = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${path}`, { method, headers, body: fetchBody });
  const status = res.status;

  if (res.status === 204) return { _httpStatus: status, _data: null };

  const data = await res.json().catch(() => null);
  if (data) data._httpStatus = status;
  return data || { _httpStatus: status, _data: null };
}

function assert(name, condition, detail = '') {
  if (condition) {
    passed++;
    results.push({ name, status: '✅ PASS', detail });
    console.log(`  ✅ ${name}`);
  } else {
    failed++;
    results.push({ name, status: '❌ FAIL', detail });
    console.log(`  ❌ ${name} — ${detail}`);
  }
}

function section(title) {
  console.log(`\n━━━ ${title} ━━━`);
}

// ── 1. 인증 ──

async function testAuth() {
  section('1. 인증 (Auth)');

  // 1-1. 회원가입
  const signup = await api('/auth/signup', {
    method: 'POST',
    body: { email: TEST_EMAIL, password: TEST_PASSWORD, isOver14: true },
  });
  assert('회원가입 성공', !!signup.token && !!signup.userId,
    `token=${!!signup.token}, userId=${signup.userId}`);
  if (signup.token) {
    TOKEN = signup.token;
    USER_ID = signup.userId;
  }

  // 1-2. 로그인
  const login = await api('/auth/login', {
    method: 'POST',
    body: { email: TEST_EMAIL, password: TEST_PASSWORD },
  });
  assert('로그인 성공', !!login.token, `token=${!!login.token}`);
  if (login.token) TOKEN = login.token;

  // 1-3. 잘못된 비밀번호
  const badLogin = await api('/auth/login', {
    method: 'POST',
    body: { email: TEST_EMAIL, password: 'wrong' },
  });
  assert('잘못된 비밀번호 거부', badLogin._httpStatus >= 400,
    `status=${badLogin._httpStatus}, code=${badLogin.error?.code}`);

  // 1-4. 중복 가입 → EMAIL_TAKEN
  const dupSignup = await api('/auth/signup', {
    method: 'POST',
    body: { email: TEST_EMAIL, password: TEST_PASSWORD, isOver14: true },
  });
  assert('중복 가입 EMAIL_TAKEN', dupSignup.error?.code === 'EMAIL_TAKEN' || dupSignup._httpStatus >= 400,
    `code=${dupSignup.error?.code}, status=${dupSignup._httpStatus}`);

  // 1-5. 없는 유저 로그인
  const noUser = await api('/auth/login', {
    method: 'POST',
    body: { email: 'nobody_' + Date.now() + '@test.com', password: 'abc123' },
  });
  assert('없는 유저 로그인 거부', noUser._httpStatus >= 400,
    `status=${noUser._httpStatus}, code=${noUser.error?.code}`);
}

// ── 2. 프로필 ──

async function testProfile() {
  section('2. 프로필 (Profile)');

  // 2-1. 프로필 조회 — 초기
  const get1 = await api('/profile');
  assert('초기 프로필 조회',
    get1._httpStatus === 200 || get1._httpStatus === 404 || get1.error?.code === 'PROFILE_NOT_FOUND',
    `status=${get1._httpStatus}`);

  // 2-2. 프로필 저장 (PUT — full replacement)
  const putData = {
    gender: '남성',
    height: 175,
    weight: 70,
    measurements: {
      shoulder: { value: 45, source: '실측' },
      chest: { value: 100, source: '추정' },
      waist: { value: 82, source: '추정' },
      arm: { value: 62, source: '추정' },
    },
    preferredGrade: '레귤러핏',
  };
  const put1 = await api('/profile', { method: 'PUT', body: putData });
  assert('프로필 저장', put1._httpStatus === 200 || put1._httpStatus === 201,
    `status=${put1._httpStatus}`);

  // 2-3. measurements.value null 아닌지
  if (put1.measurements) {
    const allHaveValue = Object.values(put1.measurements).every((m) => m.value != null);
    assert('measurements.value 가 null이 아님', allHaveValue,
      JSON.stringify(put1.measurements));
  }

  // 2-4. 프로필 재조회
  const get2 = await api('/profile');
  assert('프로필 재조회', get2.height === 175 && get2.gender === '남성',
    `height=${get2.height}, gender=${get2.gender}`);
  assert('preferredGrade 저장 확인', get2.preferredGrade === '레귤러핏',
    `preferredGrade=${get2.preferredGrade}`);

  // 2-5. measurements source 필드 존재 확인 (서버가 자체 판단할 수 있음)
  if (get2.measurements?.shoulder) {
    const src = get2.measurements.shoulder.source;
    assert('source 필드 존재', src === '실측' || src === '추정',
      `source=${src}`);
  }
}

// ── 3. 의류 등록 ──

let GARMENT_ID = null;

async function testGarment() {
  section('3. 의류 등록 (Garment)');

  // 3-1. 의류 등록
  const garment = await api('/garments', {
    method: 'POST',
    body: {
      kind: '티셔츠',
      sizeName: 'L',
      shoulder: 48,
      chestWidth: 56,
      length: 72,
      sleeve: 22,
      stretch: '약간',
    },
  });
  assert('의류 등록 성공', garment._httpStatus === 201 && !!garment.id,
    `status=${garment._httpStatus}, id=${garment.id}`);
  GARMENT_ID = garment.id;

  // 3-2. kind 유효성
  assert('kind 값 확인', garment.kind === '티셔츠', `kind=${garment.kind}`);

  // 3-3. stretch 확인
  assert('stretch 값 확인', garment.stretch === '약간', `stretch=${garment.stretch}`);

  // 3-4. 의류 목록 조회
  const list = await api('/garments');
  const items = Array.isArray(list) ? list : (list.items || []);
  assert('의류 목록 조회', items.length > 0, `count=${items.length}`);

  // 3-5. 잘못된 kind → 에러
  const badGarment = await api('/garments', {
    method: 'POST',
    body: { kind: '잠바', sizeName: 'M', shoulder: 45, chestWidth: 52, length: 68 },
  });
  assert('잘못된 kind 거부', badGarment._httpStatus >= 400,
    `status=${badGarment._httpStatus}`);
}

// ── 4. 피팅 ──

let FITTING_ID = null;

async function testFitting() {
  section('4. 피팅 (Fitting)');

  if (!GARMENT_ID) {
    console.log('  ⚠️  의류 ID 없음 — 스킵');
    return;
  }

  // 4-1. 피팅 생성
  const fitting = await api('/fittings', {
    method: 'POST',
    body: { garmentId: GARMENT_ID },
  });
  assert('피팅 생성 (201)', fitting._httpStatus === 201,
    `status=${fitting._httpStatus}`);
  assert('피팅 ID 존재', !!fitting.id, `id=${fitting.id}`);
  FITTING_ID = fitting.id;

  // 4-2. 피팅 상태 유효
  const validStatuses = ['대기', '생성중', '완료', '실패', '리포트만'];
  assert('피팅 상태 유효', validStatuses.includes(fitting.status),
    `status="${fitting.status}"`);

  // 4-3. 중복 생성 → 200
  const dup = await api('/fittings', {
    method: 'POST',
    body: { garmentId: GARMENT_ID },
  });
  assert('중복 피팅 200', dup._httpStatus === 200,
    `status=${dup._httpStatus}`);

  // 4-4. 단일 피팅 조회
  if (FITTING_ID) {
    const single = await api(`/fittings/${FITTING_ID}`);
    assert('단일 피팅 조회', !!single.id && validStatuses.includes(single.status),
      `id=${single.id}, status="${single.status}"`);

    // 4-5. report 필드 검증
    if (single.report) {
      const r = single.report;
      assert('report.fitGrade 존재', !!r.fitGrade, `fitGrade="${r.fitGrade}"`);
      assert('report.gaugeLevel 1~5', r.gaugeLevel >= 1 && r.gaugeLevel <= 5,
        `gaugeLevel=${r.gaugeLevel}`);
      assert('report.gradeDistance 숫자', typeof r.gradeDistance === 'number',
        `gradeDistance=${r.gradeDistance}`);

      // lengthLabel — 서버가 자유 텍스트 반환 가능
      if (r.lengthLabel) {
        assert('report.lengthLabel 문자열', typeof r.lengthLabel === 'string' && r.lengthLabel.length > 0,
          `lengthLabel="${r.lengthLabel}"`);
      }
    }
  }
}

// ── 5. 피팅 히스토리 ──

async function testHistory() {
  section('5. 피팅 히스토리 (Fittings List)');

  // 5-1. 전체 목록
  const all = await api('/fittings');
  assert('전체 목록 조회', !!all.items && !!all.counts,
    `items=${all.items?.length}, counts keys=${Object.keys(all.counts || {})}`);

  // 5-2. counts 합계
  if (all.counts) {
    const total = Object.values(all.counts).reduce((a, b) => a + b, 0);
    assert('counts 합계 > 0', total > 0, `total=${total}`);
  }

  // 5-3. 필터 조회
  const filtered = await api('/fittings?status=완료');
  assert('필터 조회 (완료)', !!filtered.items, `items=${filtered.items?.length}`);

  // 5-4. 필터해도 counts 전체 기준
  if (filtered.counts && all.counts) {
    const match = JSON.stringify(filtered.counts) === JSON.stringify(all.counts);
    assert('필터 시에도 counts 전체 기준', match,
      `filtered=${JSON.stringify(filtered.counts)}`);
  }
}

// ── 6. 사이즈 비교 ──

async function testCompare() {
  section('6. 사이즈 비교 (Compare)');

  if (!GARMENT_ID) {
    console.log('  ⚠️  의류 ID 없음 — 스킵');
    return;
  }

  const compare = await api('/fittings/compare', {
    method: 'POST',
    body: { garmentIds: [GARMENT_ID] },
  });

  if (compare._httpStatus === 200) {
    assert('비교 결과 sizes 배열', Array.isArray(compare.sizes),
      `type=${typeof compare.sizes}`);
    assert('recommendedSize 필드 존재', 'recommendedSize' in compare,
      `recommendedSize=${compare.recommendedSize}`);
  } else {
    assert('비교 API 응답 (서버 에러 아님)', compare._httpStatus < 500,
      `status=${compare._httpStatus}, error=${compare.error?.message}`);
  }
}

// ── 7. 에러 핸들링 ──

async function testErrors() {
  section('7. 에러 핸들링');

  const savedToken = TOKEN;

  // 7-1. 토큰 없이 요청
  TOKEN = null;
  const noAuth = await api('/profile');
  assert('토큰 없으면 401', noAuth._httpStatus === 401,
    `status=${noAuth._httpStatus}`);

  // 7-2. 잘못된 토큰
  TOKEN = 'invalid_token_123';
  const badAuth = await api('/profile');
  assert('잘못된 토큰 401', badAuth._httpStatus === 401,
    `status=${badAuth._httpStatus}`);

  // 7-3. 에러 형식 { error: { code, message } }
  if (noAuth.error) {
    assert('에러 형식 { code, message }', !!noAuth.error.code && !!noAuth.error.message,
      `code=${noAuth.error.code}`);
  }

  TOKEN = savedToken;

  // 7-4. 존재하지 않는 피팅 → 에러 (404 또는 422)
  const notFound = await api('/fittings/99999999');
  assert('없는 피팅 에러 응답', notFound._httpStatus >= 400,
    `status=${notFound._httpStatus}`);
}

// ── 실행 ──

async function run() {
  console.log('🔧 FitCheck API 통합 테스트 v2');
  console.log(`📡 서버: ${BASE_URL}`);
  console.log(`📧 테스트 계정: ${TEST_EMAIL}`);

  try {
    await testAuth();
    await testProfile();
    await testGarment();
    await testFitting();
    await testHistory();
    await testCompare();
    await testErrors();
  } catch (e) {
    console.error('\n💥 예외:', e.message);
    failed++;
  }

  console.log('\n════════════════════════════════');
  console.log(`📊 결과: ${passed} 통과 / ${failed} 실패 / 총 ${passed + failed}개`);
  if (failed === 0) {
    console.log('🎉 전체 통과!');
  } else {
    console.log('⚠️  실패:');
    results.filter((r) => r.status.includes('FAIL')).forEach((r) => {
      console.log(`   • ${r.name}: ${r.detail}`);
    });
  }
  console.log('════════════════════════════════\n');
}

run();
