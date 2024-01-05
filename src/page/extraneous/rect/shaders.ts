export const vertexShader = `
precision mediump float;

attribute vec2 aVertexPosition;
attribute vec2 aUvs;

varying vec2 vUvs;
varying vec2 vPos;

void main() {

    vUvs = aUvs;
    gl_Position = vec4(aVertexPosition, 0.0, 1.0);
    vPos = gl_Position.xy;
}
`

export const fragmentShader = `
precision mediump float;

varying vec2 vUvs;
varying vec2 vPos;

uniform sampler2D uBlockTextures;
uniform int uBlockSize;

uniform vec2 uScreenSize;
uniform vec2 uBlockOffset;
uniform vec2 uGridSize;

uniform int uBlockTypes;
uniform sampler2D uTerrain;

uniform int wind;

void main() {
  vec2 pixelPos = ((vPos + 1.0) * 0.5) * uScreenSize;
  //pixelPos = vec2(pixelPos.x, uScreenSize.y - pixelPos.y);

  vec2 relativePos = pixelPos - uBlockOffset;
  vec2 blockPos = relativePos / float(uBlockSize);
  vec2 c = floor(blockPos);
  if (c.x < 0.0 || c.x >= uGridSize.x || c.y < 0.0 || c.y >= uGridSize.y) {
    discard;
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  int blockType = int(255.0 * texture2D(uTerrain, c / uGridSize).a);
  int textureVariant = blockType == 1 || blockType == 2 ? wind + 2 : 0;
  if (blockType == 0) {
    discard;
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  vec2 subTextureOffset = blockPos - c;

  vec2 textureOffset = vec2((subTextureOffset.x + float(textureVariant)) / 5.0, (1.0 - subTextureOffset.y + float(blockType - 1)) / float(uBlockTypes));

  gl_FragColor = vec4(texture2D(uBlockTextures, textureOffset));
}
`