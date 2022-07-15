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