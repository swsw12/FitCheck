// 이메일 체크 API 실제 응답 구조 확인
const BASE = 'https://web-production-19ef6.up.railway.app';

async function check() {
  const res = await fetch(BASE + '/auth/check-email', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'nobody_' + Date.now() + '@test.com' }),
  });
  console.log('status:', res.status);
  const text = await res.text();
  console.log('raw body:', text);
  try {
    const json = JSON.parse(text);
    console.log('keys:', Object.keys(json));
    console.log('parsed:', JSON.stringify(json, null, 2));
  } catch {}
}
check();
