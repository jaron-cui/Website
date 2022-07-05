import projects from './projects.json';

export type ProjectInfo = {
  id: string;
  title: string;
  date: string;
  technologies: string[];
  features: string[];
  paragraphs: string[];
  video?: string;
  clip?: string;
};

export const PROJECTS: ProjectInfo[] = projects;

const projectMap: {[key in string]: ProjectInfo} = {};
projects.forEach(project => projectMap[project.id] = project);

export const PROJECT_MAP = projectMap;

export function wrapContent(content: any) {
  return (
    <div style={{
      width:'100%',
      display:'flex',
      justifyContent: 'center',
      backgroundColor: '#EEEEEE'
    }}>
      {content}
    </div>
  );
}