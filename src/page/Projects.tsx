import { dateToString, ProjectInfo, PROJECTS } from '../util/util';
import ProjectEntry from './component/ProjectEntry';
import SearchableEntries from './component/SearchableEntries';

export default function Projects() {
  return (
    <SearchableEntries<ProjectInfo>
      title='Search projects (e.g. "java", "physics")'
      entries={PROJECTS}
      sort={(e1, e2) => (e2.date.localeCompare(e1.date))}
      searchFor={searchFor}
      Entry={ProjectEntry}
    />
  );
}

function searchFor(search: string) {
  return function matchProject(project: ProjectInfo) {
    const strings: string[] = [
      dateToString(project.date),
      project.title,
      ...project.technologies,
      ...project.features
    ];

    for (const string of strings) {
      if (string.toLowerCase().includes(search.toLowerCase())) {
        return true;
      }
    }

    return false;
  }
}
