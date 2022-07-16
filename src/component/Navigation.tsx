import { useState } from 'react';
import { Navbar, Container, Nav } from 'react-bootstrap';
import { Envelope, EnvelopePaper, Github, Linkedin } from 'react-bootstrap-icons';
import { LINKS } from '../util/constants';
import { DEFAULT_FONT } from '../util/styles';

function Social(props: {link: string, normal: any, hover: any}) {
  const [hovering, setHovering] = useState<boolean>(false);
  
  return (
    <Navbar.Brand
      href={props.link}
      target='_blank'
      rel='noreferrer noopener'
      onMouseEnter={() => setHovering(true)}
      onMouseLeave={() => setHovering(false)}
      onClick={() => setHovering(true)}>
      {hovering ? props.hover : props.normal}
    </Navbar.Brand>
  )
}

export default function Navigation({ currentPath }: { currentPath: string }) {
  function Section({ title, path, current }: { title: string, path: string, current: string }) {
    return <Nav.Link key={title} href={path} active={path===current}>{title}</Nav.Link>
  }

  return (
    <Navbar bg='dark' variant='dark' style={DEFAULT_FONT}>
      <Container>
        <Navbar.Brand href='/'>Jaron Cui</Navbar.Brand>
        <Nav className='me-auto'>
          <Section title='Home' path='/' current={currentPath}/>
          <Section title='Projects' path='/#/projects' current={currentPath}/>
          <Section title='Experience' path='/#/experience' current={currentPath}/>
          <Section title='Contact' path='/#/contact' current={currentPath}/>
        </Nav>
        <Social link={`mailto:${LINKS.email}`}
          normal={<Envelope color='#DDDDDD'/>}
          hover={<EnvelopePaper />}/>
        <Social link={LINKS.linkedin}
          normal={<Linkedin color='#DDDDDD'/>}
          hover={<Linkedin />}/>
        <Social link={LINKS.github}
          normal={<Github color='#DDDDDD'/>}
          hover={<Github />}/>
      </Container>
    </Navbar>
  );
}