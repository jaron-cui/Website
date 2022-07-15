import { TextField } from "@mui/material";
import { useState, useEffect } from "react";
import { DEFAULT_FONT } from "../../util/constants";

type EntryFields = {
  id: string;
}

type SearchableEntriesProps<EntryProps extends EntryFields> = {
  title: string;
  entries: EntryProps[];
  sort: (a: EntryProps, b: EntryProps) => number;
  searchFor: (search: string) => (entry: EntryProps) => boolean;
  Entry: (props: EntryProps & {
    open: boolean;
    setOpen: (value: boolean) => void
  }) => React.ReactElement;
}

export default function SearchableEntries<EntryProps extends EntryFields>(
  { title, entries, sort, searchFor, Entry }: SearchableEntriesProps<EntryProps>
) {
  const [search, setSearch] = useState<string>('');
  const [displayed, setDisplayed] = useState<EntryProps[]>([]);
  const [opened, setOpened] = useState<Set<string>>(new Set());

  useEffect(() => {
    setDisplayed(entries.filter(searchFor(search)).sort(sort));
  }, [search])

  return (
    <div style={{
      ...DEFAULT_FONT,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'left'
    }}>
      <span style={{
            paddingBottom: '20px',
            height: '80px'
          }}>
        <TextField
          label={title}
          onChange={event => setSearch(event.target.value)}
          inputProps={{style: DEFAULT_FONT}}
          InputLabelProps={{style: DEFAULT_FONT}}
          style={{
            width: '100%'
          }}
        />
        {
          search && <i style={{color: '#6A6A6A'}}>
            Showing {displayed.length} result{displayed.length !== 1 && 's'} for '{search}'
          </i>
        }
      </span>{
        displayed.map(entry => (
          <div key={entry.id}>
            <Entry {...{
              ...entry,
              open: opened.has(entry.id),
              setOpen: (toOpen: boolean) => {
                if (toOpen) {
                  opened.has(entry.id) || setOpened(new Set(opened.add(entry.id)));
                } else {
                  opened.delete(entry.id) && setOpened(new Set(opened));
                }
              }
            }} />
          </div>
        ))
      }
    </div>
  );
}