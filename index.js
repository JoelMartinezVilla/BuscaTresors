const readline = require('readline').promises;
const fs = require('fs');

const TOTAL_TREASURES = 16;
const MAX_TURNS = 32;

function generateMatrix() {
    let matrix = [];
    for (let i = 0; i < 6; i++) {
        let line = [];
        for (let j = 0; j < 8; j++) {
            line.push("");
        }
        matrix.push(line);
    }
    return matrix;
}

function placeTreasures(matrix) {
    let treasures = 0;
    while (treasures < TOTAL_TREASURES) {
        let row = Math.floor(Math.random() * 6);
        let col = Math.floor(Math.random() * 8);
        if (matrix[row][col] !== "T") {
            matrix[row][col] = "T";
            treasures++;
        }
    }
    return matrix;
}

function showMatrix(matrix, showTreasures = false) {
    const letters = ["A", "B", "C", "D", "E", "F"];
    console.log(" 01234567");
    for (let i = 0; i < matrix.length; i++) {
        let line = letters[i];
        for (let j = 0; j < matrix[i].length; j++) {
            if (matrix[i][j] === "T" && !showTreasures) {
                line += "·";
            } else {
                line += matrix[i][j] === "" ? "·" : matrix[i][j];
            }
        }
        console.log(line);
    }
}

function calculateDistance(matrix, row, col) {
    let minDistance = Infinity;
    for (let i = 0; i < matrix.length; i++) {
        for (let j = 0; j < matrix[i].length; j++) {
            if (matrix[i][j] === "T") {
                let distance = Math.abs(i - row) + Math.abs(j - col);
                minDistance = Math.min(minDistance, distance);
            }
        }
    }
    return minDistance;
}

function showHelp() {
    console.log("Comandes disponibles:\n" +
        "ajuda: Mostra la llista de comandes.\n" +
        "carregar partida 'nom_arxiu.json': Carrega una partida guardada.\n" +
        "guardar partida 'nom_guardar.json': Guarda la partida actual.\n" +
        "activar/desactivar trampa: Mostra o amaga les caselles destapades.\n" +
        "destapar x,y: Destapa una casella (ex: B3).\n" +
        "puntuació: Mostra la puntuació actual i les tirades restants.");
}

async function saveGame(filename, gameState) {
    try {
        fs.writeFileSync(filename, JSON.stringify(gameState));
        console.log("Partida guardada amb èxit a", filename);
    } catch (error) {
        console.error("Error al guardar la partida:", error);
    }
}

async function loadGame(filename) {
    try {
        const data = fs.readFileSync(filename);
        console.log("Partida carregada amb èxit de", filename);
        return JSON.parse(data);
    } catch (error) {
        console.error("Error al carregar la partida:", error);
        return null;
    }
}

async function play() {
    let matrix = generateMatrix();
    matrix = placeTreasures(matrix);

    let treasuresFound = 0;
    let turnsLeft = MAX_TURNS;
    let cheatMode = false;

    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    while (true) {
        showMatrix(matrix, cheatMode);
        let command = await rl.question("Escriu una comanda: ");

        if (command.startsWith("ajuda")) {
            showHelp();
        } else if (command.startsWith("carregar partida")) {
            let filename = command.split(' ')[2];
            let loadedGame = await loadGame(filename);
            if (loadedGame) {
                matrix = loadedGame.matrix;
                treasuresFound = loadedGame.treasuresFound;
                turnsLeft = loadedGame.turnsLeft;
                cheatMode = loadedGame.cheatMode;
            }
        } else if (command.startsWith("guardar partida")) {
            let filename = command.split(' ')[2];
            await saveGame(filename, { matrix, treasuresFound, turnsLeft, cheatMode });
        } else if (command === "activar trampa") {
            cheatMode = true;
            console.log("Mode trampa activat.");
        } else if (command === "desactivar trampa") {
            cheatMode = false;
            console.log("Mode trampa desactivat.");
        } else if (command.startsWith("destapar")) {
            let [_, coord] = command.split(' ');
            let row = coord.charCodeAt(0) >= 97 ? coord.charCodeAt(0) - 97 : coord.charCodeAt(0) - 65;
            let col = parseInt(coord[1]);

            if (matrix[row][col] === "T") {
                console.log("Tresor trobat!");
                matrix[row][col] = "X";
                treasuresFound++;
            } else {
                let distance = calculateDistance(matrix, row, col);
                matrix[row][col] = distance.toString();
                turnsLeft--;
            }
        } else if (command === "puntuació") {
            console.log(`Puntuació: ${treasuresFound}/${TOTAL_TREASURES}, Tirades restants: ${turnsLeft}`);
        } else {
            console.log("Comanda no reconeguda. Escriu 'ajuda' per veure les comandes disponibles.");
        }

        if (treasuresFound === TOTAL_TREASURES) {
            console.log(`Has guanyat amb només ${MAX_TURNS - turnsLeft} tirades!`);
            break;
        } else if (turnsLeft === 0) {
            console.log(`Has perdut, queden ${TOTAL_TREASURES - treasuresFound} tresors.`);
            break;
        }
    }

    rl.close();
}

play();
