# HOW TO ADD A NEW ENTITY

1. Create an interface representing the data for the entity that extends at least the Inertial interface:
```ts
// the Inertial interface gives the chest position, weight, velocity, etc...
// the Mortal interface gives the chest health
interface WalkingChestData extends Inertial, Mortal {
  // custom data for the walking chest
  displayName: string;
  chestInventory: Inventory;
}
```
2. Extend BaseEntity<T> where T is your new data interface and set the *type* field to a unique value:
```ts
class WalkingChest extends BaseEntity<WalkingChestData> {
  type: 'walking-chest' = 'walking-chest';

  // add any fields you want to for spawning a new entity
  constructor(...) {
    // call super to set the initial values of your data interface
    super({
      ...
    })
  }
}
```
3. Add your new entity class to the *Entity* type in ../entity.ts:
```ts
41 |   export type Entity = Player | Dynamite | WalkingChest;
```

And now, you can instantiate the entity in code.
```ts
game.spawn(new WalkingChest(10, 22, 'Chester'));
```