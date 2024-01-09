import { Button, Checkbox, Input } from "@mui/material";
import { useState } from "react";

const MINIMS = {
  tsp: 80,
  tbsp: 240,
  oz: 480,
  cup: 3840
}

type ImperialUnit = keyof typeof MINIMS;

type Unit = 'servings' | ImperialUnit;

function convertImperialUnit(count: number, from: ImperialUnit, to: ImperialUnit): number {
  const ratio = MINIMS[from] / MINIMS[to];
  return ratio * count;
}

function largerImperialUnit(a: ImperialUnit, b: ImperialUnit) {
  return MINIMS[a] > MINIMS[b] ? a : b;
}

function smallerImperialUnit(a: ImperialUnit, b: ImperialUnit) {
  return MINIMS[a] < MINIMS[b] ? a : b;
}

function formatQuantity(quantity: Quantity) {
  if (quantity.count) {
    if (quantity.unit || quantity.customUnit) {
      return '' + quantity.count + ' ' + (quantity.unit || quantity.customUnit);
    } else {
      return '' + quantity.count;
    }
  } else if (quantity.customUnit) {
    return quantity.customUnit;
  } else {
    return '';
  }
}

type Quantity = {
  count?: number;
  unit?: Unit;
  customUnit?: string;
}

type Ingredient = {
  name: string;
} & Quantity;

type Recipe = {
  name: string;
  servings: number;
  steps: string[];
  ingredients: Ingredient[];
}

const RECIPES: Recipe[] = [
  {
    name: 'Chicken Fricasee',
    servings: 2,
    steps: [
      'Chop the onions and mushrooms. Mince the garlic.',
      'Season the chicken thighs with salt and pepper.',
      'In a large pan, melt the butter on high heat and then brown the chicken on both sides.',
      'Set the chicken aside in a bowl for further cooking later.',
      'Add the onions, mushrooms, and garlic to the pan on medium heat and stir. Cook until the onions are translucent.',
      'Add the thyme, bay leaves, and flour. Stir and let cook for a minute.',
      'Pour the cooking wine and chicken stock into the pan and bring to a boil.',
      'Add the chicken thighs back into the pan, including any juices in the bowl.',
      'Simmer for 15 minutes uncovered, stirring occasionally to prevent sticking to the bottom.',
      'Simmer for another 10 minutes covered.',
      'Turn off the heat and stir in the heavy cream. Optionally, garnish with parsley.'
    ],
    ingredients: [
      {
        name: 'Chicken Thigh',
        count: 4
      }, {
        name: 'Butter',
        count: 2,
        unit: 'tbsp'
      }, {
        name: 'Black Pepper',
      }, {
        name: 'Salt'
      }, {
        name: 'Thyme'
      }, {
        name: 'Bay Leaf',
        count: 2
      }, {
        name: 'White Mushroom',
        count: 7
      }, {
        name: 'White Onion',
        count: 1/2
      }, {
        name: 'Garlic',
        count: 4,
        customUnit: 'cloves'
      }, {
        name: 'Chicken Stock',
        count: 2,
        unit: 'cup'
      }, {
        name: 'White Cooking Wine',
        count: 1,
        unit: 'cup'
      }, {
        name: 'Flour',
        count: 1,
        unit: 'tbsp'
      }, {
        name: 'Heavy Cream',
        count: 2,
        unit: 'tbsp'
      }
    ]
  }, {
    name: 'Pan-fried Steak',
    servings: 1,
    steps: [
      'Season the steak on both sides with salt and pepper.',
      'Melt the butter on medium-high heat and sear the steak on one side until browned before repeating on the other side.',
      'Sprinkle the thyme, garlic, and onion powder over the steak and pour the cooking wine into the pan.',
      'Turn off the heat.'
    ],
    ingredients: [
      {
        name: 'Steak',
        count: 1
      }, {
        name: 'Butter',
        count: 2,
        unit: 'tsp'
      }, {
        name: 'White Cooking Wine',
        count: 2,
        unit: 'tbsp'
      }, {
        name: 'Salt'
      }, {
        name: 'Black Pepper'
      }, {
        name: 'Thyme'
      }, {
        name: 'Onion Powder'
      }, {
        name: 'Garlic Powder'
      }
    ]
  }
];

function addQuantity(q1: Quantity, q2: Quantity): Quantity | Quantity[] {
  // if at least one of the quantities has no count, like: salt + 2 tsp salt
  if (!q1.count || !q2.count) {
    // if at least one of the quantities has a custom unit, can't add. like: 1 leaf lettuce + lettuce
    if (q1.customUnit || q2.customUnit) {
      return [q1, q2];
    }
    // if the quantities have no count or unit, ubiquitous like: salt + salt
    return q1;
  }

  // if there is a custom unit
  if (q1.customUnit || q2.customUnit) {
    return q1.customUnit === q2.customUnit ? {
      count: q1.count + q2.count,
      customUnit: q1.customUnit
    } : [q1, q2];
  }

  // if both have standard units
  if (q1.unit && q2.unit) {
    // if >=1 unit is in servings
    if (q1.unit === 'servings' || q2.unit === 'servings') {
      return q1.unit === q2.unit ? {
        count: q1.count + q2.count,
        unit: 'servings'
      } : [q1, q2];
    }
    const smallerUnit = smallerImperialUnit(q1.unit, q2.unit);
    const count1 = convertImperialUnit(q1.count, q1.unit, smallerUnit);
    const count2 = convertImperialUnit(q2.count, q2.unit, smallerUnit);
    return {
      count: count1 + count2,
      unit: smallerUnit
    }
  }

  return [q1, q2];
}

function simplifyIngredients(ingredients: Ingredient[]): Ingredient[] {
  const simplified: Ingredient[] = [];
  ingredients.forEach(ingredient => {
    for (let i = 0; i < simplified.length; i += 1) {
      const entry = simplified[i];
      if (ingredient.name !== entry.name) {
        continue;
      }
      const sum = addQuantity(ingredient, entry);
      if (Array.isArray(sum)) {
        continue;
      }
      simplified[i] = {
        name: entry.name,
        ...sum
      }
      return;
    }
    simplified.push(ingredient);
  });
  return simplified;
}

function getGroceryList(recipes: Recipe[]): Ingredient[] {
  const ingredientLists = recipes.map(recipe => recipe.ingredients);
  const concated: Ingredient[] = [];
  return simplifyIngredients(concated.concat(...ingredientLists));
}


interface RecipePageProps {
  recipe: Recipe;
}

export const RecipePage = ({ recipe }: RecipePageProps) => {
  return (
    <div>
      <h1>{recipe.name}</h1>
      <h2>{recipe.servings} servings</h2>
      <div>
        <h3>Steps</h3>
        {recipe.steps.map((step, stepNumber) => (
          <div>
            {stepNumber + 1}. {step}
          </div>
        ))}
      </div>
    </div>
  )
}

const ToggleButton = ({ set, onSet }: { set: boolean, onSet: (set: boolean) => void }) => {
  return <Checkbox checked={set} onChange={(_, checked) => onSet(checked)}/>;
}

type GroceryListItem = {
  ingredient: Ingredient;
  checked: boolean;
}

interface GroceryListProps {
  groceries: Ingredient[];
}

const GroceryList = ({ groceries }: GroceryListProps) => {
  const [items, setItems] = useState<GroceryListItem[]>(groceries.map(grocery => ({
        ingredient: grocery,
        checked: false 
      })));

  function setCheck(index: number, check: boolean) {
    const checkUpdated = items.map((item, i) => i === index ? {...item, checked: check} : item);
    // checkUpdated.sort((a, b) => {
    //   if (a.checked && !b.checked) {
    //     return 1;
    //   } else if (b.checked && !a.checked) {
    //     return -1;
    //   }
    //   return 0;
    // });
    setItems(checkUpdated);
  }

  return (
    <div>
      <h1>Groceries</h1>
      <div>
        {items.map((item, i) => (
          <div style={{width: '20vw'}}>
            <div style={{float: 'left'}}>
              {formatQuantity(item.ingredient)} {item.ingredient.name.toLowerCase()}
            </div>
            <div style={{float: 'right'}}>
              <ToggleButton set={item.checked} onSet={check => setCheck(i, check)}/>
            </div>
            <div style={{clear: 'both'}}></div>
          </div>
        ))}
      </div>
    </div>
  );
}

function maxMatchLength(str: string, substr: string): number {
  for (let length = substr.length; length > 0; length -= 1) {
    if (str.includes(substr.slice(0, length))) {
      return length;
    }
  }
  return 0;
}

function allRecipesSortedByName(search: string): Recipe[] {
  const lowercased = search.toLowerCase();
  return RECIPES.sort((a, b) => {
    return maxMatchLength(b.name.toLowerCase(), lowercased) - maxMatchLength(a.name.toLowerCase(), lowercased);
  });
}

interface RecipeSearchProps {
  onSelect: (recipe: Recipe) => void;
}

const RecipeSearch = ({ onSelect }: RecipeSearchProps) => {
  const [search, setSearch] = useState<string>('');

  return (
    <div style={{backgroundColor: 'red', display: 'flex', flexFlow: 'column', height: '100%', width: '100%'}}>
      <Input value={search} onChange={e => setSearch(e.target.value)}/>
      <div style={{height: '100%', backgroundColor: 'orange', overflowY: 'scroll'}}>
        {allRecipesSortedByName(search).map(recipe => (
          <div onClick={() => onSelect(recipe)}>
            {recipe.name}
          </div>
        ))}
      </div>
    </div>
  );
}

interface RecipeQueueProps {
  recipes: Recipe[];
  addRecipe: (recipe: Recipe) => void;
  removeRecipe: (index: number) => void;
}

const RecipeQueue = ({ recipes, addRecipe }: RecipeQueueProps) => {
  return (
    <div style={{backgroundColor: 'green', height: '150%'}}>
      <h1>Recipe Queue</h1>
      <div>
        {recipes.map((recipe, i) => (
          <div>
            {i + 1}. {recipe.name}
          </div>
        ))}
      </div>
      <div style={{position: 'fixed', bottom: 0, height: '40vh', width: '100%'}}>
        <RecipeSearch onSelect={recipe => addRecipe(recipe)}/>
      </div>
    </div>
  );
}

const Home = () => {
  const [recipeQueue, setRecipeQueue] = useState<Recipe[]>([]);

  function addRecipe(recipe: Recipe) {
    setRecipeQueue([...recipeQueue, recipe]);
  }

  function removeRecipe(index: number) {
    const removed = recipeQueue.slice();
    removed.splice(index, 1);
    setRecipeQueue(removed);
  }

  return (
    <RecipeQueue recipes={recipeQueue} addRecipe={addRecipe} removeRecipe={removeRecipe}/>
  );
}

const Groc = () => {
  return (
    <div style={{height: '75vh', backgroundColor: 'blue'}}>
      <Home />
    </div>
  );
};

export default Groc;
