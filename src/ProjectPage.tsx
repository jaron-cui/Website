import { useParams } from "react-router-dom";
import Clip from "./Clip";
import { DEFAULT_FONT } from "./constants";
import NotFound from "./NotFound";
import { ProjectInfo, PROJECTS, PROJECT_MAP, wrapContent } from "./util";

function Project(props: ProjectInfo) {
  return (
    <div style={{...DEFAULT_FONT, marginTop:'30px'}}>
      <div>
        <h4>Features</h4>
        <ul>
          {props.features.map((feature, i) => <li key={i}>{feature}</li>)}
        </ul>
      </div>
      {props.video && wrapContent(<iframe width="768" height="432" src={props.video}></iframe>)}
      {props.clip && wrapContent(<Clip link={props.clip}/>)}
      <div style={{paddingTop: '10px'}}>
        <h4>Description</h4>
        {props.paragraphs.map((paragraph, i) => <p key={i}>{paragraph}</p>)}
      </div>
    </div>
  );
}

export default function ProjectPage() {
  const { project } = useParams() || '';
  const projectInfo = PROJECT_MAP[project as string];
  return (
    projectInfo ?
      <Project {...projectInfo}/> :
      <NotFound message='This project page does not exist! Check the projects page in case it was moved.'/>
  );
}