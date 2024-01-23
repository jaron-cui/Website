import { Player } from "./entity";
import { stepPhysics } from "./physics";
import { Renderer } from "./render";
import { Block, Entity, World } from "./world";

export class Game {
  player: Player;
  world: World;
  renderer: Renderer;

  entityCount: number;
  actionQueue: (() => void)[];

  constructor(player: Player, world: World, renderer: Renderer) {
    this.player = player;
    this.world = world;
    this.renderer = renderer;
    this.entityCount = 0;
    this.actionQueue = [];
  }

  spawn(thing: Entity) {
    thing.id = this.entityCount;
    this.world.things.set(thing.id, thing);
    this.entityCount += 1;
  }

  setBlock(x: number, y: number, block: Block) {
    this.world.terrain.set(x, y, block);
    this.renderer.updateTerrain();
  }

  tick() {
    this.renderer.updateAmbient();
    this.renderer.updateEntities();
    this.renderer.updateInventory(this.player.inventory);
    //quad.shader.uniforms.wind = Math.sin(t / 30) * 2.2;
    stepPhysics(this);
    this.actionQueue.forEach(action => action());
    this.actionQueue = [];
  }
}