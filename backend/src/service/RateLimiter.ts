import type { UUID } from "crypto";

export default class RateLimiter {
    private limits: {[key: string]: number[]};
    private windowTime: number;
    private maxLimit: number;

    constructor(windowTime: number, maxLimit: number, cleanupTime: number) {
        this.windowTime = windowTime;
        this.maxLimit = maxLimit;
        this.limits = {};
        setInterval(() => this.cleanup, cleanupTime);
    }

    public isLimited(userid: UUID | undefined) {
        if (!userid) return true;
        const now = Date.now();
        let timestamps = this.limits[userid] || []
        timestamps = timestamps.filter(t => now - t < this.windowTime);
        if (timestamps.length >= this.maxLimit) {
            this.limits[userid] = timestamps;
            return true;
        }

        this.limits[userid] = timestamps;
        timestamps.push(now);
        return false;
    }

    private cleanup() {
        const now = Date.now();
        for (const key of Object.keys(this.limits)) {
            const valid = this.limits[key].filter(t => now - t < this.windowTime);
            if (0 === valid.length) {
                delete this.limits[key];
            }
        }
    }
}