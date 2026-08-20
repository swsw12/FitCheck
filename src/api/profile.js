import { api } from './client';

/** 프로필 조회 → 200 or 404 PROFILE_NOT_FOUND */
export function getProfile() {
  return api('/profile');
}

/**
 * 프로필 전체 교체 (PUT).
 * 안 보낸 치수는 지워지고 '추정'으로 돌아간다.
 */
export function putProfile(data) {
  return api('/profile', { method: 'PUT', body: data });
}
