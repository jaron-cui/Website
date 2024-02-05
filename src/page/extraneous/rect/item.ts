import { mod } from "../../../util/util";
import { DYNAMITE_FUSE_RATE, DYNAMITE_FUSE_TICK, Dynamite, Entity, Inertial, type Player } from "./entity";
import { Game } from "./game";

const _ITEMS: Record<string, ItemDetails> = {};

defineItem('dynamite', 'Dynamite', 1, condition => {
  const user = condition.user.data;
  const item = user.inventory.slots[condition.slotNumber] as ItemStack;
  // if already ignited, throw the dynamite
  if (item.data['ignited']) {
    condition.game.spawn(new Dynamite(user.x, user.y, item.data['fuse'], item.data['fuseTick']));
    item.quantity -= 1;
    item.data = {};
    return true;
  }
  // if not ignited, ignite
  item.data['ignited'] = 1;
  item.data['fuse'] = 1;
  item.data['fuseTick'] = DYNAMITE_FUSE_TICK;
  return true;
}, condition => {
  const user = condition.user.data;
  const item = user.inventory.slots[condition.slotNumber] as ItemStack;
  if (item.data['ignited']) {
    item.data['fuseTick'] = mod(item.data['fuseTick'] - 1, DYNAMITE_FUSE_TICK);
    if (item.data['fuseTick'] === 0) {
      if (item.data['fuse'] > 0) {
        item.data['fuse'] -= DYNAMITE_FUSE_RATE;
      } else {
        condition.game.spawn(new Dynamite(user.x, user.y, 0, 0));
        item.quantity -= 1;
        item.data = {};
      }
    }
  }
});
defineItem('pickaxe', 'Pickaxe', 1, () => false);
defineItem('throwing-knife', 'Throwing Knife', 16, () => false);
defineItem('spear', 'Spear', 1, () => false);
defineItem('bow', 'Bow', 1, () => false);

function defineItem(id: string, name: string, maxStack: number, use: (condition: ItemContext) => boolean, onTick?: (condition: ItemContext) => void) {
  _ITEMS[id] = {
    id: id,
    name: name,
    maxStack: maxStack,
    use: use,
    onTick: onTick
  };
}

export const ITEMS: Readonly<Record<string, ItemDetails>> = Object.freeze(_ITEMS);

export interface Inventory {
  slots: (ItemStack | undefined)[];
}

export interface PlayerInventory extends Inventory {
  selected: number;
}

export interface ItemStack {
  id: string;
  quantity: number;
  data: Record<string, number>;
}

export function useSlot(context: ItemContext) {
  if (handleGenericUse(context)) {
    return;
  }
  handleSlotUse(context);
}

interface ItemContext {
  user: Player;
  game: Game;
  slotNumber: number;
  onBlock?: [number, number];
  onThing?: Entity;
}

interface ItemDetails {
  id: string;
  name: string;
  maxStack: number;
  use: (conditions: ItemContext) => boolean;
  onTick?: (conditions: ItemContext) => void;
}

// handles using things where it doesn't matter what item is currently selected
function handleGenericUse(context: ItemContext): boolean {
  return false;
}

function handleEmptySlotUse(context: ItemContext): boolean {
  return false;
}

function handleItemUse(context: ItemContext): boolean {
  // TODO: inventory = user.inventory;
  const inventory: Inventory = context.user.data.inventory;
  const slot = inventory.slots[context.slotNumber] as ItemStack;
  return ITEMS[slot.id].use(context);
}

export function handleSlotUse(context: ItemContext): boolean {
  // TODO: inventory = user.inventory;
  const inventory: Inventory = context.user.data.inventory;
  if (context.slotNumber < 0 || context.slotNumber >= inventory.slots.length) {
    return false;
  }
  const slot = inventory.slots[context.slotNumber];
  if (slot) {
    return handleItemUse(context);
  } else {
    return handleEmptySlotUse(context);
  }
}