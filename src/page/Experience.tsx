import { EXPERIENCES } from "../util/constants";
import { ExperienceInfo, Timeframe } from "../util/types";
import { isSemesterTimeframe, semesterToDate, stringsContain } from "../util/util";
import ExperienceEntry from "./component/ExperienceEntry";
import SearchableEntries from "./component/SearchableEntries";

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

    return stringsContain(strings, search);
  }
}