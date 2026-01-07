/**
 * Logger professionnel pour Mossombi
 * console.log seulement en développement, muet en production
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  minLevel: LogLevel;
  includeTimestamp: boolean;
}

const defaultConfig: LoggerConfig = {
  enabled: __DEV__,
  minLevel: 'debug',
  includeTimestamp: true,
};

class Logger {
  private config: LoggerConfig;

  constructor(config: Partial<LoggerConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  private formatMessage(level: LogLevel, message: string, ...args: any[]): string {
    const timestamp = this.config.includeTimestamp 
      ? `[${new Date().toISOString()}]` 
      : '';
    const prefix = `${timestamp} [${level.toUpperCase()}]`;
    return `${prefix} ${message}`;
  }

  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return level === 'error'; // Toujours logger les erreurs
    
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error'];
    const currentLevelIndex = levels.indexOf(level);
    const minLevelIndex = levels.indexOf(this.config.minLevel);
    
    return currentLevelIndex >= minLevelIndex;
  }

  /**
   * Log de debug (seulement en DEV)
   */
  debug(message: string, ...args: any[]): void {
    if (this.shouldLog('debug')) {
      console.log(this.formatMessage('debug', message), ...args);
    }
  }

  /**
   * Log d'information (seulement en DEV)
   */
  info(message: string, ...args: any[]): void {
    if (this.shouldLog('info')) {
      console.info(this.formatMessage('info', message), ...args);
    }
  }

  /**
   * Log de warning (seulement en DEV)
   */
  warn(message: string, ...args: any[]): void {
    if (this.shouldLog('warn')) {
      console.warn(this.formatMessage('warn', message), ...args);
    }
  }

  /**
   * Log d'erreur (TOUJOURS, même en production)
   */
  error(message: string, error?: Error, ...args: any[]): void {
    console.error(this.formatMessage('error', message), error, ...args);
  }

  /**
   * Log de performance (seulement en DEV)
   */
  perf(label: string, startTime: number): void {
    if (this.shouldLog('debug')) {
      const duration = Date.now() - startTime;
      this.debug(`⚡ Performance: ${label} took ${duration}ms`);
    }
  }
}

// Export singleton
export const logger = new Logger();

// Export class pour tests
export { Logger };

// Helper pour mesurer les performances
export function measurePerf<T>(label: string, fn: () => T): T {
  const start = Date.now();
  const result = fn();
  logger.perf(label, start);
  return result;
}
