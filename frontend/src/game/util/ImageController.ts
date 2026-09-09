import type BoundingBox from "@project/utils/BoundingBox";

export default class ImageController {

    private ctx: CanvasRenderingContext2D;
    private imageCache: { [key: string]: HTMLImageElement } = {};
    private backgroundPatternCache: CanvasPattern | null = null;

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }

    public getImage(name: string): HTMLImageElement {
        if (this.imageCache[name]) {
            return this.imageCache[name];
        }
        const img = new Image();
        img.src = "/svg/" + name + ".svg";
        this.imageCache[name] = img;
        return img;
    }


    public drawImage(imageName: string, box: BoundingBox) {
        const img: HTMLImageElement = this.getImage(imageName);
        if (img.complete) {
            this.ctx.drawImage(
                img,
                box.getMinX(),
                box.getMinY(),
                box.getWidth(),
                box.getHeight()
            );
        }
    }
    
    public drawBackground(width: number, height: number) {
        const bgImg = this.getImage("background");
        if (bgImg.complete) {
            if (!this.backgroundPatternCache) {
                this.backgroundPatternCache = this.ctx.createPattern(bgImg, "repeat");
            }
            if (this.backgroundPatternCache) {
                this.ctx.fillStyle = this.backgroundPatternCache;
                this.ctx.fillRect(0, 0, width, height);
            }
        }
    }
}