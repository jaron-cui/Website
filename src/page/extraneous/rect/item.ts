import { Dynamite, type Player } from "./entity";
import { Game } from "./game";
import type { Inertial } from "./world";

const _ITEMS: Record<string, ItemDetails> = {};

defineItem('dynamite', 'Dynamite', 1, condition => {
  (condition.user.inventory.slots[condition.slotNumber] as ItemStack).quantity -= 1;
  condition.game.spawn(new Dynamite(condition.user.x, condition.user.y))
  return true;
});
defineItem('pickaxe', 'Pickaxe', 1, () => false);
defineItem('throwing-knife', 'Throwing Knife', 16, () => false);
defineItem('spear', 'Spear', 1, () => false);
defineItem('bow', 'Bow', 1, () => false);

function defineItem(id: string, name: string, maxStack: number, use: (condition: UseCondition) => boolean) {
  _ITEMS[id] = {
    id: id,
    name: name,
    maxStack: maxStack,
    use: use
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

export function useSlot(context: UseCondition) {
  if (handleGenericUse(context)) {
    return;
  }
  handleSlotUse(context);
}

interface UseCondition {
  user: Player;
  game: Game;
  slotNumber: number;
  onBlock?: [number, number];
  onThing?: Inertial;
}

interface ItemDetails {
  id: string;
  name: string;
  maxStack: number;
  use: (conditions: UseCondition) => boolean;
}

// handles using things where it doesn't matter what item is currently selected
function handleGenericUse(context: UseCondition): boolean {
  return false;
}

function handleEmptySlotUse(context: UseCondition): boolean {
  return false;
}

function handleItemUse(context: UseCondition): boolean {
  // TODO: inventory = user.inventory;
  const inventory: Inventory = context.user.inventory;
  const slot = inventory.slots[context.slotNumber] as ItemStack;
  return ITEMS[slot.id].use(context);
}

export function handleSlotUse(context: UseCondition): boolean {
  // TODO: inventory = user.inventory;
  const inventory: Inventory = context.user.inventory;
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