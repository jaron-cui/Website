import { Col, Row } from 'react-bootstrap';
import { Chess } from '../page/extraneous/chess/view';
import { Rect } from '../page/extraneous/rect/Rect';
import { NewProjectInfo } from './types';
import { wrapContent } from './util';
import WidthSwitch from '../component/WidthSwitch';

function YouTubeEmbed({ videoID }: { videoID: string }) {
  return (
    <iframe width='100%' height='480px' src={`https://youtube.com/embed/${videoID}?autoplay=1&showinfo=0&loop=1&rel=0`}></iframe>
  )
}

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
  }, {
    legacy: false,
    id: 'robotic-hand',
    title: 'Robotic Hand',
    date: '2024-02-01',
    status: 'ACTIVE',
    technologies: ['Python', '3D Printing', 'CAD', 'Computer Aided Design', 'Fusion360', 'Blender'],
    page: fullscreen => {
      return (
        <div>
          <div style={{paddingBottom: '40px'}}>
            <h4>Preview</h4>
            <p>
              Robot hand!
            </p>
            <WidthSwitch>
              {wrapContent(<img width='30%' src='robot-hand.gif'/>)}
              {wrapContent(<img width='100%' src='robot-hand.gif'/>)}
            </WidthSwitch>
          </div>
          <div style={{paddingBottom: '40px'}}>
            <h4>Objective</h4>
            <p>
              The goal of this project is to build a robotic hand capable of spontaneously playing <b>rock-paper-scissors</b> with passerby.
            </p>
            <p>
              With an original design from scratch and a 3D printer, I'm building a hand with the simple ability to control the
              degree of retraction of individual fingers. This is sufficient to produce the poses required in the game.
            </p>
            <p>
              Using a camera and computer vision models, the robot will constantly look for hands in frame.
              If a hand is located, it will watch to see if the opponent attempts to initiate a game.
              Traditionally, human players start a game by bobbing their fists up and down in unison, while chanting
              "Rock, Paper, Scissors, SHOOT!". The robot will identify a fist and graph its position over time, and
              if it detects a regular vertical oscillation, it can extrapolate the number and rhythm of bobs to join
              in and then throw a move at the anticipated SHOOT!
            </p>
            {wrapContent(<img src='project/robot-hand-initiate-graphic.png'/>)}
          </div>
          <div style={{paddingBottom: '500px'}}>
            <h4>Mechanical Design</h4>
            <h5>Ideation</h5>
            <p>
              I thought that it would be easiest to design a robot where springs hold the fingers in a default position,
              either open or closed. "Tendons" could be attached that pull fingers out of this default pose.
              Finger joints would function, essentially, as two competing pulleys determining the overall
              bend angle.
            </p>
            <p>
              I decided to have the default pose be an open hand, and tendons would pull the fingers closed.
              The materials I had on hand for the initial prototypes were anything I could 3D-print, including
              plastic frames and screws that I modeled in Fusion360, <b>and... rubber bands and dental floss</b>.
              I did not have a better option for the tendon material. Below is my first proof-of-concept of the
              <b>"opposing pulleys"</b> finger joint idea.
            </p>
            <WidthSwitch>
              <Row>
                <Col>
                  {wrapContent(<img width='80%' src='project/robot-hand-sketch.jpg'/>)}
                </Col>
                <Col>
                  {wrapContent(<YouTubeEmbed videoID='Z5H3bPPbSEk'/>)}
                </Col>
              </Row>
              <div>
                <img width='100%' src='project/robot-hand-sketch.jpg'/>
                {wrapContent(<YouTubeEmbed videoID='Z5H3bPPbSEk'/>)}
              </div>
            </WidthSwitch>
            <br/>
            <h5>Refined Finger Design</h5>
            <p>
              Since the proof-of-concept seemed to work fine, I moved on to polish and refine the design for a single finger.
              After assembling the first version, I realized there was an opportunity to make the angle of the tender more
              extreme between two joints. This would increase the maximum amount that the finger could retract. We can see
              this improvement in these comparison images:
            </p>
            <WidthSwitch>
              {wrapContent(<img width='50%' src='project/robot-hand-finger-comparison.jpg'/>)}
              {wrapContent(<img width='100%' src='project/robot-hand-finger-comparison.jpg'/>)}
            </WidthSwitch>
            <br/>
            <h5>Current State</h5>
            <p>
              Finally, all that I needed was to connect the fingers to a palm that would internally route the finger control
              tendons down a wrist to five stepper motors. Below is the current assembled hand, missing the thumb. The
              next steps will be to build a forearm and interface for motor mounting/connection. Check back later for updates
              on the project!
            </p>
            {wrapContent(<YouTubeEmbed videoID='YvzgZtNX5oU'/>)}
          </div>
        </div>
      )
    }
  }
]