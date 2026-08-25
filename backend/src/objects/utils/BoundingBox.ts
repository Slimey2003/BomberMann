import type Vector from "./Vector";

export default class BoundingBox {
    private minX: number;
    private minY: number;

    private maxX: number;
    private maxY: number;

    private height: number;
    private width: number;

    constructor(center: Vector, height: number, width: number) {
        this.height = height;
        this.width = width;
        const halfHeight = height / 2;
        const halfWidth = width / 2;
        this.minX = center.getX() - halfWidth;
        this.maxX = center.getX() + halfWidth;

        this.minY = center.getY() - halfHeight;
        this.maxY = center.getY() + halfHeight;
    }

    public getHeight() {
        return this.height;
    }

    public getWidth() {
        return this.width;
    }

    public centerX() {
        return this.getMinX() + (this.width / 2);
    }

    public centerY() {
        return this.getMinY() + (this.height / 2);
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
    
    public overlaps(box: BoundingBox): boolean {
        return this.minX <= box.getMaxX() &&
               this.maxX >= box.getMinX() &&
               this.minY <= box.getMaxY() &&
               this.maxY >= box.getMinY();
    }

    /**
     * Use Liang-Barsky-Algorithmus
     */
    public intersects(start: Vector, end: Vector): number | null {
        if (this.contains(start) || this.contains(end)) {
            return 0.0;
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
                return null;
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
        if (tMin <= tMax && tMax >= 0 && tMin <= 1.0) {
            return tMin;
        }

        return null;
    }
}