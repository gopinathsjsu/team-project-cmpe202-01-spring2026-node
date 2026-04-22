const EVENT_IMAGE_REF_PREFIX = 'event-image:';
const EVENT_IMAGE_STORAGE_PREFIX = 'event-image-data:';

const FALLBACK_IMAGE_URL =
  'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?auto=format&fit=crop&w=800&q=80';

function toStorageKey(ref: string): string {
  return `${EVENT_IMAGE_STORAGE_PREFIX}${ref.slice(EVENT_IMAGE_REF_PREFIX.length)}`;
}

function isWebUrl(value: string): boolean {
  return value.startsWith('http://') || value.startsWith('https://');
}

function isInlineOrBlobUrl(value: string): boolean {
  return value.startsWith('data:') || value.startsWith('blob:');
}

export function storeEventCoverDataUrl(dataUrl: string): string {
  const trimmed = dataUrl.trim();
  if (!trimmed.startsWith('data:image/')) {
    throw new Error('Only image data URLs are supported');
  }

  const ref = `${EVENT_IMAGE_REF_PREFIX}${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  localStorage.setItem(toStorageKey(ref), trimmed);
  return ref;
}

export function resolveEventImageUrl(value?: string | null): string {
  const raw = value?.trim();
  if (!raw) return FALLBACK_IMAGE_URL;

  if (isWebUrl(raw) || isInlineOrBlobUrl(raw)) {
    return raw;
  }

  if (raw.startsWith(EVENT_IMAGE_REF_PREFIX)) {
    const stored = localStorage.getItem(toStorageKey(raw));
    return stored || FALLBACK_IMAGE_URL;
  }

  return FALLBACK_IMAGE_URL;
}
