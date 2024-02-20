import NotFound from "../NotFound";
import { PROJECT_MAP } from "../../util/constants";
import ProjectEntry from "../../component/ProjectEntry";

export default function ProjectPage({ project }: { project: string }) {
  const projectInfo = PROJECT_MAP[project];

  return (
    projectInfo ?
      <ProjectEntry open={true} locked={true} setOpen={()=>0} {...projectInfo}/> :
      <NotFound message='This project page does not exist! Check the projects page in case it was moved.'/>
  );
}