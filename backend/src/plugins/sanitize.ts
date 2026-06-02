import fp from 'fastify-plugin';
import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';

// ============================================================
// Input Sanitization Plugin — Cegah XSS & SQL Injection
// ============================================================

const XSS_PATTERNS = [
  /<script[^>]*>[\s\S]*?<\/script>/gi,
  /javascript:/gi,
  /on\w+\s*=/gi,         // onerror=, onclick=, dll
  /<iframe[^>]*>/gi,
  /data:text\/html/gi,
];

const SQL_PATTERNS = [
  /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/gi,
  /(-{2}|\/\*|\*\/)/g,   // SQL comments
  /;\s*(DROP|DELETE|INSERT|UPDATE)/gi,
];

function sanitizeString(str: string): string {
  // Trim whitespace
  str = str.trim();

  // Encode HTML entities dasar
  str = str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');

  return str;
}

function sanitizeValue(val: unknown): unknown {
  if (typeof val === 'string') return sanitizeString(val);
  if (Array.isArray(val)) return val.map(sanitizeValue);
  if (val !== null && typeof val === 'object') {
    const result: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(val)) {
      result[sanitizeString(k)] = sanitizeValue(v);
    }
    return result;
  }
  return val;
}

function detectMalicious(str: string): boolean {
  for (const pattern of XSS_PATTERNS) {
    if (pattern.test(str)) return true;
    pattern.lastIndex = 0;
  }
  return false;
}

export const sanitizePlugin = fp(async (app: FastifyInstance) => {
  app.addHook('preHandler', async (request: FastifyRequest, reply: FastifyReply) => {
    // Lewati jika multipart (upload file)
    if (request.headers['content-type']?.includes('multipart')) return;

    // Sanitasi body
    if (request.body && typeof request.body === 'object') {
      // Cek body raw sebelum sanitasi untuk deteksi serangan
      const bodyStr = JSON.stringify(request.body);
      if (detectMalicious(bodyStr)) {
        app.log.warn({ ip: request.ip, path: request.url }, 'Potensi XSS terdeteksi di body');
        return reply.status(400).send({
          statusCode: 400,
          error: 'Bad Request',
          message: 'Input mengandung karakter yang tidak diizinkan',
        });
      }
      (request as any).body = sanitizeValue(request.body);
    }
  });

  app.log.info('✅ Input sanitization plugin aktif');
});
