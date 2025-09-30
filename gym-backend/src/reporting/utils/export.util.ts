export type ExportKind = 'csv' | 'pdf';

export function sanitizeBaseName(name: string): string {
  // remove problematic chars for Content-Disposition filenames
  return name.replace(/[\\/:*?"<>|]+/g, '-').trim() || 'export';
}

function formatTimestamp(tz = 'Asia/Riyadh'): string {
  // yyyy-MM-dd_HH-mm-ss using built-in Intl with timezone
  const d = new Date();
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(d);

  const byType = Object.fromEntries(parts.map((p) => [p.type, p.value]));
  const yyyy = byType.year ?? '0000';
  const mm = byType.month ?? '00';
  const dd = byType.day ?? '00';
  const HH = (byType.hour ?? '00').padStart(2, '0');
  const MM = (byType.minute ?? '00').padStart(2, '0');
  const SS = (byType.second ?? '00').padStart(2, '0');
  return `${yyyy}-${mm}-${dd}_${HH}-${MM}-${SS}`;
}

export function withTimestamp(base: string, tz = 'Asia/Riyadh'): string {
  return `${sanitizeBaseName(base)}_${formatTimestamp(tz)}`;
}

export function ensureExtension(filename: string, kind: ExportKind): string {
  const ext = kind.toLowerCase();
  return filename.toLowerCase().endsWith(`.${ext}`)
    ? filename
    : `${filename}.${ext}`;
}

export function contentDispositionAttachment(filename: string): string {
  // RFC5987 filename* for UTF-8 safety
  const ascii = filename.replace(/[^\x20-\x7E]/g, '_');
  return `attachment; filename="${ascii}"; filename*=UTF-8''${encodeRFC5987(
    filename,
  )}`;
}

function encodeRFC5987(value: string): string {
  // encode UTF-8 then percent-encode RFC5987 specials
  return encodeURIComponent(value).replace(
    /['()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

/** Standardize export payload shape (filename/mime/buffer/disposition) */
export function buildExportPayload(
  baseName: string,
  kind: ExportKind,
  buffer: Buffer,
  mime?: string,
) {
  const stamped = withTimestamp(baseName);
  const finalName = ensureExtension(stamped, kind);
  const contentType =
    mime ?? (kind === 'csv' ? 'text/csv; charset=utf-8' : 'application/pdf');

  return {
    filename: finalName,
    mime: contentType,
    buffer,
    disposition: contentDispositionAttachment(finalName),
  };
}
