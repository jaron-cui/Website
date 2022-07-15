import Viewport3D from "../Viewport3D"
import { CENTERED_VERTICAL, DEFAULT_FONT } from '../util/constants';
import Clip from "../Clip";

export default function Home() {
  return (
    <div style={{
      ...DEFAULT_FONT,
      marginTop: '40px'
    }}>
      <span style={CENTERED_VERTICAL}>
        <h1>Jaron Cui</h1>
        <h2>Northeastern University</h2>
        <figure style={{...CENTERED_VERTICAL, marginTop: '20px', marginBottom: '20px'}}>
          <p>
          I am a rising third-year student at the Khoury College of Computer Sciences,
          pursuing a Bachelor's in Computer Science and a minor in Mechanical Engineering.
          I have professional experience in software development and am an avid coder in my free time.
          Check out my <a href='/#/projects'>projects</a> to see what I have experience working with!
          </p>
          <img src='./portrait.jpg' alt='Portrait' style={{
            width: '300px', margin: '20px'
          }}/>
        </figure>
      </span>
      

      <h3 style={{marginBottom: '20px'}}>Making Cool Things!</h3>

      <span style={CENTERED_VERTICAL}>
        <p>
          For efficiency and maintainability and a whole slew of other reasons, programmers tend to avoid 'reinventing the wheel'. But sometimes,
          doing so can be a lot of fun!
        </p>
        <p>
          An example of a task that has already been 'solved' is 3D digital
          rendering. The practical thing to do would be to use an existing implementation. However, I was always intrigued with figuring out how to build one from
          scratch.
        </p>
        <p>
          It's the type of problem for which we know what the working solution should look like,
          yet recreating the abstract idea of a 3D visualization in code is not trivial.
        </p>

        <figure style={{
          ...CENTERED_VERTICAL,
          marginBottom: '40px'
        }}>
          <figcaption><i>Minecraft in Racket</i></figcaption>
          <Clip link='https://drive.google.com/uc?export=download&id=1CBpuikjxoEsHOKemrRLW3SEqFNlWY4Fh'/>
        </figure>

        <p>
          One of my earlier attempts at this was my
          'Minecraft in Racket' project, which I completed at the end of my freshman year at Northeastern.
          I tried to built an algorithm purely using trigonometry and algebra,
          which is what I knew at the time. After much experimentation, I built an OK program from these
          limited high-school concepts which was interesting but clearly had some inaccuracies: there is an
          oddly exaggerated 'curving' of the viewport at the edges.
        </p>

        <figure style={CENTERED_VERTICAL}>
          <figcaption><i>Press the 'WASD' keys to move and 'IJKL' to pan!</i></figcaption>
          <Viewport3D />
        </figure>

        <p style={{marginTop: '20px'}}>
          In the fall semester of my second year, I took a course titled 'Mathematics of Data Models',
          which introduced me to linear algebra. Armed with this knowledge, I was able to design a
          corrected example program <i>(see above)</i>. Now that I understand the fundamental
          principles behind such a program, I'm confident I could recreate it from a blank slate in
          any environment capable of drawing pixels.
        </p>
        <p>
          As I progress in my education, I'll continue to expand my mental repertoire so that I can
          approach new problems of a similar nature and internalize their solutions. This is why
          computer science is the field I chose to pursue: I can walk to a computer with nothing in my hands,
          and build something cool!
        </p>
      </span>
    </div>
  );
}