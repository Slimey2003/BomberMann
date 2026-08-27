export default class GameTickScheduler {
    private tickRate: number;
    private lastTime: number;
    private intervalId: NodeJS.Timeout | undefined;
    private tickCounter: number;
    private execute: (deltaTime: number, counter: number) => void;

    constructor(ticksPerSecond: number) {
        this.tickRate = 1000 / ticksPerSecond;
        this.lastTime = 0;
        this.tickCounter = 0;
        this.execute = () => {};
    }

    public start(run: (deltaTime: number, counter: number) => void): void {
        if (this.intervalId !== null) {
            return;
        }
        this.execute = run;
        
        this.lastTime = performance.now();
        this.intervalId = setInterval(() => this.loop(), this.tickRate);
    }

    public stop(): void {
        if (this.intervalId !== null) {
            clearInterval(this.intervalId);
            this.intervalId = undefined;
        }
    }

    private loop(): void {
        this.tickCounter++;
        const currentTime: number = performance.now();
        const deltaTime: number = currentTime - this.lastTime;

        this.execute(deltaTime, this.tickCounter);

        this.lastTime = currentTime;
    }
}