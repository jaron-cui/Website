import { Button, Collapse, IconButton } from '@mui/material';
import { useState, useEffect } from "react";
import { BoxArrowUpRight } from "react-bootstrap-icons";
import Clip from "../../Clip";
import { DEFAULT_FONT, BUTTON_STYLE } from "../../util/constants";
import { ProjectInfo, dateToString, wrapContent } from "../../util/util";

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