import { mod } from "../../../../util/util";
import { Inertial, BaseEntity, DYNAMITE_FUSE_TICK, DYNAMITE_FUSE_RATE, Explosive } from "../entity";
import { Game } from "../game";
import { distance } from "../physics";
import { DYNAMITE_FUSE_STATES } from "../render";
import { ArmaturePiecePose, Block } from "../world";

type DynamiteData = Inertial & Explosive & {
  fuse: number;
  fuseTick: number;
}

export class Dynamite extends BaseEntity<DynamiteData> {
  type: 'dynamite' = 'dynamite';

  constructor(x: number, y: number, fuse?: number, fuseTick?: number) {
    super({
      explosionRadius: 3,
      maxExplosionDamage: 50,
      fuse: fuse === undefined ? 1 : fuse,
      fuseTick: fuseTick === undefined ? DYNAMITE_FUSE_TICK : fuseTick,
      vx: 0,
      vy: 0,
      mass: 1,
      x: x,
      y: y,
      w: 0.5,
      h: 1,
      implements: {
        physical: true,
        inertial: true,
        explosive: true
      }
    });
  }

  protected specifyArmatureSprites(): Record<string, string> {
    return {
      body: 'dynamite-sprites'
    };
  }

  getArmaturePoses(): Record<string, ArmaturePiecePose> {
    return {
      body: {
        animation: 'ignition',
        frame: Math.floor(DYNAMITE_FUSE_STATES * (1 - this.data.fuse))
      }
    };
  }

  onTick(game: Game) {
    this.data.fuseTick = mod(this.data.fuseTick - 1, DYNAMITE_FUSE_TICK);
    if (this.data.fuseTick === 0) {
      if (this.data.fuse > 0){
        this.data.fuse -= DYNAMITE_FUSE_RATE;
        return;
      }
    }
    if (this.data.fuse <= 0) {
      handleDetonation(this.id, this.data, game);
    }
  }
}

export function handleDetonation(id: number, data: Explosive, game: Game) {
  const { x, y, explosionRadius, maxExplosionDamage } = data;

  // delete the detonated thing
  game.world.things.delete(id);

  const { terrain, things } = game.world;
  // handle effect on terrain
  for (let bx = Math.floor(x - explosionRadius); bx <= x + explosionRadius; bx += 1) {
    for (let by = Math.floor(y - explosionRadius); by <= y + explosionRadius; by += 1) {
      // distance from explosion to block
      const d = distance([x, y], [bx, by]);
      if (d > explosionRadius) {
        continue;
      }
      // destroy sufficiently damaged blocks
      const damage = (1 - d / explosionRadius) * maxExplosionDamage;
      const block = terrain.at(bx, by);
      if (block !== Block.Air && damage > 10) {
        game.setBlock(bx, by, Block.Air);
      }
    }
  }
  // handle effect on things
  // for (const thing of things.values()) {
  //   if (!physical(thing)) {
  //     continue;
  //   }
  //   const d = distance([x, y], [thing.x, thing.y]);
  //   if (d > explosionRadius) {
  //     continue;
  //   }
  //   const damage = (1 - d / explosionRadius) * maxExplosionDamage;
  //   // detonate other explosives in range
  //   if (damage > 10 && explosive(thing)) {
  //     thing.detonate();
  //   }
  //   if (mortal(thing)) {
  //     thing.damage(damage);
  //   }
  // }
}
