import { useRef, useEffect } from "react";

const TypingHandler = ({ onKeyDown, onKeyUp }: { onKeyDown?: (key: string) => void, onKeyUp?: (key: string) => void }) => {
  const keyboardHandler = useRef<(event: KeyboardEvent) => void>(() => null);

  useEffect(() => {
    keyboardHandler.current = (event: KeyboardEvent) => {
      if (event.type === 'keydown' && onKeyDown) {
        onKeyDown(event.key);
      } else if (event.type == 'keyup' && onKeyUp) {
        onKeyUp(event.key);
      }
    };
  }, [onKeyDown]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => keyboardHandler.current(event);
    document.addEventListener('keydown', handler, false);
    document.addEventListener('keyup', handler, false);
    return () => {
      document.removeEventListener('keydown', handler, false);
      document.removeEventListener('keyup', handler, false);
    };
  }, []);

  return <></>;
}

export default TypingHandler;
