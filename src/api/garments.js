import { api } from './client';

/**
 * 의류 등록 → 201
 * 필수: kind, sizeName, shoulder, chestWidth, length
 * 선택: sleeve, waistWidth, stretch
 * kind: 티셔츠 / 셔츠 / 니트 / 후디 / 맨투맨
 * stretch: 좋음 / 약간 / 없음
 */
export function createGarment(data) {
  return api('/garments', { method: 'POST', body: data });
}

/** 내 의류 목록 (최신순) */
export function getGarments() {
  return api('/garments');
}
