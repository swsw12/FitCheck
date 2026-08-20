import { api } from './client';

/**
 * 전신 사진 업로드 (multipart)
 * → { photoPath, photoUrl }
 * 최소 512×768, JPG/PNG/WEBP, 10MB 이하
 */
export function uploadProfilePhoto(imageUri) {
  const form = new FormData();
  form.append('file', {
    uri: imageUri,
    name: 'profile.jpg',
    type: 'image/jpeg',
  });
  return api('/photos/profile', { method: 'PUT', body: form, multipart: true });
}

/**
 * 의류 사진 업로드 (multipart)
 * → { photoPath, photoUrl }
 */
export function uploadGarmentPhoto(garmentId, imageUri) {
  const form = new FormData();
  form.append('file', {
    uri: imageUri,
    name: 'garment.jpg',
    type: 'image/jpeg',
  });
  return api(`/photos/garments/${garmentId}`, {
    method: 'PUT',
    body: form,
    multipart: true,
  });
}
