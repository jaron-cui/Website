import { ExperienceInfo } from "../util/types";
import { formatTimeframe } from "../util/util";

export default function ExperienceEntry({ title, organization, timeframe, paragraphs, projects }: ExperienceInfo) {
  return (
    <div>
      <h4>{title} | {organization}</h4>
      <h6>{formatTimeframe(timeframe)}</h6>
      <div>{paragraphs.map(paragraph => <p>{paragraph}</p>)}</div>
    </div>
  );
}