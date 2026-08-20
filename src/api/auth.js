import { api } from './client';

/** 이메일 존재 여부 확인 → { exists: boolean } */
export function checkEmail(email) {
  return api('/auth/check', { method: 'POST', body: { email } });
}

/** 로그인 → { token, userId } */
export function login(email, password) {
  return api('/auth/login', { method: 'POST', body: { email, password } });
}

/** 가입 → { token, userId } (가입 즉시 토큰 발급) */
export function signup(email, password, isOver14 = true) {
  return api('/auth/signup', {
    method: 'POST',
    body: { email, password, isOver14 },
  });
}
