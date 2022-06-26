import { useEffect, useState } from 'react';
import { Collapse } from 'react-bootstrap';
import projects from './projects.json';

type Project = {
  title: string;
  date: string;
  technologies: string[];
  features: string[];
  paragraphs: string[];
}

type ProjectComponentProps = Project & {
  open: boolean;
  setOpen: (value: boolean) => void;
}

function searchFor(search: string) {
  return function matchProject(project: Project) {
    if (!project.title) {
      return false;
    }

    const strings: string[] = [
      project.title,
      ...project.technologies,
      ...project.features,
      ...project.paragraphs
    ];

    for (const string of strings) {
      if (string.toLowerCase().includes(search.toLowerCase())) {
        return true;
      }
    }

    return false;
  }
}

function ProjectComponent(props: ProjectComponentProps) {
  return (
    <div>
      <button key='title' onClick={() => props.setOpen(!props.open)} style={{
        width: '100%',
        textAlign: 'left'
      }}>
        <h2>{props.title} | {props.date}</h2>
        <p>{props.technologies.join(', ')}</p>
      </button>
      <Collapse in={props.open}>
        <div>
          <h4>Features</h4>
          <ul style={{
            //marginLeft: '20px'
          }}>
            {props.features.map((feature, i) => <li key={i}>{feature}</li>)}
          </ul>
          <h4>Description</h4>
          {props.paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
        </div>
      </Collapse>
    </div>
  );
}

export default function Projects() {
  const [search, setSearch] = useState<string>('');
  const [displayed, setDisplayed] = useState<Project[]>(projects.filter(project => project.title));
  const [opened, setOpened] = useState<Set<string>>(new Set());

  useEffect(() => {
    setDisplayed(projects.filter(searchFor(search)).sort((p1, p2) => (p2.date.localeCompare(p1.date))));
  }, [search])

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'left',
      marginRight: '100px',
      marginLeft: '100px',
      marginBottom: '300px'
    }}>
      <input type='text' onChange={event => setSearch(event.target.value)} /> {
        displayed.map(project => (
          <div key={project.date}>
            <ProjectComponent {...{
              ...project,
              open: opened.has(project.title),
              setOpen: value => {
                if (value) {
                  opened.has(project.title) || setOpened(new Set(opened.add(project.title)));
                } else {
                  opened.delete(project.title) && setOpened(new Set(opened));
                }
              }
            }} />
          </div>
        ))
      }
    </div>
  );
}