import { IconButton, Tooltip } from "@mui/material";
import { useEffect, useState } from "react";
import { BoxArrowUpRight, CaretLeft, CaretLeftFill, CaretRight, CaretRightFill, Clipboard, ClipboardCheck, Icon } from "react-bootstrap-icons";
import { BUTTON_STYLE } from "../util/styles";

export function LinkButton({ link, Img, label }: { link?: string, Img?: Icon, label?: string }) {
  const Icon = Img || BoxArrowUpRight;
  return (
    <Tooltip title={label || ''} placement='right'>
      <IconButton 
        href={link || ''}
        disabled={!link}
        target='_blank'
        rel='noreferrer noopener'
        sx={{
          ...BUTTON_STYLE,
          margin: '2px',
          color: 'black',
          '&:hover': {
            color: '#777777'
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

export function SideButton({ direction, label, onClick }: { direction: 'left' | 'right', label?: string, onClick: () => void }) {
  const [Arrow, ArrowClicked] = direction == 'left' ? [CaretLeft, CaretLeftFill] : [CaretRight, CaretRightFill];
  const [Icon, setIcon] = useState<Icon>(Arrow);

  useEffect(() => {
    setTimeout(() => {
      setIcon(Arrow);
    }, 50)
  }, [Icon]);

  return (
    <Tooltip title={label || ''} placement={direction == 'left' ? 'right' : 'left'}>
      <IconButton
        onClick={() => {
          setIcon(ArrowClicked);
          onClick();
        }}
        sx={{
          ...BUTTON_STYLE,
          height: '100%',
          width: '60px',
          backgroundColor: '#DDDDDD'
      }}>
        <Icon size='15px/'/>
      </IconButton>
    </Tooltip>
  )
}