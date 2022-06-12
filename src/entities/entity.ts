import type Vec from "src/util/vec"

export default interface Entity {
  pos: Vec
  vel: Vec
  size: Vec
  update: () => void
  draw: () => void
}
