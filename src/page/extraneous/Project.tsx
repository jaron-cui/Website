import Clip from "../../Clip";
import { DEFAULT_FONT } from "../../util/styles";
import NotFound from "../NotFound";
import { processParagraph, wrapContent } from "../../util/util";
import { ProjectInfo } from "../../util/types";
import { PROJECT_MAP } from "../../util/constants";
import { Github } from "react-bootstrap-icons";
import { LinkButton } from "../../component/Buttons";
import ProjectEntry from "../../component/ProjectEntry";

function Project(props: ProjectInfo) {
  return (
    <div style={{...DEFAULT_FONT, marginTop:'30px'}}>
      <h2>{props.title}<LinkButton link={props.repository} Img={Github} label='View on GitHub'/></h2>
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
        {props.paragraphs.map(processParagraph)}
      </div>
    </div>
  );
}

export default function ProjectPage({ project }: { project: string }) {
  const projectInfo = PROJECT_MAP[project];

  return (
    projectInfo ?
      <ProjectEntry open={true} locked={true} setOpen={()=>0} {...projectInfo}/> :
      <NotFound message='This project page does not exist! Check the projects page in case it was moved.'/>
  );
}