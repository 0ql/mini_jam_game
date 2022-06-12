export default class Vec {
  public x: number
  public y: number
  constructor(x: number, y: number) {
    this.x = x
    this.y = y
  }
  public add(vec: Vec): Vec {
    return new Vec(this.x + vec.x, this.y + vec.y)
  }
  public sub(vec: Vec): Vec {
    return new Vec(this.x - vec.x, this.y - vec.y)
  }
  public mul(vec: Vec): Vec {
    return new Vec(this.x * vec.x, this.y * vec.y)
  }
  public dist(vec: Vec): number {
    return Math.sqrt(Math.pow(this.x - vec.x, 2) + Math.pow(this.y - vec.y, 2))
  }
}
