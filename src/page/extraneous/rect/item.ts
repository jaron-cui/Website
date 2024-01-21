import type { Player } from "./entity";
import type { Inertial, World } from "./world";

const ITEMS: Record<string, ItemDetails> = {
  dynamite: {
    name: 'Dynamite',
    maxStack: 1,
    use: (conditions: UseCondition) => {
      return false;
    }
  }
};

type ItemID = keyof typeof ITEMS;

export interface Inventory {
  slots: (Slot | undefined)[];
}

export interface PlayerInventory extends Inventory {
  selected: number;
}

interface Slot {
  item: ItemID;
  quantity: number;
  data: Record<string, unknown>;
}

export function useSlot(context: UseCondition) {
  if (handleGenericUse(context)) {
    return;
  }
  handleSlotUse(context);
}

interface UseCondition {
  user: Player;
  world: World;
  slotNumber: number;
  onBlock?: [number, number];
  onThing?: Inertial;
}

interface ItemDetails {
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
  const inventory: Inventory = {slots: []};
  const slot = inventory.slots[context.slotNumber] as Slot;
  return ITEMS[slot.item].use(context);
}

function handleSlotUse(context: UseCondition): boolean {
  // TODO: inventory = user.inventory;
  const inventory: Inventory = {slots: []};
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