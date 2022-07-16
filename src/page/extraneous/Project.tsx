import Clip from "../../Clip";
import { DEFAULT_FONT } from "../../util/styles";
import NotFound from "../NotFound";
import { wrapContent } from "../../util/util";
import { ProjectInfo } from "../../util/types";
import { PROJECT_MAP } from "../../util/constants";

function Project(props: ProjectInfo) {
  return (
    <div style={{...DEFAULT_FONT, marginTop:'30px'}}>
      <h2>{props.title}</h2>
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

export default function ProjectPage({ project }: { project: string }) {
  const projectInfo = PROJECT_MAP[project];

  return (
    projectInfo ?
      <Project {...projectInfo}/> :
      <NotFound message='This project page does not exist! Check the projects page in case it was moved.'/>
  );
}