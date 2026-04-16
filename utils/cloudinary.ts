// ─────────────────────────────────────────────────────────────
//  Cloudinary — subida de imágenes sin backend
//
//  CONFIGURACIÓN (una sola vez):
//  1. Crea cuenta gratis en https://cloudinary.com
//  2. En tu dashboard copia el "Cloud name"
//  3. Ve a Settings → Upload → Add upload preset
//     - Signing mode: UNSIGNED
//     - Folder: marketplace-acero
//     - Copia el nombre del preset
//  4. Reemplaza los valores abajo o ponlos en .env.local:
//     EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME=tu_cloud_name
//     EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET=tu_preset
// ─────────────────────────────────────────────────────────────

const CLOUD_NAME    = process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME    || 'TU_CLOUD_NAME';
const UPLOAD_PRESET = process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'marketplace_acero';

/**
 * Sube una imagen a Cloudinary y devuelve la URL segura.
 * @param uri  URI local de la imagen (de expo-image-picker)
 * @param folder  Carpeta dentro de Cloudinary (default: 'tiendas')
 */
export async function uploadImage(uri: string, folder = 'tiendas'): Promise<string> {
  if (CLOUD_NAME === 'TU_CLOUD_NAME') {
    throw new Error('Configura EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME en .env.local');
  }

  const formData = new FormData();
  formData.append('file', {
    uri,
    type: 'image/jpeg',
    name: 'photo.jpg',
  } as any);
  formData.append('upload_preset', UPLOAD_PRESET);
  formData.append('folder', folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  const data = await res.json();
  if (data.secure_url) return data.secure_url;
  throw new Error(data.error?.message || 'Error al subir imagen');
}

/** Devuelve URL con transformación para thumbnail (200x200, recortado) */
export function thumbUrl(url: string, size = 200): string {
  if (!url || !url.includes('cloudinary.com')) return url;
  return url.replace('/upload/', `/upload/c_fill,w_${size},h_${size},q_auto,f_auto/`);
}
