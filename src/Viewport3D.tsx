import { useEffect, useRef, useState } from "react";

/**
 * EXCUSE THE APPEARANCE:
 * Coded in a .js file Oct 4, 2021 and hastily pasted into personal website React+TypeScript rework
 * Cleanup coming!
 */

// Constants
const SCREENWIDTH = 600
const SCREENHEIGHT = 400
const MOVESPEED = 2
const PANSPEED = .8
const PANLIMIT = 89

let keys = new Set()

document.addEventListener("keydown", key => keys.add(key["key"]))
document.addEventListener("keyup", key => keys.delete(key["key"]))

let cameraActions = new Map()
let pitch = 0
let yaw = 0

function moveCamera(pos: any, vec: any, direction: number[], scale: number) {
    return [addVectors(pos, scaleVector(direction, scale * MOVESPEED)), vec]
}
function panCamera(yawScale: number, pitchScale: number) {
    return (pos: any, vec: any) => {
        pitch = Math.max(Math.min(pitch + pitchScale * PANSPEED, PANLIMIT), -PANLIMIT)
        yaw += yawScale * PANSPEED
        return [pos, recalculateCameraVector()]
    }
}
// Camera-level movement controls
cameraActions.set("w", (pos: any, vec: any) => moveCamera(pos, vec, vec, 1))
cameraActions.set("a", (pos: any, vec: any) => moveCamera(pos, vec, screenXVector(vec), -1))
cameraActions.set("s", (pos: any, vec: any) => moveCamera(pos, vec, vec, -1))
cameraActions.set("d", (pos: any, vec: any) => moveCamera(pos, vec, screenXVector(vec), 1))
// Camera-vertical movement controls
cameraActions.set("e", (pos: any, vec: any) => moveCamera(pos, vec, screenYVector(vec), 1))
cameraActions.set("q", (pos: any, vec: any) => moveCamera(pos, vec, screenYVector(vec), -1))
// Camera panning controls
cameraActions.set("i", panCamera(0, 1))
cameraActions.set("k", panCamera(0, -1))
cameraActions.set("j", panCamera(-1, 0))
cameraActions.set("l", panCamera(1, 0))

function toRadians(degrees: number) {
    return degrees / 180 * Math.PI
}

function recalculateCameraVector() {
    let radPitch = toRadians(pitch)
    let radYaw = toRadians(yaw)
    let horizontalComponent = Math.abs(Math.cos(radPitch))

    let xComponent = horizontalComponent*Math.cos(radYaw)
    let yComponent = horizontalComponent*Math.sin(radYaw)
    let zComponent = Math.sin(radPitch)
    return [xComponent, yComponent, zComponent]
}

function handleCameraMovement(cameraPosition: number[], cameraVector: number[]) {
    let acc = [cameraPosition.slice(), cameraVector.slice()]
    keys.forEach((key) => {
        if (cameraActions.has(key)) {
            acc = cameraActions.get(key)(acc[0], acc[1])
            needsUpdate = true
        }
    });
    return acc
}

function htmlLine(center: any[], x1: number, y1: number, x2: number, y2: number) {
    let line = document.createElementNS("http://www.w3.org/2000/svg","line");
    line.setAttribute("x1", (x1 + center[0]).toString());
    line.setAttribute("y1", (y1 + center[1]).toString());
    line.setAttribute("x2", (x2 + center[0]).toString());
    line.setAttribute("y2", (y2 + center[1]).toString());
    line.setAttribute("stroke", "black")
    return line
}

function htmlBar(center: number[], length: number) {
    let lineRad = length / 2
    return htmlLine(center, -lineRad, 0, lineRad, 0)
}

function htmlPole(center: number[], length: number) {
    let lineRad = length / 2
    return htmlLine(center, 0, -lineRad, 0, lineRad)
}

function sortFaces(faces: any[], cameraPosition: number[]) {
    let tagged = []
    for (let face of faces) {
        tagged.push([distance(cameraPosition, face.center), face])
    }

    return mergeSort(tagged).map((x: any[]) => x[1])

    function merge(facesA: any, facesB: any) {
        let merged = []
        let current = [facesA, 0]
        let other = [facesB, 0]
        while (current[1] < current[0].length && other[1] < other[0].length) {
            let currentFace = current[0][current[1]]
            let otherFace = other[0][other[1]]
            if (currentFace[0] <= otherFace[0]) {
                let temp = current
                current = other
                other = temp
            }
            merged.push(current[0][current[1]])
            current[1] += 1
        }
        for (let taggedFace of other[1] == other[0].length ? current[0].slice(current[1]) : other[0].slice(other[1])) {
            merged.push(taggedFace)
        }
        return merged
    }

    function mergeSort<T>(taggedFaces: T[]): T[] {
        if (taggedFaces.length <= 1) {
            return taggedFaces
        }
        let split = Math.floor(taggedFaces.length / 2)
        let firstHalf = mergeSort(taggedFaces.slice(0, split))
        let secondHalf = mergeSort(taggedFaces.slice(split, taggedFaces.length))
        return merge(firstHalf, secondHalf)
    }
}

function distance(a: any, b: any) {
    let delta = addVectors(a, scaleVector(b, -1))
    let total = 0
    for (let component of delta) {
        total += component*component
    }
    return Math.sqrt(total)
}

function roundTo(number: number, places: number) {
    let factor = Math.pow(10, places)
    return Math.round(number * factor) / factor
}

function roundVector(vector: any[]) {
    return vector.map((x: number) => Math.round(x))
}

function screenPosition(point1: number[], cameraPosition: any, cameraBasis: any) {
    let key = String(roundVector(point1))
    if (pointMap.has(key)) {
        return pointMap.get(key)
    }
    let point = addVectors(point1, scaleVector(cameraPosition, -1))
    let converted = multiplyMatrixVector(cameraBasis, point)
    if (converted[2] < 0) {
        return [null, null]
    }
    let distanceScale = 600/converted[2]
    let x = converted[0]
    let y = converted[1]
    let screenPos = [distanceScale*x + SCREENWIDTH/2, SCREENHEIGHT/2 - distanceScale*y]
    pointMap.set(key, screenPos)
    return screenPos
}

function multiplyMatrixVector(matrix: { [x: string]: { [x: string]: number; }; }, vector: any[]) {
    let output = []
    for (let y = 0; y < 3; y += 1) {
        let element = 0
        for (let x = 0; x < 3; x += 1) {
            element += vector[x]*matrix[y][x]
        }
        output[y] = element
    }
    return output
}

function multiplyMatrices(matrixA: any, matrixB: number[][]) {
    let products = []
    for (const column of transpose(matrixB)) {
        products.push(multiplyMatrixVector(matrixA, column))
    }
    return transpose(products)
}

function screenXVector(vector: number[]) {
    let radYaw = toRadians(yaw)
    let x = Math.cos(radYaw)
    let y = Math.sin(radYaw)
    return [-y, x, 0]
}

function screenYVector(vector: any[]) {
    let x = vector[0]
    let y = vector[1]
    let z = vector[2]
    let direction = unitVector([-x*z, -y*z, (x*x + y*y)])
    return direction
}

function rotationMatrixX(theta: number) {
    return [[1, 0, 0], [0, Math.cos(theta), -Math.sin(theta)], [0, Math.sin(theta), Math.cos(theta)]]
}

function rotationMatrixY(theta: number) {
    return [[Math.cos(theta), 0, Math.sin(theta)], [0, 1, 0], [-Math.sin(theta), 0, Math.cos(theta)]]
}

function rotationMatrixZ(theta: number) {
    return [[Math.cos(theta), -Math.sin(theta), 0], [Math.sin(theta), Math.cos(theta), 0], [0, 0, 1]]
}

function addVectors(vector1: number[], vector2: number[]) {
    return [vector1[0] + vector2[0], vector1[1] + vector2[1], vector1[2] + vector2[2]]
}

function unitVector(vector: number[]) {
    return scaleVector(vector, 1/vectorLength(vector))
}

function vectorLength(vector: any[]) {
    let x = vector[0]
    let y = vector[1]
    let z = vector[2]
    return Math.sqrt(x*x + y*y + z*z)
}

function scaleVector(vector: any[], factor: number) {
    let x = vector[0]
    let y = vector[1]
    let z = vector[2]
    return [factor*x, factor*y, factor*z]
}

function transpose(matrix: string | any[]) {
    let transposed = []
    for (let y = 0; y < matrix[0].length; y += 1) {
        let row = []
        for (let x = 0; x < matrix.length; x += 1) {
            row.push(matrix[x][y])
        }
        transposed.push(row)
    }
    return transposed
}

function invertMatrix(matrix: number[][]) {
    let row1: number[] = [], row2: number[] = [], row3: number[] = [];
    let inv1: number[] = [], inv2: number[] = [], inv3: number[] = [];
    
    // Orders the rows so that the first element of the first row is nonzero,
    // the second element of the second row is nonzero, and the third of
    // the third row is nonzero.
    let rows = [matrix[0].slice(), matrix[1].slice(), matrix[2].slice()]
    let identityRows = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]

    for (let i = 0; i < 3; i += 1) {
        if (rows[i][0] != 0) {
            let others = [0, 1, 2].filter(x => x != i)
            if (rows[others[0]][2] != 0 && rows[others[1]][1] != 0) {
                let temp = others[0]
                others[0] = others[1]
                others[1] = temp
            } else if (rows[others[0]][1] == 0 || rows[others[1]][2] == 0) {
                continue
            }
            row1 = rows[i]
            row2 = rows[others[0]]
            row3 = rows[others[1]]
            inv1 = identityRows[i]
            inv2 = identityRows[others[0]]
            inv3 = identityRows[others[1]]
            break
        }
    }
    // BUG ORIGINATES HERE - I HYPOTHESIZE THAT THIS DOESN'T ALWAYS ORDER CORRECTLY

    // If this cannot be done, the matrix has no inverse.
    if (inv1 == null) {
        return null
    }

    let scale

    // Scales the first row so that the first element is 1. [1, b, c]
    scale = 1/row1[0]
    row1 = scaleVector(row1, scale)
    inv1 = scaleVector(inv1, scale)

    // Zeroes the first elements of the first and second rows. [0, b, c]
    scale = -row2[0]
    row2 = addVectors(row2, scaleVector(row1, scale))
    inv2 = addVectors(inv2, scaleVector(inv1, scale))
    scale = -row3[0]
    row3 = addVectors(row3, scaleVector(row1, scale))
    inv3 = addVectors(inv3, scaleVector(inv1, scale))

    // Scales the second row so that the second element is 1. [0, 1, c]
    scale = 1/row2[1]
    row2 = scaleVector(row2, scale)
    inv2 = scaleVector(inv2, scale)

    // Zeroes the second element of the third row.
    scale = -row3[1]
    row3 = addVectors(row3, scaleVector(row2, scale))
    inv3 = addVectors(inv3, scaleVector(inv2, scale))

    // Scales the third row so that the third element is 1. [0, 0, 1]
    scale = 1/row3[2]
    row3 = scaleVector(row3, scale)
    inv3 = scaleVector(inv3, scale)

    // Zeroes the third element of the second row. [0, 1, 0]
    scale = -row2[2]
    row2 = addVectors(row2, scaleVector(row3, scale))
    inv2 = addVectors(inv2, scaleVector(inv3, scale))

    // Zeroes the second and third elements of the first row. [1, 0, 0]
    scale = -row1[1]
    row1 = addVectors(row1, scaleVector(row2, scale))
    inv1 = addVectors(inv1, scaleVector(inv2, scale))
    scale = -row1[2]
    row1 = addVectors(row1, scaleVector(row3, scale))
    inv1 = addVectors(inv1, scaleVector(inv3, scale))

    let output = []
    output[0] = inv1
    output[1] = inv2
    output[2] = inv3
    return output
}

function vectorToString(vector: number[]) {
    let copy = vector.slice()
    if (copy.length == 0) {
        return "<>"
    }
    let output = "<"
    const last = copy.pop() as number;
    for (const component of copy) {
        output += (Math.round(component * 100) / 100) + ", "
    }
    return output + (Math.round(last * 100) / 100) + ">"
}

function matrixToString(matrix: number[][]) {
    let copy = matrix.slice()
    if (copy.length == 0) {
        return "<>"
    }
    let output = "<"
    const last = copy.pop() as number[];
    for (const row of copy) {
        output += vectorToString(row) + "\n "
    }
    return output + vectorToString(last) + ">"
}

function blankScreen() {
    let output = []
    for (let y = 0; y < 20; y += 1) {
        let row = []
        for (let x = 0; x < 30; x += 1) {
            row[x] = "&nbsp&nbsp&nbsp"
        }
        output[y] = row
    }
    return output
}

function renderScreen(pixels: any[]) {
    let output = ""
    pixels.forEach((row: any[]) => {
        row.forEach((pixel: string) => {
            output += pixel
        })
        output += "\n"
    });
    return output
}

// GEOMETRY

function pointAverage(points: number[][]) {
    let temp = points.slice()
    function recurse(rest: any[]): number[] {
        if (rest.length > 1) {
            return addVectors(rest.pop(), recurse(rest))
        } else {
            return rest[0]
        }
    }
    let n = temp.length
    return scaleVector(addVectors(temp.pop() as number[], recurse(temp)), 1/n)
}

// Represents a geometric face in 3D Cartesian space
class Face {
    color: string;
    points: number[][];
    center: number[];
    // constructor taking in the color of the face and its 3D points
    constructor(color: string, points: number[][]) {
        this.color = color
        this.points = points.slice() as number[][];
        this.center = pointAverage(points)
    }

    // Returns a translated copy of this face
    translate(delta: any) {
        return new Face(this.color, this.points.map((point: any) => addVectors(point, delta)))
    }

    transformPoints(matrix: any) {
        return new Face(this.color, this.points.map((point: any) => multiplyMatrixVector(matrix, point)))
    }

    // Returns an array of the face points mapped onto the screen in the form [x, y]
    screenPoints(cameraPosition: any, cameraBasis: any) {
        let converted = []
        for (let point of this.points) {
            converted.push(screenPosition(point, cameraPosition, cameraBasis))
        }
        return converted
    }

    // Returns an SVG polygon HTML element as the face should be rendered 
    htmlScreenPolygon(cameraPosition: any, cameraBasis: any) {
        let points = ""
        for (let point of this.screenPoints(cameraPosition, cameraBasis)) {
            points += point[0] + "," + point[1] + " "

            /*if (point[0] < 0 || point[0] >= SCREENWIDTH ||
                point[1] < 0 || point[1] >= SCREENHEIGHT) {
                points = ""
                break;
            }*/
        }

        let polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
        polygon.setAttribute("points", points)
        polygon.setAttribute("style", "fill:" + this.color +";stroke:black;stroke-width:1;fill-rule:evenodd;")

        return polygon
    }
}

// Represents a 3D geometry
class Geometry {
    position: number[];
    faces: Face[];
    rotation: number[][];
    constructor(position: number[], faces: Face[]) {
        this.position = position
        this.faces = faces
        this.rotation = [[1, 0, 0], [0, 1, 0], [0, 0, 1]]
    }

    getFaces() {
        return this.faces.map((face: Face) => face.transformPoints(this.rotation).translate(this.position))
    }

    rotate(x: number, y: number, z: number) {
        let transforms = [x, y, z]
        let matrixGenerators = [rotationMatrixX, rotationMatrixY, rotationMatrixZ]
        for (let i = 0; i < 3; i += 1) {
            if (transforms[i] == 0) {
                continue
            } else {
                this.rotation = multiplyMatrices(this.rotation, matrixGenerators[i](toRadians(transforms[i])))
                needsUpdate = true
            }
        }
    }
}

class Cube extends Geometry {
    constructor(position: number[], color: string, scale: number) {
        let w = scale / 2
        let corners = [[-w, -w, -w], [-w, -w, w], [-w, w, w], [-w, w, -w],
                 [w, -w, -w], [w, -w, w], [w, w, w], [w, w, -w]]
        let facesPoints = [[0, 1, 2, 3], [0, 1, 5, 4], [0, 4, 7, 3], 
                           [2, 6, 7, 3], [1, 5, 6, 2], [4, 5, 6, 7]]
        super(position, facesPoints.map(indices => new Face(color, indices.map(i => corners[i]))))
    }
}

function useForceUpdate(){
  const [value, setValue] = useState(0); // integer state
  return () => setValue(value => value + 1); // update state to force render
  // An function that increment 👆🏻 the previous state like here 
  // is better than directly setting `value + 1`
}

let pointMap = new Map()
let needsUpdate = true
let cameraVector = [1, 0, 0]
let cameraPosition = [0, 0, 0]
const geometries = [new Geometry([400, 120, 0], [new Face("red", [[10, -30, -20], [50, 70, -50], [80, 100, 150]])]),
    new Cube([600, 0, 0], "green", 100), new Cube([500, -50, 100], "purple", 69), new Cube([80, -30, -20], "blue", 30)]
const display = document.getElementById("display") as HTMLElement;
export default function Viewport3D() {
  const update = useForceUpdate();
  const display = useRef<any>(null);

  useEffect(() => {
    if (display && needsUpdate) {
      //console.log("UPDATED")
      pointMap.clear();
      display.current.innerHTML = '';
      let cameraBasis = invertMatrix(transpose([screenXVector(cameraVector), screenYVector(cameraVector), cameraVector]))
      let faces: any[] = []
      // Collect the faces of all geometries (recorded in global coordinates)
      for (const group of geometries.map(g => g.getFaces())) {
      faces = faces.concat(group)
      }
      for (let face of sortFaces(faces, cameraPosition)) {
          let polygon = face.htmlScreenPolygon(cameraPosition, cameraBasis)
          display.current.appendChild(polygon)
      }
      // Crosshair
      display.current.appendChild(htmlBar([SCREENWIDTH / 2, SCREENHEIGHT / 2], 20))
      display.current.appendChild(htmlPole([SCREENWIDTH / 2, SCREENHEIGHT / 2], 20))

      // Angular indicators
      display.current.appendChild(htmlBar([SCREENWIDTH / 2, pitch * SCREENHEIGHT / 180 + SCREENHEIGHT / 2], 10))
      let yawIndicatorPos = (Math.abs(yaw) % 360 < 180 ? 0 : Math.sign(yaw) * 360) - yaw % 360
      display.current.appendChild(htmlPole([yawIndicatorPos * SCREENWIDTH / 360 + SCREENWIDTH / 2, SCREENHEIGHT / 2], 10))
      needsUpdate = false
    }

    geometries[1].rotate(0, 0, 1)
    geometries[0].rotate(.1, .2, 0)
    geometries[2].rotate(.05, 0, .1)
    geometries[3].rotate(0, 0, -.025)
    let newCam = handleCameraMovement(cameraPosition, cameraVector)
    cameraPosition = newCam[0]
    cameraVector = newCam[1]
    
    setTimeout(update, 10);
  }, [update]);
  
  return (
    <svg id="display" width="600" height="400" ref={display}></svg>
  );
}