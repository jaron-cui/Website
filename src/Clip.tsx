import { useRef, useState } from "react";
import { CircularProgress } from "@mui/material";

export default function Clip(props: {link: string}) {
  const video = useRef(null);
  const [loaded, setLoaded] = useState<boolean>(false);

  return (
    <>
      {loaded || <CircularProgress />}
      <video autoPlay loop muted id='video'
        ref={video}
        onLoadedData={() => setLoaded(true)}
        style={{
          width: '60%'
        }}>
        <source src={props.link} type='video/mp4'/>
      </video>
    </>
  );
}