import { useRef, useState } from "react";
import { CircularProgress } from "@mui/material";

export default function Clip(props: {link: string}) {

  return (
    <>
      <iframe id='video'
        src={props.link}
        allow='autoplay'
        width="768" height="432">
      </iframe>
    </>
  );
}