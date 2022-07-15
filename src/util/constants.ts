import { ExperienceInfo, ProjectInfo } from "./types";
import projects from '../data/projects.json';
import experiences from '../data/experiences.json';

export const PROJECTS: ProjectInfo[] = projects;

const projectMap: {[key in string]: ProjectInfo} = {};
projects.forEach(project => projectMap[project.id] = project);

export const PROJECT_MAP = projectMap;

export const EXPERIENCES: ExperienceInfo[] = experiences as ExperienceInfo[];