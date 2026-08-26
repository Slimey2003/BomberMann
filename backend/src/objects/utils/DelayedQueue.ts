export interface Delayed {
    getDelay(): number;
}

export default class DelayQueue<T extends Delayed> {
    private elements: T[];

    constructor() {
        this.elements = [];
    }

    public getValues(): T[] {
        return [...this.elements];
    }

    public put(...element: T[]): void {
        this.elements.push(...element);
        this.elements.sort((a, b) => a.getDelay() - b.getDelay());
    }

    public delete(element: T) {
        this.elements = this.elements.filter(e => e !== element);
    }

    public clear() {
        this.elements = [];
    }

    public poll(): T | undefined {
        if (this.elements.length === 0) {
            return undefined;
        }

        if (this.elements[0].getDelay() <= 0) {
            return this.elements.shift();
        }
    }
}