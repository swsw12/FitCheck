import { Platform } from 'react-native';

// 웹(Vercel)에서는 CORS 회피를 위해 same-origin '/api' 로 호출 → vercel.json 이 Railway 로 프록시.
// 네이티브(Expo Go/빌드)에서는 CORS 제약이 없으므로 Railway 주소를 직접 호출.
const BASE_URL =
  Platform.OS === 'web'
    ? '/api'
    : 'https://web-production-19ef6.up.railway.app';

let _getToken = () => null;

/**
 * AuthContext 에서 getToken 함수를 주입받는다.
 * App.js 에서 AuthProvider 마운트 시 호출.
 */
export function setTokenGetter(fn) {
  _getToken = fn;
}

/**
 * 공통 fetch 래퍼.
 * - 자동으로 Authorization 헤더 부착
 * - JSON 응답 파싱
 * - 에러 시 { error: { code, message } } 규격 그대로 throw
 */
export async function api(path, options = {}) {
  const { body, multipart, ...rest } = options;

  const headers = { ...rest.headers };
  const token = _getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let fetchBody = body;

  if (multipart) {
    // FormData — Content-Type 은 fetch 가 자동 세팅
    fetchBody = body; // FormData 객체
  } else if (body && typeof body === 'object') {
    headers['Content-Type'] = 'application/json';
    fetchBody = JSON.stringify(body);
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers,
    body: fetchBody,
  });

  // 204 No Content
  if (res.status === 204) return null;

  const data = await res.json().catch(() => null);

  if (!res.ok) {
    const err = new Error(data?.error?.message || `HTTP ${res.status}`);
    err.status = res.status;
    err.code = data?.error?.code || 'UNKNOWN';
    throw err;
  }

  // POST /fittings 는 201(새로 생성) vs 200(기존) 구분이 필요
  if (data !== null && data !== undefined) {
    data._httpStatus = res.status;
  }

  return data;
}
