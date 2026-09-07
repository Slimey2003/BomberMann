export default class GameTickScheduler {
    private readonly tickRate: number;
    private lastTime = 0;
    private intervalId: ReturnType<typeof setInterval> | undefined;
    private tickCounter = 0;
    private execute: (deltaTime: number, counter: number) => void = () => {};

    constructor(ticksPerSecond: number) {
        if (ticksPerSecond <= 0) {
            throw new Error("ticksPerSecond must be greater than 0");
        }

        this.tickRate = 1000 / ticksPerSecond;
    }

    public start(run: (deltaTime: number, counter: number) => void): void {
        // Schon gestartet: keinen zweiten Interval erzeugen.
        if (this.intervalId !== undefined) {
            return;
        }

        this.execute = run;
        this.lastTime = Date.now();
        this.tickCounter = 0;

        this.intervalId = setInterval(() => this.loop(), this.tickRate);
    }

    public getLastTime() {
        return this.lastTime;
    }

    public stop(): void {
        if (this.intervalId === undefined) {
            return;
        }

        clearInterval(this.intervalId);
        this.intervalId = undefined;
    }

    public isRunning(): boolean {
        return this.intervalId !== undefined;
    }

    private loop(): void {
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastTime;

        this.execute(deltaTime, this.tickCounter);

        this.lastTime = currentTime;
        this.tickCounter++;
    }
}