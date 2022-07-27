import { useEffect, useState } from "react";

export default function WidthSwitch<T>(
  { props, Wide, Narrow, breakpoint }: { props: T, Wide: (props: T) => JSX.Element, Narrow: (props: T) => JSX.Element, breakpoint: number }
) {
  const [width, setWidth] = useState<number>(window.innerWidth);
  
  useEffect(() => {
    const updateWidth = () => setWidth(window.innerWidth);
    window.addEventListener('resize', updateWidth);
    return () => window.removeEventListener('resize', updateWidth);
  }, []);

  return width > breakpoint ? <Wide {...props}/> : <Narrow {...props}/>;
}