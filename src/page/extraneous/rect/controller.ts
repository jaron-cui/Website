import { Renderer } from "pixi.js";
import { Game } from "./game";
import { MenuController } from "./menu";

export class Controller {
  game?: Game;
  gameRenderer?: Renderer;
  menu?: MenuController;
  titleScreen?: any;

  constructor() {
    
  }
}