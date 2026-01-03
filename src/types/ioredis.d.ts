declare module "ioredis" {
  interface RedisOptions {
    maxRetriesPerRequest?: number;
    retryDelayOnFailover?: number;
    enableReadyCheck?: boolean;
    lazyConnect?: boolean;
    connectTimeout?: number;
    commandTimeout?: number;
    enableAutoPipelining?: boolean;
  }

  export default class Redis {
    constructor(url: string, options?: RedisOptions);
    publish(channel: string, message: string): Promise<number>;
    subscribe(channel: string): Promise<number>;
    unsubscribe(channel: string): Promise<number>;
    eval(script: string, numberOfKeys: number, ...args: any[]): Promise<any>;
    evalsha(sha1: string, numberOfKeys: number, ...args: any[]): Promise<any>;
    incr(key: string): Promise<number>;
    decr(key: string): Promise<number>;
    pexpire(key: string, milliseconds: number): Promise<number>;
    pttl(key: string): Promise<number>;
    get(key: string): Promise<string | null>;
    del(...keys: string[]): Promise<number>;
    on(event: string, listener: (...args: unknown[]) => void): this;
    quit(): Promise<void>;
  }
}
