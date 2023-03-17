import { Input, TextField } from "@mui/material"
import { useState } from "react"
import { Button } from "react-bootstrap";
import { CENTERED_VERTICAL, DEFAULT_FONT } from "../../util/styles"

export const StringUtil = () => {
  const [input, setInput] = useState<string>('');
  const [remove, setRemove] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  
  return (
    <div style={{...DEFAULT_FONT, ...CENTERED_VERTICAL, marginTop:'30px'}}>
      <Button onClick={() => setOutput(input.replaceAll(remove, ''))}>APPLY</Button>
      <TextField onChange={e => setInput(e.target.value)} value={input} label='input'/>
      <TextField onChange={e => setRemove(e.target.value)} value={remove} label='remove'/>
      <TextField value={output} label='result'/>
    </div>
  )
}