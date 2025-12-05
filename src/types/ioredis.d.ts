declare module "ioredis" {
  export default class Redis {
    constructor(url: string);
    publish(channel: string, message: string): Promise<number>;
    subscribe(channel: string): Promise<number>;
    on(event: string, listener: (...args: unknown[]) => void): this;
    quit(): Promise<void>;
  }
}
