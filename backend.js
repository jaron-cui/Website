

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function loop() {
    var angle = 0
    var cameraVector = [1, 0, 0]
    var point = [2, 0, 0]
    
    for(n = 0; n < 1000; n += 1) {
        point[1] += 1
        await sleep(50)

        var cameraBasis = invertMatrix([screenXVector(cameraVector), screenYVector(cameraVector), cameraVector])
        console.log("Basis: " + cameraBasis)
        var screenPos = screenPosition(point, cameraBasis)
        console.log(screenPos)
        var screen = blankScreen()
        var x = Math.ceil(screenPos[0]) + 14
        var y = Math.ceil(screenPos[1]) + 9
        console.log("Screenpos: " + x + " " + y)
        screen[y][x] = "&#9608"
        document.getElementById("display").innerHTML = renderScreen(screen)
    }
    /*var screen = blankScreen()
    screen[9][9] = "&#9608"//9617, 9618, 9619
    document.getElementById("display").innerHTML = renderScreen(screen)*/
}

function screenPosition(point, cameraBasis) {
    var converted = multiplyMatrixVector(cameraBasis, point)
    console.log("Matrix: " + converted)
    var distanceScale = converted[2]*.1
    return [distanceScale*converted[0], distanceScale*converted[1]]
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
    return unitVector([-x*z, -y*z, (x*x + y*y)])
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
    var rows = [[0, matrix[0]], [1, matrix[1]], [2, matrix[2]]]
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
    for(y = 0; y < 20; y += 1) {
        var row = []
        for(x = 0; x < 30; x += 1) {
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

loop()