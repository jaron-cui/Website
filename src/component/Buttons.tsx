import { IconButton, Tooltip } from "@mui/material";
import { useState } from "react";
import { BoxArrowUpRight, Clipboard, ClipboardCheck, Icon } from "react-bootstrap-icons";
import { BUTTON_STYLE } from "../util/styles";

export function LinkButton({ link, Img }: { link: string, Img?: Icon }) {
  const Icon = Img || BoxArrowUpRight;
  return (
    <Tooltip title='Open in new tab'>
      <IconButton 
        href={link}
        target='_blank'
        rel='noreferrer noopener'
        sx={{
          ...BUTTON_STYLE,
          color: '#777777',
          '&:hover': {
            color: 'black'
          }
      }}>
        <Icon size='15px'/>
      </IconButton>
    </Tooltip>
  )
}

export function CopyButton({ text }: { text: string }) {
  const [clicked, setClicked] = useState<boolean>(false);
  const Icon = clicked ? ClipboardCheck : Clipboard;

  return (
    <Tooltip title={clicked ? 'Copied!' : 'Copy'} placement='right'>
      <IconButton 
        onClick={() => {
          setClicked(true);
          navigator.clipboard.writeText(text);
        }}
        onBlur={() => {
          setClicked(false);
        }}
        sx={{
          ...BUTTON_STYLE,
          color: 'black',
          '&:hover': {
            color: '#555555'
          }
      }}>
        <Icon size='15px'/>
      </IconButton>
    </Tooltip>
  )
}