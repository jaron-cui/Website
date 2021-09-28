

SCREENWIDTH = 600
SCREENHEIGHT = 400
MOVESPEED = 1
PANSPEED = 1

var keys = new Set()

document.addEventListener("keydown", key => keys.add(key["key"]))
document.addEventListener("keyup", key => keys.delete(key["key"]))

var cameraActions = new Map()
var pitch = 0
var yaw = 0

cameraActions.set("w", (pos, vec) => [addVectors(pos, vec), vec])
cameraActions.set("a", (pos, vec) => [addVectors(pos, scaleVector(screenXVector(vec), -1)), vec])
cameraActions.set("s", (pos, vec) => [addVectors(pos, scaleVector(vec, -1)), vec])
cameraActions.set("d", (pos, vec) => [addVectors(pos, screenXVector(vec)), vec])
cameraActions.set("ArrowUp", (pos, vec) => {
    pitch += PANSPEED
    return [pos, recalculateCameraVector()]
})
cameraActions.set("ArrowDown", (pos, vec) => {
    pitch -= PANSPEED
    return [pos, recalculateCameraVector()]
})
cameraActions.set("ArrowLeft", (pos, vec) => {
    yaw -= PANSPEED
    return [pos, recalculateCameraVector()]
})
cameraActions.set("ArrowRight", (pos, vec) => {
    yaw += PANSPEED
    return [pos, recalculateCameraVector()]
})

function toRadians(degrees) {
    return degrees / 180 * Math.PI
}

function recalculateCameraVector() {
    var radPitch = toRadians(pitch)
    var radYaw = toRadians(yaw)
    var horizontalComponent = Math.abs(Math.cos(radPitch))

    var xComponent = horizontalComponent*Math.cos(radYaw)
    var yComponent = horizontalComponent*Math.sin(radYaw)
    var zComponent = Math.sin(radPitch)

    return [xComponent, yComponent, zComponent]
}

function handleCameraMovement(cameraPosition, cameraVector) {
    var acc = [cameraPosition.slice(), cameraVector.slice()]
    for (var key of keys) {
        if (cameraActions.has(key)) {
            acc = cameraActions.get(key)(acc[0], acc[1])
        } else {
            console.log(key)
        }
    }
    return acc
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function loop() {
    var angle = 0
    var cameraVector = [1, 0, 0]
    var cameraPosition = [0, 0, 0]
    var geometries = //[new Geometry([0, 0, 0], [new Face("red", [[100, -300, -200], [100, 200, -100], [80, 200, 150]])]),
        [new Cube([600, 100, 100], "green", 100)]
    var display = document.getElementById("display")
    
    while (!keys.has("Escape")) {
        //console.log("CUBE: " + geometries[1].getFaces()[0].points)
        var cameraBasis = invertMatrix([screenXVector(cameraVector), screenYVector(cameraVector), cameraVector])
        display.innerHTML = ""
        var faces = []
        // Collect the faces of all geometries (recorded in global coordinates)
        for (group of geometries.map(g => g.getFaces())) {
            faces = faces.concat(group)
        }
        for (var face of sortFaces(faces, cameraPosition)) {
            var polygon = face.htmlScreenPolygon(cameraPosition, cameraBasis)
            display.appendChild(polygon)
        }

        var newCam = handleCameraMovement(cameraPosition, cameraVector)
        cameraPosition = newCam[0]
        cameraVector = newCam[1]
        await sleep(10)
    }
    /*var screen = blankScreen()
    screen[9][9] = "&#9608"//9617, 9618, 9619
    document.getElementById("display").innerHTML = renderScreen(screen)*/
}

function sortFaces(faces, cameraPosition) {
    var tagged = []
    for (var face of faces) {
        tagged.push([distance(cameraPosition, face.center), face])
    }

    return mergeSort(tagged).map(x => x[1])

    function merge(facesA, facesB) {
        var merged = []
        var current = [facesA, 0]
        var other = [facesB, 0]
        while (current[1] < current[0].length && other[1] < other[0].length) {
            var currentFace = current[0][current[1]]
            var otherFace = other[0][other[1]]
            if (currentFace[0] <= otherFace[0]) {
                var temp = current
                current = other
                other = temp
            }
            merged.push(current[0][current[1]])
            current[1] += 1
        }
        for (var taggedFace of other[1] == other[0].length ? current[0] : other[0]) {
            merged.push(taggedFace)
        }
        return merged
    }

    function mergeSort(taggedFaces) {
        if (taggedFaces.length <= 1) {
            return taggedFaces
        }
        var split = Math.floor(taggedFaces.length / 2)
        var firstHalf = mergeSort(taggedFaces.slice(0, split))
        var secondHalf = mergeSort(taggedFaces.slice(split, taggedFaces.length))
        return merge(firstHalf, secondHalf)
    }
}

function distance(a, b) {
    var delta = addVectors(a, scaleVector(b, -1))
    var total = 0
    for (var component of delta) {
        total += component*component
    }
    return Math.sqrt(total)
}

function screenPosition(point, cameraPosition, cameraBasis) {
    var point = addVectors(point, scaleVector(cameraPosition, -1))
    var converted = multiplyMatrixVector(cameraBasis, point)
    if (converted[2] < 0) {
        return [-10000, -10000]
    }
    var distanceScale = 600/converted[2]
    var x = converted[0]
    var y = converted[1]
    //console.log("distscale: " + distanceScale*x)
    return [distanceScale*x + SCREENWIDTH/2, SCREENHEIGHT/2 - distanceScale*y]
}

function multiplyMatrixVector(matrix, vector) {
    var output = []
    for (y = 0; y < 3; y += 1) {
        var element = 0
        for (x = 0; x < 3; x += 1) {
            element += vector[x]*matrix[y][x]
        }
        output[y] = element
    }
    return output
}

function screenXVector(vector) {
    var x = vector[0]
    var y = vector[1]
    return [-y, x, 0]
}

function screenYVector(vector) {
    var x = vector[0]
    var y = vector[1]
    var z = vector[2]
    var direction = unitVector([-x*z, -y*z, (x*x + y*y)])
    return direction[2] < 0 ? scaleVector(direction, -1) : direction
}

function addVectors(vector1, vector2) {
    return [vector1[0] + vector2[0], vector1[1] + vector2[1], vector1[2] + vector2[2]]
}

function unitVector(vector) {
    return scaleVector(vector, 1/vectorLength(vector))
}

function vectorLength(vector) {
    var x = vector[0]
    var y = vector[1]
    var z = vector[2]
    return Math.sqrt(x*x + y*y + z*z)
}

function scaleVector(vector, factor) {
    var x = vector[0]
    var y = vector[1]
    var z = vector[2]
    return [factor*x, factor*y, factor*z]
}

function invertMatrix(matrix) {
    var row1, row2, row3
    
    // Orders the rows so that the first element of the first row is nonzero,
    // the second element of the second row is nonzero, and the third of
    // the third row is nonzero.
    var rows = [[0, matrix[0].slice()], [1, matrix[1].slice()], [2, matrix[2].slice()]]
    var ordering = []

    for (i = 0; i < 3; i += 1) {
        if (rows[i][1][0] != 0) {
            ordering[0] = rows[i][0]
            row1 = rows[i][1]
            rows.splice(i, 1)
            break
        }
    }
    row2 = rows[1][1][1] != 0 ? rows.pop() : rows.shift()
    ordering[1] = row2[0]
    row2 = row2[1]

    ordering[2] = rows[0][0]
    row3 = rows.pop()[1]

    // If this cannot be done, the matrix has no inverse.
    if (rows.length != 0) {
        return null
    }

    var scale
    var inv1 = [1, 0, 0]
    var inv2 = [0, 1, 0]
    var inv3 = [0, 0, 1]

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

    var output = []
    output[ordering[0]] = inv1
    output[ordering[1]] = inv2
    output[ordering[2]] = inv3
    return output
}

function vectorToString(vector) {
    var x = vector[0]
    var y = vector[1]
    var z = vector[2]
    return "<" + x + ", " + y + ", " + z + ">"
}

function blankScreen() {
    var output = []
    for (y = 0; y < 20; y += 1) {
        var row = []
        for (x = 0; x < 30; x += 1) {
            row[x] = "&nbsp&nbsp&nbsp"
        }
        output[y] = row
    }
    return output
}

function renderScreen(pixels) {
    var output = ""
    pixels.forEach(row => {
        row.forEach(pixel => {
            output += pixel
        })
        output += "\n"
    });
    return output
}

// GEOMETRY

function pointAverage(points) {
    var temp = points.slice()
    function recurse(rest) {
        if (rest.length > 1) {
            return addVectors(rest.pop(), recurse(rest))
        } else {
            return rest[0]
        }
    }
    var n = temp.length
    return scaleVector(addVectors(temp.pop(), recurse(temp)), 1/n)
}

// Represents a geometric face in 3D Cartesian space
class Face {
    // constructor taking in the color of the face and its 3D points
    constructor(color, points) {
        this.color = color
        this.points = points.slice()
        this.center = pointAverage(points)
    }

    // Returns a translated copy of this face
    translate(delta) {
        return new Face(this.color, this.points.map(point => addVectors(point, delta)))
    }

    // Returns an array of the face points mapped onto the screen in the form [x, y]
    screenPoints(cameraPosition, cameraBasis) {
        var converted = []
        for (var point of this.points) {
            converted.push(screenPosition(point, cameraPosition, cameraBasis))
        }
        return converted
    }

    // Returns an SVG polygon HTML element as the face should be rendered 
    htmlScreenPolygon(cameraPosition, cameraBasis) {
        var points = ""
        for (var point of this.screenPoints(cameraPosition, cameraBasis)) {
            points += point[0] + "," + point[1] + " "

            /*if (point[0] < 0 || point[0] >= SCREENWIDTH ||
                point[1] < 0 || point[1] >= SCREENHEIGHT) {
                points = ""
                break;
            }*/
        }

        var polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
        polygon.setAttribute("points", points)
        polygon.setAttribute("style", "fill:" + this.color +";stroke:black;stroke-width:1;fill-rule:evenodd;")

        return polygon
    }
}

// Represents a 3D geometry
class Geometry {
    constructor(position, faces) {
        this.position = position
        this.faces = faces
    }

    getFaces() {
        return this.faces.map(face => face.translate(this.position))
    }
}

class Cube extends Geometry {
    constructor(position, color, scale) {
        var w = scale / 2
        var corners = [[-w, -w, -w], [-w, -w, w], [-w, w, w], [-w, w, -w],
                 [w, -w, -w], [w, -w, w], [w, w, w], [w, w, -w]]
        var facesPoints = [[0, 1, 2, 3], [0, 1, 5, 4], [0, 4, 7, 3], 
                           [2, 6, 7, 3], [1, 5, 6, 2], [4, 5, 6, 7]]
        super(position, facesPoints.map(indices => new Face(color, indices.map(i => corners[i]))))
    }
}

loop()