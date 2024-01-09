import { useRef, useEffect } from "react";

const TypingHandler = ({ onKey }: { onKey: (key: string) => void }) => {
  const keyboardHandler = useRef<(event: KeyboardEvent) => void>(() => null);

  useEffect(() => {
    keyboardHandler.current = (event: KeyboardEvent) => {
      onKey(event.key);
    };
  }, [onKey]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => keyboardHandler.current(event);
    document.addEventListener('keydown', handler, false);
    return () => document.removeEventListener('keydown', handler, false);
  }, []);

  return <></>;
}

export default TypingHandler;
