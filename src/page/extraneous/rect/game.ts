import { Player } from "./entity";
import { ITEMS } from "./item";
import { stepPhysics } from "./physics";
import { Renderer } from "./render";
import { Block, Entity, World } from "./world";

export class Game {
  player: Player;
  world: World;
  renderer: Renderer;

  entityCount: number;
  terrainOutOfDate: boolean;
  actionQueue: (() => void)[];

  constructor(player: Player, world: World, renderer: Renderer) {
    this.player = player;
    this.world = world;
    this.renderer = renderer;
    this.entityCount = 0;
    this.actionQueue = [];
    this.terrainOutOfDate = true;
  }

  spawn(thing: Entity) {
    thing.id = this.entityCount;
    this.world.things.set(thing.id, thing);
    this.entityCount += 1;
  }

  setBlock(x: number, y: number, block: Block) {
    this.world.terrain.set(x, y, block);
    this.terrainOutOfDate = true;
  }

  tick() {
    //quad.shader.uniforms.wind = Math.sin(t / 30) * 2.2;
    stepPhysics(this);
    this.actionQueue.forEach(action => action());
    this.actionQueue = [];
    this.player.inventory.slots.forEach((slot, i) => {
      const item = slot && ITEMS[slot.id];
      item?.onTick && item.onTick({
        user: this.player,
        game: this,
        slotNumber: i
      });
      if (slot?.quantity === 0) {
        this.player.inventory.slots[i] = undefined;
        return;
      }
    })
    
    this.renderer.updateAmbient();
    this.renderer.updateEntities();
    this.renderer.updateInventory(this.player.inventory);
    if (this.terrainOutOfDate) {
      this.renderer.updateTerrain();
      this.terrainOutOfDate = false;
    }
  }
}