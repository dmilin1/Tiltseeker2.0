
type CachedData = {
    data: any;
    expires: number;
    exipryTimeout: NodeJS.Timeout;
}

export default class Cache {
    static cache: { [key: string]: CachedData } = {};

    static async get<T>(key: string, duration: number, fetch: () => Promise<T>): Promise<T> {
        const cached = Cache.cache[key] as CachedData;
        if (cached && cached.expires > Date.now()) {
            clearTimeout(cached.exipryTimeout);
            Cache.cache[key].exipryTimeout = setTimeout(() => delete Cache.cache[key], duration);
            return cached.data;
        }
        const result = await fetch();
        Cache.cache[key] = {
            data: result,
            expires: Date.now() + duration,
            exipryTimeout: setTimeout(() => delete Cache.cache[key], duration),
        };
        return result;
    }
}
