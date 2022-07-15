import { Button, Collapse, Icon, IconButton, InputAdornment, makeStyles, TextField } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { BUTTON_STYLE, DEFAULT_FONT } from '../util/constants';
import Clip from '../Clip';
import { dateToString, ProjectInfo, PROJECTS, wrapContent } from '../util/util';
import { BoxArrowUpRight } from 'react-bootstrap-icons';

type ProjectComponentProps = ProjectInfo & {
  open: boolean;
  setOpen: (value: boolean) => void;
}

function searchFor(search: string) {
  return function matchProject(project: ProjectInfo) {
    if (!project.title) {
      return false;
    }

    const strings: string[] = [
      dateToString(project.date),
      project.title,
      ...project.technologies,
      ...project.features
    ];

    for (const string of strings) {
      if (string.toLowerCase().includes(search.toLowerCase())) {
        return true;
      }
    }

    return false;
  }
}

function ProjectEntryButton(props: ProjectComponentProps) {
  return (
    <Button onClick={() => props.setOpen(!props.open)} sx={{
      ...DEFAULT_FONT,
      ...BUTTON_STYLE,
      color: 'black',
      textAlign: 'left',
      textTransform: 'unset !important',
      width: '100%',
      justifyContent: 'flex-start'
    }}>
      <span style={{width: '100%'}}>
        <span style={{
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>{props.title}</span>
          <i>{dateToString(props.date)}</i>
        </span>
        <p>{props.technologies.join(', ')}</p>
      </span>
    </Button>
  );
}

function ProjectEntry(props: ProjectComponentProps) {
  const [content, setContent] = useState<any>();

  useEffect(() => {
    if (props.open && props.clip && !content) {
      setContent(
        <Clip link={props.clip}/>
      );
    }
  }, [props.open]);
  
  return (
    <div style={{
      ...DEFAULT_FONT,
      paddingTop: '4px',
      paddingBottom: '4px'
      }}>
      <div style={{display: 'flex', flexDirection: 'row'}}>
        <ProjectEntryButton {...props} />
        <div style={{margin: '8px'}}>
          <IconButton 
            href={`/#/projects/${props.id}`}
            target='_blank'
            rel='noreferrer noopener'
            sx={{
              ...BUTTON_STYLE,
              color: '#777777',
              '&:hover': {
                color: 'black'
              }
          }}>
            <BoxArrowUpRight size='15px'/>
          </IconButton>
        </div>
      </div>
      <Collapse in={props.open}>
        <div style={{padding: '20px'}}>
          <div>
            <h4>Features</h4>
            <ul>
              {props.features.map((feature, i) => <li key={i}>{feature}</li>)}
            </ul>
          </div>
          {props.video && wrapContent(<iframe width="768" height="432" src={props.video}></iframe>)}
          {props.clip && wrapContent(content)}
          <div style={{paddingTop: '10px'}}>
            <h4>Description</h4>
            {props.paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
          </div>
        </div>
      </Collapse>
    </div>
  );
}

export default function Projects() {
  const [search, setSearch] = useState<string>('');
  const [displayed, setDisplayed] = useState<ProjectInfo[]>([]);
  const [opened, setOpened] = useState<Set<string>>(new Set());

  useEffect(() => {
    setDisplayed(PROJECTS.filter(searchFor(search)).sort((p1, p2) => (p2.date.localeCompare(p1.date))));
  }, [search])

  return (
    <div style={{
      ...DEFAULT_FONT,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'left',
      marginTop: '40px'
    }}>
      <span style={{
            paddingBottom: '20px',
            height: '80px'
          }}>
        <TextField
          label="Search Projects"
          onChange={event => setSearch(event.target.value)}
          inputProps={{style: DEFAULT_FONT}}
          InputLabelProps={{style: DEFAULT_FONT}}
          style={{
            width: '100%'
          }}
        />
        {
          search && <i style={{color: '#6A6A6A'}}>
            Showing {displayed.length} result{displayed.length !== 1 && 's'} for '{search}'
          </i>
        }
      </span>{
        displayed.map(project => (
          <div key={project.date}>
            <ProjectEntry {...{
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