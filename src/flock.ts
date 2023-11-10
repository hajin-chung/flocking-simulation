function random(s: number, e: number) {
  return Math.random() * (e - s) + s;
}

export class Flock {
  width: number;
  height: number;
  boidcount = 200;
  boids: Boid[] = [];
  balls: Ball[] = [];
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d")!;
    this.width = canvas.width;
    this.height = canvas.height;

    this.canvas.onmousemove = (evt) => {
      if (!this.balls[0]) this.balls.push(new Ball(evt.x, evt.y, evt.altKey));
      else {
        this.balls[0].p = new Vector({ x: evt.x, y: evt.y });
        this.balls[0].attract = evt.altKey;
      }
      // if (evt.altKey) this.balls.push(new Ball(evt.x, evt.y, false));
      // else this.balls.push(new Ball(evt.x, evt.y, true));
    };

    for (let i = 0; i < this.boidcount; i++) {
      this.boids.push(new Boid(this.width, this.height));
    }
  }

  update(dt: number) {
    this.boids.forEach((boid) => {
      boid.update(dt, this.boids, this.balls);
    });
  }

  draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.boids.forEach((boid) => boid.draw(this.ctx));
    this.balls.forEach((ball) => ball.draw(this.ctx));
  }
}

const MAX_V = 500;
const MAX_A = 10;
const LOCAL_RANGE = 50;
let ALIGNMENT_FACTOR = 1;
let SPEERATION_FACTOR = 1;
let COHESION_FACTOR = 1;
let timeSum = 0;
const AVOID_FACTOR = 2;
const MAX_FORCE = 100;

class Boid {
  width: number;
  height: number;
  p: Vector;
  v: Vector;
  a: Vector;
  r = 4;

  constructor(width: number, height: number) {
    this.width = width;
    this.height = height;
    this.p = new Vector({
      x: random(0, this.width),
      y: random(0, this.height),
    });
    this.v = new Vector({ x: random(-MAX_V, MAX_V), y: random(-MAX_V, MAX_V) });
    this.a = new Vector({ x: random(-MAX_A, MAX_A), y: random(-MAX_A, MAX_A) });
  }

  flocking(boids: Boid[], balls: Ball[]) {
    let count = 0;
    let align = new Vector({ x: 0, y: 0 });
    let separate = new Vector({ x: 0, y: 0 });
    let cohesion = new Vector({ x: 0, y: 0 });

    boids.forEach((other) => {
      const dist = Vector.dist(this.p, other.p);
      if (dist < LOCAL_RANGE && dist !== 0) {
        count++;
        align = align.add(other.v);
        separate = separate.add(this.p.sub(other.p).norm());
        cohesion = cohesion.add(other.p);
      }
    });

    if (count > 0) {
      align = align.div(count).setMagnitude(MAX_V).sub(this.v).limit(MAX_FORCE);
      separate = separate
        .div(count)
        .setMagnitude(MAX_V)
        .sub(this.v)
        .limit(MAX_FORCE);
      cohesion = cohesion
        .div(count)
        .sub(this.p)
        .setMagnitude(MAX_V)
        .sub(this.v)
        .limit(MAX_FORCE);
      this.a = Vector.empty()
        .add(align.mult(ALIGNMENT_FACTOR))
        .add(separate.mult(SPEERATION_FACTOR))
        .add(cohesion.mult(COHESION_FACTOR));
    }

    let ballCount = 0;
    let avoid = new Vector({ x: 0, y: 0 });

    balls.forEach((ball) => {
      const dist = Vector.dist(this.p, ball.p);
      if (dist < LOCAL_RANGE) {
        ballCount++;
        avoid = avoid.add(ball.p.sub(this.p).mult(ball.attract ? 1 : -1));
      }
    });

    if (ballCount > 0) {
      avoid = avoid.div(ballCount).sub(this.v);
      this.a = this.a.add(avoid.mult(AVOID_FACTOR));
    }
  }

  update(dt: number, boids: Boid[], balls: Ball[]) {
    timeSum += dt;
    ALIGNMENT_FACTOR = 1 + Math.sin(timeSum);
    SPEERATION_FACTOR = Math.cos(2 * timeSum) + 1;
    COHESION_FACTOR = Math.sin(timeSum) + 1;
    this.p = this.p.add(this.v.mult(dt));
    this.v = this.v.add(this.a.mult(dt));

    this.flocking(boids, balls);

    if (this.p.x > this.width) this.p.x = 0;
    if (this.p.x < 0) this.p.x = this.width;
    if (this.p.y > this.height) this.p.y = 0;
    if (this.p.y < 0) this.p.y = this.height;

    if (Math.abs(this.v.magnitude()) > MAX_V) {
      this.v = this.v.setMagnitude(MAX_V);
    }
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    let theta = Math.acos(this.v.norm().x);
    if (this.v.norm().y < 0) theta = 2 * Math.PI - theta;
    ctx.moveTo(
      this.p.x + Math.cos(theta) * this.r,
      this.p.y + Math.sin(theta) * this.r
    );
    ctx.lineTo(
      this.p.x + Math.cos(theta - (Math.PI * 5) / 6) * this.r,
      this.p.y + Math.sin(theta - (Math.PI * 5) / 6) * this.r
    );
    ctx.lineTo(
      this.p.x + Math.cos(theta + (Math.PI * 5) / 6) * this.r,
      this.p.y + Math.sin(theta + (Math.PI * 5) / 6) * this.r
    );
    ctx.fill();
  }
}

class Ball {
  p: Vector;
  attract: boolean;

  constructor(x: number, y: number, attract: boolean) {
    this.p = new Vector({ x, y });
    this.attract = attract;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.beginPath();
    ctx.arc(this.p.x, this.p.y, 2, 0, 2 * Math.PI);
    ctx.fill();
  }
}

class Vector {
  x: number;
  y: number;

  constructor({ x = 0, y = 0 }: { x: number; y: number }) {
    this.x = x;
    this.y = y;
  }

  copy(v: Vector) {
    return new Vector({
      x: v.x,
      y: v.y,
    });
  }

  static empty() {
    return new Vector({ x: 0, y: 0 });
  }

  static dist(a: Vector, b: Vector) {
    return Math.sqrt(Math.pow(a.x - b.x, 2) + Math.pow(a.y - b.y, 2));
  }

  setMagnitude(m: number) {
    return this.norm().mult(m);
  }

  magnitude() {
    return Math.sqrt(Math.pow(this.x, 2) + Math.pow(this.y, 2));
  }

  dist(d: Vector) {
    return Vector.dist(this, d);
  }

  norm() {
    const magnitude = this.magnitude();
    return new Vector({ x: this.x / magnitude, y: this.y / magnitude });
  }

  add(a: Vector) {
    return new Vector({ x: this.x + a.x, y: this.y + a.y });
  }

  sub(s: Vector) {
    return new Vector({ x: this.x - s.x, y: this.y - s.y });
  }

  div(d: number) {
    return new Vector({ x: this.x / d, y: this.y / d });
  }

  mult(m: number) {
    return new Vector({ x: this.x * m, y: this.y * m });
  }

  limit(l: number) {
    if (this.magnitude() > l) {
      this.setMagnitude(l);
      return this;
    }
    return this;
  }
}
