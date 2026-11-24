type LogLevel = 'debug' | 'info' | 'warn' | 'error'

/**
 * 게임 엔진/UI용 경량 로거.
 * 예외를 삼키지 않고 콘솔에 남긴다.
 */
export function log(level: LogLevel, message: string, meta?: unknown): void {
  const prefix = `[BlackScale:${level}]`
  if (meta !== undefined) {
    console[level === 'debug' ? 'log' : level](prefix, message, meta)
    return
  }
  console[level === 'debug' ? 'log' : level](prefix, message)
}
