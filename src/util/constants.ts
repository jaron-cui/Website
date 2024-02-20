import { ExperienceInfo, ProjectInfo } from "./types";
import links from '../data/links.json';
import projects from '../data/projects.json';
import experiences from '../data/experiences.json';
import { NEW_PROJECTS } from "./projects";

export const LINKS = links;

export const LEGACY_PROJECTS: ProjectInfo[] = projects.map(project => ({ legacy: true, ...project })) as ProjectInfo[];
export const PROJECTS: ProjectInfo[] = [...LEGACY_PROJECTS, ...NEW_PROJECTS];

const projectMap: {[key in string]: ProjectInfo} = {};
PROJECTS.forEach(project => projectMap[project.id] = project);

export const PROJECT_MAP = projectMap;

export const EXPERIENCES: ExperienceInfo[] = experiences as ExperienceInfo[];

export const TECH_SYNONYMS : { [key in string]: string[] } = {
  'JavaScript': ['JS'],
  'TypeScript': ['TS'],
  'React': ['ReactJS'],
  'Racket': ['ISL', 'Intermediate Student Language'],
  'Spring': ['Spring Boot', 'Spring Framework']
}

export const TECH_DEPENDENCIES: { [key in string]: string[] } = {
  'React Native': ['React', 'IOS', 'Android'],
  'React': ['Node', 'JavaScript'],
  'Node': ['npm'],
  'TypeScript': ['JavaScript'],
  'JavaScript': ['HTML', 'CSS'],
  'Java': ['Gradle', 'Maven'],
  'Spring': ['REST', 'Java', 'Jackson'],
  'Rust': ['cargo'],
  'Racket (Intermediate Student Language)': ['Racket']
}