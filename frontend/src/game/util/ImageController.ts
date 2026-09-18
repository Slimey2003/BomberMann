import type BoundingBox from "@project/utils/BoundingBox";

export default class ImageController {
    private static imageCache: { [key: string]: HTMLImageElement } = {};
    private ctx: CanvasRenderingContext2D;
    private backgroundPatternCache: CanvasPattern | null = null;

    public static async preloadImages(names: string[]): Promise<void> {
        const promises = names.map((name) => {
           
            return new Promise<void>((resolve, reject) => {
                 if (this.imageCache[name]) {
                    resolve();
                    return;
                }
                const img = new Image();
                img.src = "/svg/" + name + ".svg";
                img.onload = () => {
                    this.imageCache[name] = img;
                    resolve();
                };
                img.onerror = () => {
                    console.error(`Fehler beim Laden von Bild: /svg/${name}.svg`);
                    resolve(); // Verhindert endloses Hängen, falls ein Bild fehlt
                };
            });
        });
        await Promise.all(promises);
        console.log("Loaded All Images")
    }

    constructor(ctx: CanvasRenderingContext2D) {
        this.ctx = ctx;
    }



    public static getImage(name: string): HTMLImageElement {
        if (this.imageCache[name]) {
            return this.imageCache[name];
        }
        const img = new Image();
        img.src = "/svg/" + name + ".svg";
        this.imageCache[name] = img;
        return img;
    }

    public drawImage(imageName: string, box: BoundingBox): void {
        const img: HTMLImageElement = ImageController.getImage(imageName);
        if (img.complete && img.naturalHeight > 0) {
            this.ctx.drawImage(
                img,
                box.getMinX(),
                box.getMinY(),
                box.getWidth(),
                box.getHeight()
            );
        }
    }
    
    public drawBackground(width: number, height: number): void {
        const bgImg = ImageController.getImage("background");
        if (bgImg.complete && bgImg.naturalHeight > 0) {
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