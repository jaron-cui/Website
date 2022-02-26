
// states of displayed cells
const unknown = "unknown";
const correct = "correct";
const incorrect = "incorrect";

const colorMap = {unknown: "white", correct: "green", incorrect: "red"};

const size = 10;
const scale = 20;
const margin = scale * Math.ceil(size / 2) + scale;
const displayGrid = Array(size).fill(Array(size).fill(unknown));
const answerGrid = generateGrid();

function generateGrid() {
    var grid = [];
    for (var x = 0; x < size; x += 1) {
        var row = [];
        for (var y = 0; y < size; y += 1) {
            row.push(Math.random() < 0.5);
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

function initDisplay() {
    const display = document.getElementById("display");
    display.innerHTML = "";

    for (var x = 0; x < size; x += 1) {
        const counts = consecutives(getColumn(x));
        for (var i = 0; i < counts.length; i += 1) {
            const xo = scale * x + margin;
            const yo = margin - scale * (i + .5);
            display.appendChild(buildText(xo, yo, counts[counts.length - i - 1]))
        }
    }

    for (var y = 0; y < size; y += 1) {
        const xo = margin - scale / 2;
        const yo = scale * y + margin + scale;
        const text = buildText(xo, yo, consecutives(getRow(y)).join("\u00A0\u00A0"));
        text.setAttribute("text-anchor", "end");
        display.appendChild(text);
    }

    for (var x = 0; x < size; x += 1) {
        for (var y = 0; y < size; y += 1) {
            display.appendChild(buildSquare(x, y));
        }
    }
}

function buildText(x, y, string) {
    var text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", x);
    text.setAttribute("y", y);
    text.appendChild(document.createTextNode(string));
    return text;
}

function buildSquare(x, y) {
    const square = document.createElementNS("http://www.w3.org/2000/svg", "rect");
    square.setAttribute('x', scale * x + margin);
    square.setAttribute('y', scale * y + margin);
    square.setAttribute('width', scale);
    square.setAttribute('height', scale);
    square.setAttribute("fill", colorMap[displayGrid[y][x]]);
    square.setAttribute("stroke", "black")

    square.onclick = () => {
        guess(x, y);
        square.setAttribute("fill", colorMap[displayGrid[y][x]]);
    }

    return square;
}

function guess(x, y) {
    displayGrid[y][x] = answerGrid[y][x] ? correct : incorrect;
}

generateGrid();
initDisplay();