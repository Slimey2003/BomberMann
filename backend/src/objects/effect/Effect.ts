export default class Effect {
    static SPEED = 0;
    static STRANGE = 1;
    static RANGE = 2;

    static SPEED_SCALE_MULTIPLE = 2;
    static STRANGE_SCALE_MULTIPLE = 2;
    static RANGE_SCALE_MULTIPLE = 2;

    private id: number;
    private scale: number = 2;
    private multipleScale: number;

    constructor(id: number, multipleScale: number) {
        this.id = id;
        this.multipleScale = multipleScale;
    }

    public static getEffectById(id: number): Effect | undefined {
        switch(id) {
            case Effect.SPEED:
                return new Effect(id, Effect.SPEED_SCALE_MULTIPLE);
            case Effect.STRANGE:
                return new Effect(id, Effect.STRANGE_SCALE_MULTIPLE);
            case Effect.RANGE:
                return new Effect(id, Effect.RANGE_SCALE_MULTIPLE);
        }
    }

    public getId(): number {
        return this.id;
    }

    public getScale() {
        return this.scale;
    }

    public addScale() {
        this.scale * this.multipleScale;
    }
}