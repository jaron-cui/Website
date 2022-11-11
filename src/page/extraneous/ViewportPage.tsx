import { CENTERED_VERTICAL } from "../../util/styles";
import Viewport3D from "../../Viewport3D";

export default function ViewportPage() {
  return (
    <div style={CENTERED_VERTICAL}>
      <h1>A 3D viewport built from scratch in JavaScript!</h1>
      <h3>Use WASD to move, and IJKL to pan!</h3>
      <div style={{margin: '40px'}}>
        <Viewport3D />
      </div>
    </div>
  );
}