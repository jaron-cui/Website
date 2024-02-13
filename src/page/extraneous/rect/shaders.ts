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

uniform float wind;

void main() {
  vec2 pixelPos = ((vPos + 1.0) * 0.5) * uScreenSize;
  pixelPos = vec2(pixelPos.x, uScreenSize.y - pixelPos.y);

  vec2 relativePos = pixelPos - uBlockOffset;
  vec2 blockPos = relativePos / float(uBlockSize);
  vec2 c = floor(blockPos);
  if (c.x < 0.0 || c.x >= uGridSize.x || c.y < 0.0 || c.y >= uGridSize.y) {
    discard;
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  int blockType = int(255.0 * texture2D(uTerrain, c / uGridSize).a);

  float period = 50.0;

  float theta = (blockPos.x / period + wind) * 2.0 * 3.14159;
  int windTexture = int(floor((sin(theta) + 1.0) * 2.0 + 0.5));
  
  int blockTexX, blockTexY;
  if (blockType == 1) {
    // grass
    blockTexY = 0;
    blockTexX = windTexture;
  } else if (blockType == 2) {
    // tall grass
    blockTexY = 1;
    blockTexX = windTexture;
  } else if (blockType == 3) {
    // concrete
    blockTexY = 2;
    blockTexX = 0;
  } else if (blockType == 4) {
    // soil
    blockTexY = 2;
    blockTexX = 1;
  } else if (blockType == 5) {
    // sand
    blockTexY = 2;
    blockTexX = 2;
  } else if (blockType == 6) {
    // brick
    blockTexY = 2;
    blockTexX = 3;
  }
  // blockTexX = 1;
  // blockTexY = 1;

  if (blockType == 0) {
    discard;
    gl_FragColor = vec4(0.0, 0.0, 0.0, 1.0);
    return;
  }
  vec2 subTextureOffset = blockPos - c;

  vec2 textureOffset = vec2((subTextureOffset.x + float(blockTexX)), (1.0 - subTextureOffset.y + float(blockTexY))) / float(uBlockTypes);

  gl_FragColor = vec4(texture2D(uBlockTextures, textureOffset));
}
`