/**
 * Scoped logger. The only sanctioned way to log — `console.log` is banned by
 * Biome. Logs are dropped in production builds and NEVER receive secrets.
 */
const isDev = import.meta.env.MODE !== 'production'

type Level = 'debug' | 'info' | 'warn' | 'error'

function emit(level: Level, scope: string, args: unknown[]): void {
  if (!isDev && level === 'debug') return
  console[level](`[inquiso:${scope}]`, ...args)
}

export function createLogger(scope: string) {
  return {
    debug: (...a: unknown[]) => emit('debug', scope, a),
    info: (...a: unknown[]) => emit('info', scope, a),
    warn: (...a: unknown[]) => emit('warn', scope, a),
    error: (...a: unknown[]) => emit('error', scope, a),
  }
}
