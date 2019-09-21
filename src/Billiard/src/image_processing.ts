class Point {
    x: number;
    y: number;
    constructor(x: number, y: number) {
        this.x = x;
        this.y = y;
    }
}

export function trasformToRectangle(
    image: HTMLCanvasElement,
    tl: Point,
    tr: Point,
    bl: Point,
    br: Point,
    outputShape: { width: number, height: number }
): HTMLCanvasElement {
    const canvas = document.createElement('canvas');
    canvas.width = outputShape.width;
    canvas.height = outputShape.height;
    const context = canvas.getContext("2d")!;
    const project = createProjection(tl, tr, bl, br);
    for (let i = 0; i < outputShape.width; i++) {
        for (let j = 0; j < outputShape.height; j++) {
            const point = project(new Point(i / outputShape.width, j / outputShape.height));
            context.drawImage(image, point.x, point.y, 1, 1, i, j, 1, 1);
        }
    }
    return canvas;
}

function createProjection(
    tl: Point,
    tr: Point,
    bl: Point,
    br: Point,
): (x: Point) => Point {
    // 射影変換の係数を求める
    // http://kondolab.org/archive/2010/research/cadcgtext/ChapE/ChapE02.html
    const x2 = tr.x - tl.x;
    const y2 = tr.y - tl.y;
    const x3 = br.x - tl.x;
    const y3 = br.y - tl.y;
    const x4 = bl.x - tl.x;
    const y4 = bl.y - tl.y;

    const delta123 = x2 * y3 - x3 * y2;
    const delta124 = x2 * y4 - x4 * y2;
    const delta134 = x3 * y4 - x4 * y3;
    const delta1234 = delta123 + delta134;
    const delta234 = delta1234 - delta124;

    const a1 = delta134 * x2;
    const b1 = delta123 * x4;
    const a2 = delta134 * y2;
    const b2 = delta123 * y4;
    const a0 = delta134 - delta234;
    const b0 = delta123 - delta234;
    const c0 = delta234;
    return (p: Point) => new Point(
        (a1 * p.x + b1 * p.y) / (a0 * p.x + b0 * p.y + c0) + tl.x,
        (a2 * p.x + b2 * p.y) / (a0 * p.x + b0 * p.y + c0) + tl.y
    );
}
