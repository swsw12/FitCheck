import { api } from './client';

/**
 * 핏 분석 요청
 * 201 = 새로 생성 (스피너 표시)
 * 200 = 이미 있던 결과 (스피너 X, 바로 표시)
 */
export function createFitting(garmentId) {
  return api('/fittings', { method: 'POST', body: { garmentId } });
}

/** 단일 피팅 조회 (폴링용) */
export function getFitting(fittingId) {
  return api(`/fittings/${fittingId}`);
}

/**
 * 피팅 목록 (히스토리)
 * status 필터: 대기 / 생성중 / 완료 / 실패 / 리포트만
 * → { items: [...], counts: { 대기, 생성중, 완료, 실패, 리포트만 } }
 */
export function getFittings(status) {
  const query = status ? `?status=${encodeURIComponent(status)}` : '';
  return api(`/fittings${query}`);
}

/**
 * 사이즈 비교
 * garmentIds: [id1, id2]
 * → { sizes: [...], recommendedSize: "M" | null }
 */
export function compareFittings(garmentIds) {
  return api('/fittings/compare', { method: 'POST', body: { garmentIds } });
}
