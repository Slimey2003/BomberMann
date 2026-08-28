export default class Vector {
    public static readonly EPSILON = 1e-10;
    public static nullVector = new Vector(0, 0); 
    
    private x: number;
    private y: number;

    constructor(x: number, y: number) {
        if (Number.isNaN(x) || Number.isNaN(y)) {
            throw new TypeError("Die Eingabe ist keine Number (NaN)");
        }
        
        if (!Number.isFinite(x) || !Number.isFinite(y)) {
            throw new TypeError("Die Eingabe ist nicht Finite (endlich)");
        }
        
        this.x = x;
        this.y = y;
    }
    
    public getX(): number {
        return this.x;
    }

    public getY(): number {
        return this.y;
    }

    public isVector(x: number, y: number): boolean {
        return Math.abs(this.x - x) < Vector.EPSILON && Math.abs(this.y - y) < Vector.EPSILON; 
    }

    public equals(vector: Vector): boolean {
        return Math.abs(this.x - vector.x) < Vector.EPSILON && Math.abs(this.y - vector.y) < Vector.EPSILON;
    }

    public add(vector: Vector): Vector {
        return new Vector(this.x + vector.x, this.y + vector.y);
    }

    public subtract(vector: Vector): Vector {
        return new Vector(this.x - vector.x, this.y - vector.y);
    }

    public scale(scalar: number): Vector {
        if (Number.isNaN(scalar) || !Number.isFinite(scalar)) {
            throw new TypeError("Scalar must be a finite number.");
        }
        return new Vector(this.x * scalar, this.y * scalar);
    }

    public dot(vector: Vector): number {
        return (this.x * vector.x) + (this.y * vector.y);
    }

    public magnitude(): number {
        return Math.sqrt((this.x * this.x) + (this.y * this.y));
    }

    public normalize(): Vector {
        const mag = this.magnitude();
        if (mag === 0) {
            throw new Error("Kann kein Null Vector Normalize");
        }
        return this.scale(1 / mag);
    }

    public getCopy(): Vector {
        return new Vector(this.x, this.y);
    }

    public toHashKey(): string {
        return this.x.toFixed(2) + "|" + this.y.toFixed(2);
    }
}