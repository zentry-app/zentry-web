/**
 * Servicio de Rate Limiting para controlar intentos de registro
 * Replica la funcionalidad del RateLimitService de la app móvil
 */

interface RateLimitState {
  attempts: number;
  lastAttempt: number;
  cooldownUntil: number;
}

interface RateLimitConfig {
  maxAttempts: number;
  cooldownMinutes: number;
  windowMinutes: number;
}

class RateLimitService {
  private static instance: RateLimitService;
  private storage: Storage;
  private configs: { [key: string]: RateLimitConfig } = {
    auth: {
      maxAttempts: 5,
      cooldownMinutes: 10,
      windowMinutes: 60
    },
    registration: {
      maxAttempts: 3,
      cooldownMinutes: 15,
      windowMinutes: 60
    }
  };

  private constructor() {
    this.storage = typeof window !== 'undefined' ? window.localStorage : {
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
      length: 0,
      clear: () => {},
      key: () => null
    } as Storage;
  }

  static getInstance(): RateLimitService {
    if (!RateLimitService.instance) {
      RateLimitService.instance = new RateLimitService();
    }
    return RateLimitService.instance;
  }

  private getStorageKey(operation: string): string {
    return `rate_limit_${operation}`;
  }

  private getState(operation: string): RateLimitState {
    const key = this.getStorageKey(operation);
    const stored = this.storage.getItem(key);
    
    if (!stored) {
      return {
        attempts: 0,
        lastAttempt: 0,
        cooldownUntil: 0
      };
    }

    try {
      return JSON.parse(stored);
    } catch {
      return {
        attempts: 0,
        lastAttempt: 0,
        cooldownUntil: 0
      };
    }
  }

  private setState(operation: string, state: RateLimitState): void {
    const key = this.getStorageKey(operation);
    this.storage.setItem(key, JSON.stringify(state));
  }

  /**
   * Verifica si se puede realizar un intento
   */
  async canAttempt(operation: string = 'auth'): Promise<boolean> {
    const config = this.configs[operation];
    if (!config) return true;

    const state = this.getState(operation);
    const now = Date.now();

    // Verificar si está en cooldown
    if (state.cooldownUntil > now) {
      return false;
    }

    // Verificar si la ventana de tiempo ha expirado
    const windowMs = config.windowMinutes * 60 * 1000;
    if (now - state.lastAttempt > windowMs) {
      // Resetear intentos si ha pasado la ventana de tiempo
      this.setState(operation, {
        attempts: 0,
        lastAttempt: 0,
        cooldownUntil: 0
      });
      return true;
    }

    // Verificar si ha excedido el máximo de intentos
    return state.attempts < config.maxAttempts;
  }

  /**
   * Registra un intento
   */
  async recordAttempt(operation: string = 'auth'): Promise<void> {
    const config = this.configs[operation];
    if (!config) return;

    const state = this.getState(operation);
    const now = Date.now();

    const newAttempts = state.attempts + 1;
    let cooldownUntil = 0;

    // Si excede el máximo, establecer cooldown
    if (newAttempts >= config.maxAttempts) {
      cooldownUntil = now + (config.cooldownMinutes * 60 * 1000);
    }

    this.setState(operation, {
      attempts: newAttempts,
      lastAttempt: now,
      cooldownUntil
    });
  }

  /**
   * Obtiene el tiempo restante hasta el próximo intento
   */
  async getTimeUntilNextAttempt(operation: string = 'auth'): Promise<number> {
    const state = this.getState(operation);
    const now = Date.now();

    if (state.cooldownUntil <= now) {
      return 0;
    }

    return Math.ceil((state.cooldownUntil - now) / 1000); // Segundos
  }

  /**
   * Resetea el cooldown para una operación
   */
  resetCooldown(operation: string = 'auth'): void {
    this.setState(operation, {
      attempts: 0,
      lastAttempt: 0,
      cooldownUntil: 0
    });
  }

  /**
   * Obtiene información de debug del estado actual
   */
  getDebugState(operation: string = 'auth'): any {
    const state = this.getState(operation);
    const config = this.configs[operation];
    const now = Date.now();

    return {
      operation,
      attempts: state.attempts,
      maxAttempts: config?.maxAttempts || 0,
      lastAttempt: new Date(state.lastAttempt).toISOString(),
      cooldownUntil: state.cooldownUntil > 0 ? new Date(state.cooldownUntil).toISOString() : null,
      isInCooldown: state.cooldownUntil > now,
      canAttempt: state.cooldownUntil <= now && state.attempts < (config?.maxAttempts || 0)
    };
  }
}

export default RateLimitService.getInstance(); 