import type Vector from "@project/utils/Vector";

export function drawExplosionBeam(ctx: CanvasRenderingContext2D, img: HTMLImageElement | undefined, vec: Vector, startX: number, startY: number, size: number) {
    if (!img) return;
    const halfSize = size / 2;
    const diffX = vec.getX() - startX;
    const diffY = vec.getY() - startY;

    let drawX = 0;
    let drawY = 0;
    let drawW = diffX !== 0 ? Math.abs(diffX) : size;
    let drawH = diffY !== 0 ? Math.abs(diffY) : size;

    if (diffX > 0) {
        drawX = startX + halfSize;
        drawY = startY - halfSize;
    } else if (diffX < 0) {
        drawX = vec.getX() - halfSize;
        drawY = startY - halfSize;
    } else if (diffY > 0) {
        drawX = startX - halfSize;
        drawY = startY + halfSize;
    } else if (diffY < 0) {
        drawX = startX - halfSize;
        drawY = vec.getY() - halfSize;
    }

    if (drawW > 0 && drawH > 0) {
        ctx.drawImage(
            img,
            Math.round(drawX),
            Math.round(drawY),
            Math.round(drawW),
            Math.round(drawH)
        );
    }
}