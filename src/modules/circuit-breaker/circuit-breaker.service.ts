import { Injectable } from '@nestjs/common';
import * as CircuitBreaker from 'opossum';
import { ConfigService } from '@nestjs/config';
import { getConfig } from '../../common/config/configuration';

@Injectable()
export class CircuitBreakerService {
  private circuitBreakerMap = new Map<string, CircuitBreaker<any>>;

  constructor(private readonly configService: ConfigService) {}

  create<T extends (...args: any[]) => Promise<any>>(
    key: string,
    action: T,
  ): CircuitBreaker<T> {
    if (this.circuitBreakerMap.has(key)) {
      return this.circuitBreakerMap.get(key);
    }
    const config = getConfig(this.configService);
    const options = {
      timeout: config.circuitBreaker.timeout,
      errorThresholdPercentage: config.circuitBreaker.errorThresholdPercentage,
      resetTimeout: config.circuitBreaker.resetTimeout,
    };

    const breaker = new CircuitBreaker(action, options);

    // Optional: Logging
    breaker.on('open', () => console.warn(`[CircuitBreaker][${key}] OPEN`));
    breaker.on('halfOpen', () => console.warn(`[CircuitBreaker][${key}] HALF_OPEN`));
    breaker.on('close', () => console.info(`[CircuitBreaker][${key}] CLOSE`));
    breaker.on('fallback', () => console.warn(`[CircuitBreaker][${key}] FALLBACK`));

    this.circuitBreakerMap.set(key, breaker);

    return breaker;
  }

  get<T extends (...args: any[]) => Promise<any>>(key: string): CircuitBreaker<T> | undefined {
    return this.circuitBreakerMap.get(key);
  }
}
