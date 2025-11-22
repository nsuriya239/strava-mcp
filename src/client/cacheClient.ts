import NodeCache from "node-cache";

export interface ICacheClient {
    get(key: string): any;
    set(key: string, value: any): void;
    del(key: string): void;
}

export const initializeCacheClient = () => {
    const cache = new NodeCache({
        stdTTL: 60 * 60 * 24,
        checkperiod: 60 * 60 * 24,
    });

    return {
        get: (key: string) => cache.get(key),
        set: (key: string, value: any) => cache.set(key, value),
        del: (key: string) => cache.del(key),
    } as ICacheClient
}   