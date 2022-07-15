import { DEFAULT_FONT } from "../util/constants";
import NotFound from "./NotFound";
import { dateToString, ExperienceInfo, EXPERIENCES, formatTimeframe, isSemesterTimeframe, semesterToDate, Timeframe } from "../util/util";

function ExperienceEntry({ title, organization, timeframe, paragraphs, projects }: ExperienceInfo) {
  return (
    <div>
      <h4>{title} | {organization}</h4>
      <h6>{formatTimeframe(timeframe)}</h6>
      <div>{paragraphs.map(paragraph => <p>{paragraph}</p>)}</div>
    </div>
  );
}

function compareByDate(a: ExperienceInfo, b: ExperienceInfo) {
  function asStartDate(timeframe: Timeframe) {
    if (isSemesterTimeframe(timeframe)) {
      const semesters = timeframe.semesters.map(semesterToDate).sort((a, b) => b.localeCompare(a));
      return semesters[semesters.length - 1];
    } else {
      return timeframe.start;
    }
  }

  return asStartDate(b.timeframe).localeCompare(asStartDate(a.timeframe));
}

export default function Experience() {
  return (
    <div style={DEFAULT_FONT}>
      {EXPERIENCES.sort(compareByDate).map(experience => <ExperienceEntry {...experience}/>)}
    </div>
  );
}