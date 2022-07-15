import { EXPERIENCES } from "../util/constants";
import { ExperienceInfo, Timeframe } from "../util/types";
import { formatTimeframe, isSemesterTimeframe, semesterToDate } from "../util/util";
import SearchableEntries from "./component/SearchableEntries";

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

function searchFor(search: string) {
  return function matchExperience(experience: ExperienceInfo) {
    const strings = [
      experience.id,
      experience.title,
      experience.organization,
      ...(experience.projects ? experience.projects : [])
    ];

    for (const string of strings) {
      if (string.toLowerCase().includes(search.toLowerCase())) {
        return true;
      }
    }

    return false;
  }
}

export default function Experience() {
  return (
    <SearchableEntries<ExperienceInfo>
      title='Search experiences (e.g. "teaching assistant")'
      entries={EXPERIENCES}
      sort={compareByDate}
      searchFor={searchFor}
      Entry={ExperienceEntry}
    />
  );
}