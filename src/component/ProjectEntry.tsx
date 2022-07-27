import { Collapse } from '@mui/material';
import { useState, useEffect } from "react";
import { Github } from 'react-bootstrap-icons';
import Clip from "../Clip";
import { DEFAULT_FONT } from "../util/styles";
import { processParagraph, wrapContent } from "../util/util";
import { LinkButton } from './Buttons';
import ProjectEntryGallery from './ProjectEntryGallery';
import ProjectEntryLabel, { ProjectEntryProps } from './ProjectEntryLabel';

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
      paddingBottom: '4px',
      width: '100%'
      }}>
      <div style={{display: 'flex', flexDirection: 'row', width: '100%', justifyContent: 'space-between'}}>
        <span style={{flexGrow: 1, minWidth: 0}}>
          <ProjectEntryLabel {...props}/>
        </span>
        <span style={{margin: '8px', width: '40px'}}>
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
          {props.gallery && wrapContent(<ProjectEntryGallery media={props.gallery}/>)}
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