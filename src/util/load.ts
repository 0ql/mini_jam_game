import * as PIXI from "pixi.js"

export const loadAnimatedSprite = async (path: string, name: string): Promise<PIXI.Texture[]> => {
  const texture = PIXI.Texture.from(`../sprites/${path}${name}/${name}.png`)
  const texture_jsn = await (await fetch(`../sprites/${path}${name}/${name}.json`)).json()

  const sprite_sheet = new PIXI.Spritesheet(texture, texture_jsn);
  sprite_sheet.parse(() => console.log("finished parsing " + name))
  const texture_array: PIXI.Texture[] = [];
  const texture_array_names = Object.keys(sprite_sheet.textures);
  for (let i = 0; i < texture_array_names.length; i++) {
    let texture = PIXI.Texture.from(texture_array_names[i]);
    texture_array.push(texture);
  };
  return texture_array
}
