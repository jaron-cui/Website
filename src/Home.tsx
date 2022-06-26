import Viewport3D from "./Viewport3D"

export default function Home() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      marginRight: '100px',
      marginLeft: '100px',
      marginBottom: '300px'
    }}>
      <h1>Jaron Cui</h1>
      <h2>Northeastern University</h2>
      <div>PICTURE</div>

      <p>
        I am a rising third-year student at the Khoury College of Computer Sciences,
        pursuing a Bachelor's in Computer Science and a minor in Mechanical Engineering.
        I have professional experience in software development and am familiar with a wide suite of
        technologies.
      </p>
      <p>
        To me, programming can be endlessly engaging.
        I particularly fixate on seemingly opaque problems for which
        I can attempt to formulate solutions relying on my intuition and pre-existing
        knowledge. Sometimes, this takes multiple iterations to perfect.
        I know that there are already detailed solutions for many of these problems, but I enjoy
        figuring it out for myself.
      </p>
      <p>
        One area my interests intersect with such a problem is in 3D digital
        rendering. It seems to be the type of problem for which we know exactly what we want the
        result to be, yet it's far from trivial to put the abstract idea of a 3D visualization into
        a working implementation - which is exactly the type of challenge I like to tackle!
      </p>
      <p>
        One of my earlier attempts to create a program that applies this concept was my
        'Minecraft in Racket' project, which I completed at the end of my freshman year at Khoury.
        I tried to built an algorithm purely using trigonometry and algebra,
        which is what I knew at the time. Through much experimentation, I devised a working
        result with a few inaccuracies leading to a functional but distorted viewport.
      </p>
      <p>
        In the fall semester of my second year, I took a course titled 'Mathematics of Data Models',
        which introduced me to linear algebra. Armed with this knowledge, I was able to design a
        corrected example program (Controls: WASD+IJKL). Now that I understand the fundamental
        principles behind such a program, I'm confident I could recreate it from a blank slate in
        any framework capable of drawing pixels.
      </p>
      <Viewport3D />
      <p>
        As I progress in my education, I'll continue to expand my mental repertoire so that I can
        approach new problems of a similar nature and internalize their solutions. This is why
        computer science is the field I chose to pursue: I can walk to any computer, carrying nothing,
        and build something cool!
      </p>
    </div>
  );
}