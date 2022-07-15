import { Timeframe, Semesters, Semester, Season } from './types';

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