export function normalizeGoogleDriveImageUrl(input: string) {
  const value = input.trim();
  if (!value) return '';

  const fileIdMatch = value.match(/\/d\/([a-zA-Z0-9_-]+)/);
  if (fileIdMatch?.[1]) {
    return `https://drive.google.com/uc?export=view&id=${fileIdMatch[1]}`;
  }

  const openMatch = value.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (openMatch?.[1]) {
    return `https://drive.google.com/uc?export=view&id=${openMatch[1]}`;
  }

  return value;
}

export async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Conversion image impossible.'));
      }
    };
    reader.onerror = () => reject(new Error('Lecture du fichier impossible.'));
    reader.readAsDataURL(file);
  });
}

export async function resolveImageInput(params: {
  urlInput?: string | null;
  file?: File | null;
  maxMb?: number;
}) {
  const maxMb = params.maxMb ?? 2;

  if (params.file) {
    if (!params.file.type.startsWith('image/')) {
      throw new Error('Le fichier sélectionné doit être une image.');
    }
    if (params.file.size > maxMb * 1024 * 1024) {
      throw new Error(`Image trop lourde (max ${maxMb} MB).`);
    }
    return fileToDataUrl(params.file);
  }

  const normalizedUrl = normalizeGoogleDriveImageUrl(params.urlInput || '');
  return normalizedUrl || null;
}
