import { Button, Collapse, IconButton, Tooltip } from '@mui/material';
import { useState, useEffect, SetStateAction, useRef } from "react";
import { Carousel, Image } from 'react-bootstrap';
import { Github } from 'react-bootstrap-icons';
import Clip from "../Clip";
import { DEFAULT_FONT, BUTTON_STYLE, TRUNCATE_TEXT, CENTERED_VERTICAL } from "../util/styles";
import { Media, ProjectInfo } from '../util/types';
import { dateToString, mod, processParagraph, toDownloadLink, wrapContent } from "../util/util";
import { LinkButton, SideButton } from './Buttons';

const STATUS_COLORS = {
  COMPLETED: '#447744',
  ON_HOLD: '#886675',
  ACTIVE: '#55BB44'
}

const STATUS_LABELS = {
  COMPLETED: 'Completed',
  ON_HOLD: 'On Hold',
  ACTIVE: 'Active'
}

type ProjectEntryProps = ProjectInfo & {
  open: boolean;
  setOpen: (value: boolean) => void;
}

function ProjectEntryButton(props: ProjectEntryProps & { locked?: boolean }) {
  return (
    <Button disableRipple={props.locked} onClick={() => props.setOpen(!props.open)} sx={{
      ...DEFAULT_FONT,
      ...BUTTON_STYLE,
      '&:hover': props.locked ? {backgroundColor: BUTTON_STYLE.backgroundColor} : BUTTON_STYLE['&:hover'],
      color: 'black',
      textAlign: 'left',
      textTransform: 'unset !important',
      width: '100%',
      justifyContent: 'flex-start',
      minWidth: '360px'
    }}>
      <span style={{width: '100%'}}>
        <span style={{
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span style={{ width: 'calc(100% - 160px)' }}>
            <h5 style={TRUNCATE_TEXT}>{props.title}</h5>
            <p style={TRUNCATE_TEXT}>{props.technologies.join(', ')}</p>
          </span>
          <span style={{display: 'flex', flexDirection: 'row'}}>
            <div className='vr'></div>
            <span style={{ ...CENTERED_VERTICAL, width: '120px', marginLeft: '10px', marginRight: '10px'}}>
              <i>{dateToString(props.date)}</i>
              <div style={{
                width: '80px',
                borderRadius: '3px',
                backgroundColor: STATUS_COLORS[props.status],
                margin: '10px',
                color: 'white',
                textAlign: 'center'
              }}>{STATUS_LABELS[props.status]}</div>
            </span>
          </span>
        </span>
      </span>
    </Button>
  );
}

function ProjectGallery({ media } : { media: Media[] }) {
  const [index, setIndex] = useState(0);
  const cachedMedia = useRef<JSX.Element[]>(
    media.map(item => <img src={toDownloadLink(item.link)} style={{height: '100%', width: '100%', objectFit: 'contain'}}/>
  ));

  const changeImage = (increment: number) => () => {
    const newIndex = mod(index + increment, media.length); 
    setIndex(newIndex);
  };

  return (
    <div style={{height: '300px', width: '100%', display: 'flex', justifyContent: 'center'}}>
      <SideButton direction='left' onClick={changeImage(-1)}/>
      <Tooltip title={media[index].description}>
        <div style={{backgroundColor: '#999999', height: '100%', width: '50%'}}>{cachedMedia.current[index]}</div>
      </Tooltip>
      <SideButton direction='right' onClick={changeImage(1)}/>
    </div>
  );
}

export default function ProjectEntry(props: ProjectEntryProps & { locked?: boolean }) {
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
        <span style={{margin: '8px'}}>
          <LinkButton link={`/#/projects/${props.id}`} label='Open in new tab'/>
          <LinkButton link={props.repository} Img={Github} label='View on GitHub'/>
        </span>
      </div>
      <Collapse in={props.open}>
        <div style={{padding: '20px'}}>
          <div>
            <h4>Features</h4>
            <ul>
              {props.features.map((feature, i) => <li key={i}>{feature}</li>)}
            </ul>
          </div>
          {props.gallery && wrapContent(<ProjectGallery media={props.gallery}/>)}
          {props.video && wrapContent(<iframe width="768" height="432" src={props.video}></iframe>)}
          {props.clip && wrapContent(content)}
          <div style={{paddingTop: '10px'}}>
            <h4>Description</h4>
            {props.paragraphs.map(processParagraph)}
          </div>
        </div>
      </Collapse>
    </div>
  );
}