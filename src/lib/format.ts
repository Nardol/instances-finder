export function format(template: string, params?: Record<string, unknown>): string {
  if (!params) return template;
  return template.replace(/\{(\w+)\}/g, (_match, k) => String(params[k] ?? ''));
}

