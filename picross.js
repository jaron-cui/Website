
// states of displayed cells
const unknown = "unknown";
const correct = "correct";
const incorrect = "incorrect";

const colorMap = {unknown: "#8888bb", correct: "#bae2a7", incorrect: "#7d48a2"};

const size = 8;
const scale = 20;
const margin = 2 * scale * Math.sqrt(size) + scale;

// displayed grid and answer grid
const displayGrid = Array(size).fill(Array(size).fill(unknown));
const answerGrid = generateGrid();
var numFilled;
var numCorrect;

// generate the answer key to the grid
function generateGrid() {
    var grid = [];
    numFilled = 0;
    numCorrect = 0;
    for (var x = 0; x < size; x += 1) {
        var row = [];
        for (var y = 0; y < size; y += 1) {
            const state = Math.random() < 0.6;
            row.push(state);
            if (state) {
                numFilled += 1;
            }
        }
        grid.push(row);
    }
    
    return grid;
}

function getColumn(x) {
    const column = [];
    for (var y = 0; y < size; y += 1) {
        column.push(answerGrid[y][x]);
    }

    return column;
}

function getRow(y) {
    return [...answerGrid[y]];
}

// given a column or row, returns a list of the lengths of all consecutive blocks
function consecutives(sequence) {
    const summary = [];
    var consecutive = 0;
    for (var i = 0; i < sequence.length; i += 1) {
        if (sequence[i]) {
            consecutive += 1;
        } else {
            if (consecutive > 0) {
                summary.push(consecutive);
                consecutive = 0;
            }
        }
    }

    if (consecutive > 0) {
        summary.push(consecutive);
    }

    return summary;
}

// initialize the display on the frontend
function initDisplay() {
    // get display element
    const display = document.getElementById("display");
    display.innerHTML = "";

    // display counts for columns
    for (var x = 0; x < size; x += 1) {
        const counts = consecutives(getColumn(x));
        for (var i = 0; i < counts.length; i += 1) {
            const xo = scale * x + margin;
            const yo = margin - scale * (i + .5);
            display.appendChild(buildText(xo, yo, counts[counts.length - i - 1]))
        }
    }

    // display counts for rows
    for (var y = 0; y < size; y += 1) {
        const xo = margin - scale / 2;
        const yo = scale * y + margin + scale;
        const text = buildText(xo, yo, consecutives(getRow(y)).join("\u00A0\u00A0"));
        text.setAttribute("text-anchor", "end");
        display.appendChild(text);
    }

    // place squares on display
    for (var x = 0; x < size; x += 1) {
        for (var y = 0; y < size; y += 1) {
            display.appendChild(buildSquare(x, y));
        }
    }
}

// build a text svg element
function buildText(x, y, string) {
    var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", x);
    text.setAttribute("y", y);
    text.setAttribute("font-size", scale);
    text.appendChild(document.createTextNode(string));
    return text;
}

// build a square svg element
function buildSquare(x, y) {
    const square = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    square.setAttribute('x', scale * x + margin);
    square.setAttribute('y', scale * y + margin);
    square.setAttribute('width', scale);
    square.setAttribute('height', scale);
    square.setAttribute("fill", colorMap[displayGrid[y][x]]);
    square.setAttribute("stroke", "#f9d5fe")

    // square click detection
    square.onclick = () => {
        guess(x, y);
        square.setAttribute("fill", colorMap[displayGrid[y][x]]);
    }

    return square;
}

// make a guess and update the display accordingly
function guess(x, y) {
    // increment score
    if (displayGrid[y][x] == unknown && answerGrid[y][x]) {
        numCorrect += 1;

        // check for win
        if (numCorrect == numFilled) {
            alert("your did it");
        }
    }

    // update display color
    displayGrid[y][x] = answerGrid[y][x] ? correct : incorrect;
}

generateGrid();
initDisplay();