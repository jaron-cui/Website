import { DEFAULT_FONT, DEFAULT_MARGIN } from '../util/styles';
import { Col, Container, Row } from "react-bootstrap";

export default function Home() {
  return (
    <div style={{
      ...DEFAULT_FONT,
      ...DEFAULT_MARGIN
    }}>
      <Container>
        <Row>
          <Col style={{verticalAlign: 'bottom'}}>
            <h1>Jaron Cui</h1>
            <h3>Student at Northeastern University</h3>
            <hr/>
            <p>
              Hello hello hello! How does your day go? Welcome to my domain, take a look around.
              No need to refrain, there's plenty to be found.
            </p>
            <p>
              I'm a senior at Northeastern University interested in Computer Science and Robotics. Why?
              Because I love to build things, both physically and in code! Here's what I've been working on lately:
            </p>
          </Col>
          <Col xs={2}>
            <img src='./portrait.jpg' alt='Portrait' style={{
              width: '150px', height: '150px', margin: '20px', borderRadius: '50%'
            }}/>
          </Col>
        </Row>
        <Row>
          <Col>
            <h2>Recent Musings</h2>
            <p>Click the headings below for interactive demos and more info.</p>
            <Row>
              <Col>
                <img src="robot-hand.gif" alt="Robotic Hand" width='100%'/>
              </Col>
              <Col>
                <img src="rect-demo-1.gif" alt="Rect" width='100%'/>
              </Col>
              <Col>
                <img src="3d-view-demo.gif" alt="3D Viewer" width='100%'/>
              </Col>
            </Row>
          </Col>
        </Row>
      </Container>
    </div>
  );
}