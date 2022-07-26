import { Button, Collapse, IconButton } from '@mui/material';
import { useState, useEffect } from "react";
import { Github } from 'react-bootstrap-icons';
import Clip from "../Clip";
import { DEFAULT_FONT, BUTTON_STYLE, TRUNCATE_TEXT, CENTERED_VERTICAL } from "../util/styles";
import { ProjectInfo } from '../util/types';
import { dateToString, processParagraph, wrapContent } from "../util/util";
import { LinkButton } from './Buttons';

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

function ProjectEntryButton(props: ProjectEntryProps) {
  return (
    <Button onClick={() => props.setOpen(!props.open)} sx={{
      ...DEFAULT_FONT,
      ...BUTTON_STYLE,
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

export default function ProjectEntry(props: ProjectEntryProps) {
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