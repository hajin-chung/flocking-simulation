export class Canvas {
  canvasElement: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width: number;
  height: number;

  constructor(canvasElement: HTMLCanvasElement) {
    this.canvasElement = canvasElement;
    this.ctx = canvasElement.getContext("2d")!;
    this.width = canvasElement.clientWidth;
    this.height = canvasElement.clientHeight;
  }

  draw(callback: (ctx: CanvasRenderingContext2D) => void) {
    callback(this.ctx);
  }
}