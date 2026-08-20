import { Platform } from 'react-native';
import { api } from './client';

/**
 * 이미지 URI 를 FormData 에 파일로 첨부.
 * - 네이티브: RN 방식({uri,name,type}) — RN 이 multipart 파일 파트로 변환.
 * - 웹: 위 방식은 "[object Object]" 문자열이 되어 서버가 파일로 인식 못 함.
 *       URI 를 fetch 해서 Blob 으로 만든 뒤 실제 파일로 첨부한다.
 */
async function appendImage(form, imageUri, fallbackName) {
  if (Platform.OS === 'web') {
    const res = await fetch(imageUri);
    const blob = await res.blob();
    // 확장자 보정 (blob.type 기준)
    const ext = blob.type === 'image/png' ? 'png'
      : blob.type === 'image/webp' ? 'webp' : 'jpg';
    const name = fallbackName.replace(/\.[^.]+$/, '') + '.' + ext;
    form.append('file', blob, name);
  } else {
    form.append('file', {
      uri: imageUri,
      name: fallbackName,
      type: 'image/jpeg',
    });
  }
}

/**
 * 전신 사진 업로드 (multipart)
 * → { photoPath, photoUrl }
 * 최소 512×768, JPG/PNG/WEBP, 10MB 이하
 */
export async function uploadProfilePhoto(imageUri) {
  const form = new FormData();
  await appendImage(form, imageUri, 'profile.jpg');
  return api('/photos/profile', { method: 'PUT', body: form, multipart: true });
}

/**
 * 의류 사진 업로드 (multipart)
 * → { photoPath, photoUrl }
 */
export async function uploadGarmentPhoto(garmentId, imageUri) {
  const form = new FormData();
  await appendImage(form, imageUri, 'garment.jpg');
  return api(`/photos/garments/${garmentId}`, {
    method: 'PUT',
    body: form,
    multipart: true,
  });
}
