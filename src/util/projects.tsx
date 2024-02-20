import { Chess } from '../page/extraneous/chess/view';
import { Rect } from '../page/extraneous/rect/Rect';
import { NewProjectInfo } from './types';

export const NEW_PROJECTS: NewProjectInfo[] = [
  {
    legacy: false,
    id: 'chess',
    repository: 'https://github.com/jaron-cui/jaron-cui.github.io/tree/master/src/page/extraneous/chess',
    title: 'Chess',
    date: '2024-02-10',
    status: 'ACTIVE',
    technologies: ['TypeScript', 'PixiJS'],
    page: fullpage => {
      return (
        <div>
          <h4>Preview</h4>
          Here is a snapshot of progress on the project. Visit <a href='https://jaron-cui.github.io/#/chess'>https://jaron-cui.github.io/#/chess</a> for the latest version.

          <Chess/>

          <h4>Info</h4>
          <p>
            This is my attempt at efficiently implementing chess!
            There are a few things we want to be able to do:
          </p>
          <ul>
            <li>Determine legal moves</li>
            <li>Indicate to the player all their currently allowed moves</li>
          </ul>
          <p>
            The approach I decided to take was one where we maximally cache information
            regarding potential moves. Every square on the board keeps a list of coordinates
            from which pieces can move to it and a list of coordinates that should recalculate
            possible moves if the square is updated.
          </p>
          <p>
            For example, a rook, which can move in a straight line of any length, will be
            obstructed by pieces in its path. All the squares which it can currently move to
            will store its position. Squares in the rook's path which hold a piece will also
            store its position, but tagged as 'If this square changes, check with me!'.
          </p>
          <p>
            This approach avoids recalculating every possible move after every turn, making
            it fast and straightforward to tell where pieces can move.
          </p>
        </div>
      );
    }
  }, {
    legacy: false,
    id: 'rect',
    repository: 'https://github.com/jaron-cui/jaron-cui.github.io/tree/master/src/page/extraneous/rect',
    title: 'Get Rect Remastered',
    date: '2024-01-04',
    status: 'ACTIVE',
    technologies: ['TypeScript', 'PixiJS', 'WebGL'],
    page: fullscreen => {
      return (
        <div>
          <h4>Features</h4>
          <ul>
            {[
              'Custom 2D physics engine',
              'WebGL shader terrain rendering',
              'Platformer movement'
            ].map(s => <li>{s}</li>)}
          </ul>
          <h4>Preview</h4>
          <p>Try using WASD to control the player!</p>
          <p>Visit <a href='https://jaron-cui.github.io/#/rect'>https://jaron-cui.github.io/#/rect</a> for the latest version.</p>
          <Rect/>
          <h4>Description</h4>
          <p>
            This is an attempt to recreate the first game I made, "get_rect()".
          </p>
          <p>
            The original game was PVP with destructible tiled terrain. There were numerous weapons and props at the player's disposal.
          </p>
          <p>
            It was multiplayer in the sense that two players would control their avatars from the same device, one using WASD, and the other using the arrow keys.
          </p>
          <p>
            Fireworks, TNT, bow & arrows, swords, throwable logs were acquirable by parachuted crates falling from the sky.
          </p>
          <p>
            Being the first game I had created, the physics were simplistically and not so carefully crafted. The implementations were incredible far from optimal. One early mistake I made was loading each block texture from file for every single block on the screen, every frame.
          </p>
          <p>
            This new version will use the arsenal of programming skills and mathematical knowledge I've gained since high school to build a better, faster, and even more fun online multiplayer game in the same spirit.
          </p>
        </div>
      );
    }
  }
]