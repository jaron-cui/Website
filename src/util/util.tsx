import projects from '../data/projects.json';
import experiences from '../data/experiences.json';

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

export type Season = 'Spring' | 'Summer I' | 'Summer II' | 'Fall'

export type Semester = `${Season} ${number}`;

export type Semesters = {
  semesters: Semester[];
}

export type StartAndEnd = {
  start: string;
  end: string;
}

export type Timeframe = Semesters | StartAndEnd;

export type ExperienceInfo = {
  id: string;
  title: string;
  organization: string;
  timeframe: Timeframe;
  paragraphs: string[];
  projects?: string[];
}

export const PROJECTS: ProjectInfo[] = projects;

const projectMap: {[key in string]: ProjectInfo} = {};
projects.forEach(project => projectMap[project.id] = project);

export const PROJECT_MAP = projectMap;

export const EXPERIENCES: ExperienceInfo[] = experiences as ExperienceInfo[];

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

export function dateToString(date: string) {
  return new Date(`${date}T00:00:00`).toLocaleString('default', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })
}

export function isSemesterTimeframe(timeframe: Timeframe): timeframe is Semesters {
  return !!((timeframe as Semesters).semesters);
}

export function formatTimeframe(timeframe: Timeframe) {
  return isSemesterTimeframe(timeframe) ?
    timeframe.semesters.join(' | ') :
    `${dateToString(timeframe.start)} - ${dateToString(timeframe.end)}`;
}

const SEASON_TO_DATE = {
  'Spring': '01-01',
  'Summer I': '05-09',
  'Summer II': '07-05',
  'Fall': '09-08'
};

export function semesterToDate(semester: Semester) {
  const parts = semester.split(' ');
  let season, year;
  if (parts.length === 2) {
    season = parts[0];
    year = parts[1]
  } else {
    season = `${parts[0]} ${parts[1]}`;
    year = parts[2];
  }
  return `${year}-${SEASON_TO_DATE[season as Season]}`;
}

console.log('loaded resources');