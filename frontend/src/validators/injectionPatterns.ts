export const SCRIPT_PATTERNS: RegExp[] = [
  /<\s*\/?\s*(script|iframe|object|embed|svg|img|style|link|meta|form|body|html|base)\b/i,
  /\b(java|vb)script\s*:/i,
  /\bdata\s*:\s*text\/html/i,
  /\bon(error|load|click|dblclick|mouse\w+|key\w+|focus|blur|change|submit|input|toggle|pointer\w+|animation\w+|begin|abort|unload|resize|scroll)\s*=/i,
  /\b(eval|alert|prompt|confirm|atob|settimeout|setinterval)\s*\(/i,
  /\bdocument\s*\.\s*(cookie|write|location|domain)/i,
  /\bwindow\s*\.\s*(location|open)/i,
  /&#x?[0-9a-f]+;?/i,
  /%3c\s*\/?\s*script/i,
];

export const SQL_PATTERNS: RegExp[] = [
  /\bunion\b\s+(all\s+)?select\b/i,
  /\bselect\b[\s\S]{1,80}\bfrom\b/i,
  /\b(insert\s+into|delete\s+from|drop\s+(table|database|schema|view)|truncate\s+table|alter\s+table|create\s+(table|database))\b/i,
  /\bupdate\b\s+[\w."`]+\s+set\b/i,
  /;\s*(select|insert|update|delete|drop|alter|truncate|exec|create|shutdown)\b/i,
  /\b(exec|execute)\b\s*(\(|xp_|sp_)/i,
  /['"]\s*(or|and)\s+['"\d\w]+\s*(=|like)\s*['"\d\w]+/i,
  /\b(or|and)\b\s+\d+\s*=\s*\d+/i,
  /\/\*[\s\S]*?\*\//,
  /--\s|--$/,
  /\b(waitfor\s+delay|sleep\s*\(\s*\d+|benchmark\s*\(|pg_sleep\s*\()/i,
  /\b(xp_cmdshell|information_schema|pg_catalog|sqlite_master)\b/i,
];

export const NAME_PATTERN = /^[\p{L}\p{N}][\p{L}\p{N} .,()\-_/&+:]*$/u;
export const TEXT_PATTERN = /^[^<>{}\\`$|\u0000-\u0008\u000b\u000c\u000e-\u001f]*$/u;
export const USERNAME_PATTERN = /^[\p{L}\p{N}_.@ -]+$/u;
export const FILENAME_PATTERN = /^[\p{L}\p{N}_\- .]{1,100}\.(jpe?g|png|webp|gif)$/iu;

export const IMAGE_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

export const IMAGE_SIGNATURES: number[][] = [
  [0xff, 0xd8, 0xff],
  [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  [0x47, 0x49, 0x46, 0x38, 0x37, 0x61],
  [0x47, 0x49, 0x46, 0x38, 0x39, 0x61],
  [0x52, 0x49, 0x46, 0x46],
];

export const LIMITS = {
  name: 100,
  title: 150,
  text: 500,
  query: 100,
  username: 50,
  passwordMin: 8,
  passwordMax: 72,
  stock: 1_000_000,
  imageBytes: 4 * 1024 * 1024,
} as const;
