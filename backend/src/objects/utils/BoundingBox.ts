import type Vector from "./Vector";

export default class BoundingBox {
    private minX: number;
    private minY: number;

    private maxX: number;
    private maxY: number;

    constructor(center: Vector, height: number, width: number) {
        const halfHeight = height / 2;
        const halfWidth = width / 2;
        this.minX = center.getX() - halfWidth;
        this.maxX = center.getX() + halfWidth;

        this.minY = center.getY() - halfHeight;
        this.maxY = center.getY() + halfHeight;
    }

    public getMinX() {
        return this.minX;
    }

    public getMaxX() {
        return this.maxX;
    }

    public getMinY() {
        return this.minY;
    }

    public getMaxY() {
        return this.maxY;
    }

    public contains(vector: Vector): boolean {
        return vector.getX() >= this.minX &&
               vector.getX() <= this.maxX &&
               vector.getY() >= this.minY &&
               vector.getY() <= this.maxY;
    }

    public overlabs(box: BoundingBox) {
        return box.getMinX() >= this.minX &&
               box.getMaxX() <= this.maxX &&
               box.getMinY() >= this.minY &&
               box.getMaxY() <= this.maxY;
    }

    /**
     * Use Liang-Barsky-Algorithmus
     */
    public intersects(start: Vector, end: Vector): boolean {
        if (this.contains(start) || this.contains(end)) {
            return true;
        }

        const dx = end.getX() - start.getX();
        const dy = end.getY() - start.getY();

        let tMin = 0.0;
        let tMax = 1.0;

        const p = [-dx, dx, -dy, dy];
        const q = [
            start.getX() - this.minX,
            this.maxX - start.getX(),
            start.getY() - this.minY,
            this.maxY - start.getY()
        ];

        for (let i = 0; i < 4; i++) {
            if (p[i] === 0 && q[i] < 0) {
                return false;
            }
            if (p[i] !== 0) {
                const r = q[i] / p[i];
                if (p[i] < 0) {
                    tMin = Math.max(tMin, r);
                } else {
                    tMax = Math.min(tMax, r);
                }
            }
        }

        return tMin <= tMax;
    }
}