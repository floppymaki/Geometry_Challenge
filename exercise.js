const urlParams = new URLSearchParams(window.location.search);
const exerciseID = urlParams.get('id');
const option = urlParams.get('option');

if(option != 0 && option != 1 && option != 2 && option != 3) {
    window.location.href = `../exercise.html?id=${exerciseID}&option=0`;
}

var currentExercise = 0;
var exerciseCoords = [];
var answerCoords = [];
var playerCoords = [];
var moves = [];

var secondsPassed = 0;
var minutesPassed = 0;
let seconds;
let minutes;

var playerQuadrant;

const drawingLayer = new Konva.Layer();
const shapeLayer = new Konva.Layer();
const background = new Konva.Layer();

const stageWidth = 640;
const stageHeight = 640;

const stage = new Konva.Stage({
    container: 'konva-field',
    width: stageWidth,
    height: stageHeight
});
var exerciseQuadrant;

// document.addEventListener("DOMContentLoaded", function () {
    createOptionButtons();
    const titleField = document.getElementById('title');
    const timer = setInterval(startTimer, 1000);

    createStage();

    fetchExerciseByID(exerciseID)
    .then(exerciseData => {
        const data = exerciseData[0];

        titleField.textContent = `Geometry Challenge | ${data['title']}`;

        setCoords(data['coords']);

        for(let i = 0; i < exerciseCoords.length; i++) {
            moves[i] = {'correct': 0, 'wrong': 0};
            createButton(i);
            playerCoords[i] = [];
            answerCoords[i] = getAnswerCoords(exerciseCoords[i]);
        }

        let firstBtn = document.getElementById('exerciseBtns').children[0];
        goToExercise(firstBtn);

        // determine shape quadrant
        // for(let i = 0; i < coords[0].length; i++) {
        //     validQuadrants = validQuadrant(coords[0][i]);
        // }
    })
    .catch(error => {
        console.log(error);
    });
// });

    // Fill coords array with fetched data.
function setCoords(fetchedCoords) {
    for(let i = 0; i < fetchedCoords.length; i++) {
        exerciseCoords[i] = [];
        for(let j = 0; j < fetchedCoords[i].length; j++) {
            exerciseCoords[i].push(fetchedCoords[i][j]);
        }
    }
}

function goToExercise(btn) {
    currentExercise = btn.textContent - 1;
    exerciseQuadrant = [1, 2, 3, 4];

        // Determine which quadrant the original shape is drawn in
    for(let i = 0; i < exerciseCoords[currentExercise].length; i++) {
        exerciseQuadrant = getExerciseQuadrant(exerciseCoords[currentExercise][i]);
    }

        // Determine which quadrant the player may draw in
    playerQuadrant = getPlayerQuadrant();

    
    if(option != 0) {
        greyOutStage();
    }


        // Change the color of the previous exercise button
    if(btn.parentNode.querySelector('.btn-primary')) {
        btn.parentNode.querySelector('.btn-primary').classList.remove('btn-primary');
    }

    btn.classList.remove('btn-light');
    btn.classList.add('btn-primary');


    shapeLayer.destroyChildren();
    drawingLayer.destroyChildren();

    if(exerciseCoords[currentExercise]) {
        for(let i = 0; i < exerciseCoords[currentExercise].length; i++){
            drawCircle(exerciseCoords[currentExercise][i], true);
        }
    }

    if(playerCoords[currentExercise]) {
        for(let i = 0; i < playerCoords[currentExercise].length; i++) {
            drawCircle(playerCoords[currentExercise][i], false);
        }
    }

    drawShape(exerciseCoords[currentExercise], true);


    if(moves[currentExercise]['correct'] == 1) {
        for(let i = 0; i < answerCoords[currentExercise].length; i++) {
            drawShape(answerCoords[currentExercise][i], false);
        }
        playerQuadrant = [];
    }
}

    // Calculate mirror coordinates
function getAnswerCoords(coords) {
    let mirrorCoords = []

    if(option == 1) {
        mirrorCoords[0] = coords.map(xy => ({'x': stageWidth - xy['x'], 'y': xy['y']}));
    } else if(option == 2) {
        mirrorCoords[0] = coords.map(xy => ({'x': xy['x'], 'y': stageHeight - xy['y']}));
    } else if(option == 3) {
        mirrorCoords[0] = coords.map(xy => ({'x': stageWidth - xy['x'], 'y': stageHeight - xy['y']}));
    } else {
        mirrorCoords[0] = coords.map(xy => ({'x': stageWidth - xy['x'], 'y': xy['y']}));
        mirrorCoords[1] = coords.map(xy => ({'x': xy['x'], 'y': stageHeight - xy['y']}));
        mirrorCoords[2] = coords.map(xy => ({'x': stageWidth - xy['x'], 'y': stageHeight - xy['y']}));
    }

    return mirrorCoords;
}

    // Calculate new x and y values so circle can snap to the grid when drawn
function getGridPos(coords) {
    let x = Math.round((coords["x"] - 20) / 30) * 30 + 20;
    let y = Math.round((coords["y"] - 20) / 30) * 30 + 20;

    let gridPos = {"x": x, "y": y};

    return gridPos;
}

    // Add x and y positions to playerCoords and draw a circle if isValid returns true
function addCircle() {
    let pos = stage.getPointerPosition();
    let gridPos = getGridPos(pos);

    if(isValid(gridPos)) {
        new Audio('sounds/zapsplat_multimedia_gameshow_correct_answer_ping_ring_chime_001_92774.mp3').play()
        drawCircle(gridPos, false)

        playerCoords[currentExercise].push(gridPos);

        if(option == 0) {
            if(playerCoords[currentExercise].length === answerCoords[currentExercise][0].length * 3) {
                completeThisExercise();
            }
        } else {
            if(playerCoords[currentExercise].length === answerCoords[currentExercise][0].length) {
                completeThisExercise();
            }
        }

    }
}

    // Draw the mirrored shape, update moves array, disable clicking in this exercise, update exercise btn color
function completeThisExercise() {
    for(let i = 0; i < answerCoords[currentExercise].length; i++) {
        drawShape(answerCoords[currentExercise][i], false);
    }


    moves[currentExercise]['correct'] = 1;

    let correctCount = moves.map(move => move['correct']).reduce((a, b) => {return a+b});

    document.getElementById('correct-count').textContent = correctCount;

    playerQuadrant = [];

    let btn = document.getElementById('exerciseBtns').children[currentExercise];
    btn.className = moves[currentExercise]['wrong'] !== 1 ? 'btn btn-success' : 'btn btn-warning text-white';

    if(correctCount === exerciseCoords.length) {
        // alert('Good job! 🥳🥳🥳');
        clearInterval(timer);
        new Audio('sounds/zapsplat_multimedia_game_sound_win_correct_positive_chime_78398.mp3').play();
    }
}

function isValid(pos) {
    if(playerQuadrant.length === 0) {
        return false;
    }

        // Return false if a circle has already been placed in this position.
    if(playerCoords[currentExercise].some(coord => coord.x === pos.x && coord.y === pos.y)){
        return false
    } 

        // Return false if user clicked out of bounds.
    if(pos["x"] < 20 || pos["x"] > 620 || pos["y"] < 20 || pos["y"] > 620) {
        return false
    }

    if(playerQuadrant.length == 1) {
        if(playerQuadrant[0] == 1 && (pos['x'] > stageWidth / 2 || pos['y'] > stageHeight / 2)) return false;
        if(playerQuadrant[0] == 2 && (pos['x'] < stageWidth / 2 || pos['y'] > stageHeight / 2)) return false;
        if(playerQuadrant[0] == 3 && (pos['x'] > stageWidth / 2 || pos['y'] < stageHeight / 2)) return false;
        if(playerQuadrant[0] == 4 && (pos['x'] < stageWidth / 2 || pos['y'] < stageHeight / 2)) return false;
    } else {
        if(!playerQuadrant.includes(1) && (pos['x'] < stageWidth / 2 && pos['y'] < stageHeight / 2)) return false;
        if(!playerQuadrant.includes(2) && (pos['x'] > stageWidth / 2 && pos['y'] < stageHeight / 2)) return false;
        if(!playerQuadrant.includes(3) && (pos['x'] < stageWidth / 2 && pos['y'] > stageHeight / 2)) return false;
        if(!playerQuadrant.includes(4) && (pos['x'] > stageWidth / 2 && pos['y'] > stageHeight / 2)) return false;
    }
    
        // Return false if player made a wrong move
    if(playerQuadrant.length == 1) {
        if(!answerCoords[currentExercise][0].some(coord => coord.x === pos.x && coord.y === pos.y)){
            drawBadCircle(pos);
            return false
        } 
    } else {
        for(let i = 0; i < answerCoords[currentExercise].length; i++) {
            if(answerCoords[currentExercise][i].some(coord => coord.x === pos.x && coord.y === pos.y)){
                return true
            } 
        }

        drawBadCircle(pos);
        return false;
    }

    return true;
}

function drawBadCircle(pos) {
    moves[currentExercise]['wrong'] = 1;

    let wrongCount = moves.map(move => move['wrong']).reduce((a, b) => {return a+b});
    document.getElementById('wrong-count').textContent = wrongCount;


    new Audio('sounds/zapsplat_multimedia_game_error_tone_006_24924.mp3').play()

    let circle = new Konva.Circle({
        x: pos['x'],
        y: pos['y'],
        radius: 10,
        fill: 'rgba(255, 107, 107, 1)',
    });
    drawingLayer.add(circle)   

    fadeOut(circle);
}

    // Fade out animation
function fadeOut(circle){
    let opacity = 1;
    let interval = setInterval(function() {
        if (opacity > 0) {
            opacity -= 0.1;
            circle.fill(`rgba(255, 107, 107, ${opacity})`);
        } else {
            clearInterval(interval); // Stop the interval when opacity reaches 0
            circle.destroy();
        }
    }, 50); 
}

    // Draw a circle
function drawCircle(pos, isOriginal) {
    let circle = new Konva.Circle({
        x: pos['x'],
        y: pos['y'],
        radius: 10,
        fill: isOriginal ? '#0079FF' : '#6BCB77',
    });

    drawingLayer.add(circle)
}

function drawShape(pointsArray, isOriginal) {
    let points = pointsArray.flatMap(obj => Object.values(obj));

    var shape = new Konva.Line({
        points: points,
        fill: isOriginal ? '#62a7f5' : '#b2d6b6',
        stroke: isOriginal ? '#0079FF' : '#6BCB77',
        strokeWidth: 1,
        closed: true,
      });

    shapeLayer.add(shape);
}


function createStage(){
    var layer = new Konva.Layer();

    var grid = new Konva.Rect({
        x: 20,
        y: 20,
        width: 600,
        height: 600,
        fill: 'white',
        stroke: 'lightgrey',
        strokeWidth: 2,
    });
    layer.add(grid);

    stage.add(layer);

    layer.draw();


        // HORIZONTAL GRID LINES
    for(var i = 0; i < stage.width() / 60; i++){
        if(i * 60 == grid.width() / 2){
            var color = 'grey';
        } else{
            var color = 'lightgrey';
        }

        var line = new Konva.Line({
            points: [20, i * 60 + 20, 620, i * 60 + 20],
            stroke: color
        });
        
        layer.add(line);
    }

        // VERTICAL GRID LINES
    for(var i = 0; i < stage.height() / 60; i++){
        if(i * 60 == grid.height() / 2){
            var color = 'grey';
        } else{
            var color = 'lightgrey';
        }

        var line = new Konva.Line({
            points: [i * 60 + 20, 20, i * 60 + 20, 620],
            stroke: color
        });
        
        layer.add(line);
    }

    
    stage.add(background);
    stage.add(shapeLayer);
    stage.add(drawingLayer);
}

function greyOutStage() {
    background.destroyChildren();

    let disabledQuadrants = [1, 2, 3, 4];
    let i;

    i = disabledQuadrants.indexOf(exerciseQuadrant[0]);
    disabledQuadrants.splice(i, 1);

    i = disabledQuadrants.indexOf(playerQuadrant[0]);
    disabledQuadrants.splice(i, 1);
    
    let squarePoints = [
        [20, 20, 320, 20, 320, 320, 20, 320],
        [320, 20, 620, 20, 620, 320, 320, 320],
        [20, 320, 320, 320, 320, 620, 20, 620],
        [320, 320, 620, 320, 620, 620, 320, 620]
    ]

    for(let i = 0; i < disabledQuadrants.length; i++) {

        var shape = new Konva.Line({
            points: squarePoints[disabledQuadrants[i] - 1],
            fill: 'lightgrey',
            stroke: 'grey',
            closed: true,
          });
    
        background.add(shape);
    }
}

    // Determine which quadrant the original shape is drawn in
function getExerciseQuadrant(pos) {
    let x = pos["x"];
    let y = pos["y"];

    let halfWidth = stageWidth / 2;
    let halfHeight = stageHeight / 2;

    if(exerciseQuadrant.length === 1) {
        return exerciseQuadrant;
    }

    if(x < halfWidth) {
        if (y < halfHeight && exerciseQuadrant.includes(1)) {
            exerciseQuadrant = [1];
        } else if (y > halfHeight && exerciseQuadrant.includes(3)) {
            exerciseQuadrant = [3];
        }
    }

    if(x > halfWidth) {
        if (y < halfHeight && exerciseQuadrant.includes(2)) {
            exerciseQuadrant = [2];
        } else if (y > halfHeight && exerciseQuadrant.includes(4)) {
            exerciseQuadrant = [4];
        }
    }


    if(exerciseQuadrant.length >= 2) {
        if(x === halfWidth) {
            if(y < halfHeight) {
                exerciseQuadrant = exerciseQuadrant.filter(number => number !== 4);
                exerciseQuadrant = exerciseQuadrant.filter(number => number !== 3);
            } else if (y > halfHeight) {
                exerciseQuadrant = exerciseQuadrant.filter(number => number !== 1);
                exerciseQuadrant = exerciseQuadrant.filter(number => number !== 2);
            }
        }
    
        if(y === halfHeight) {
            if(x < halfWidth) {
                exerciseQuadrant = exerciseQuadrant.filter(number => number !== 2);
                exerciseQuadrant = exerciseQuadrant.filter(number => number !== 4);
            } else if (x > halfWidth) {
                exerciseQuadrant = exerciseQuadrant.filter(number => number !== 1);
                exerciseQuadrant = exerciseQuadrant.filter(number => number !== 3);
            }
        }    
    }    

    return exerciseQuadrant;
}

function getPlayerQuadrant() {
    switch(option) {
        case '1': 
            if(exerciseQuadrant == 1) playerQuadrant = [2];
            if(exerciseQuadrant == 2) playerQuadrant = [1];
            if(exerciseQuadrant == 3) playerQuadrant = [4];
            if(exerciseQuadrant == 4) playerQuadrant = [3];
            break;
        case '2':
            if(exerciseQuadrant == 1) playerQuadrant = [3];
            if(exerciseQuadrant == 2) playerQuadrant = [4];
            if(exerciseQuadrant == 3) playerQuadrant = [1];
            if(exerciseQuadrant == 4) playerQuadrant = [2];
            break;
        case '3':
            if(exerciseQuadrant == 1) playerQuadrant = [4];
            if(exerciseQuadrant == 2) playerQuadrant = [3];
            if(exerciseQuadrant == 3) playerQuadrant = [2];
            if(exerciseQuadrant == 4) playerQuadrant = [1];
            break;
        default:
            if(exerciseQuadrant == 1) playerQuadrant = [2, 3, 4];
            if(exerciseQuadrant == 2) playerQuadrant = [1, 3, 4];
            if(exerciseQuadrant == 3) playerQuadrant = [1, 2, 4];
            if(exerciseQuadrant == 4) playerQuadrant = [1, 2, 3];

    }

    return playerQuadrant;
}

function startTimer() {
    let timer = document.getElementById('timer');
    
    secondsPassed += 1;

    if(secondsPassed % 60 == 0) {
        secondsPassed = 0;
        minutesPassed += 1;
    }

    seconds = secondsPassed < 10 ? '0' + secondsPassed : secondsPassed;
    minutes = minutesPassed < 10 ? '0' + minutesPassed : minutesPassed;
    
    timer.innerHTML = `${minutes} : ${seconds}`;
}

function createButton(n) {
    const exerciseButtons = document.getElementById('exerciseBtns');

    const newButton = document.createElement("button");
    newButton.type = "button";
    newButton.className = 'btn btn-light'
    newButton.onclick = function() { goToExercise(this) };
    newButton.textContent = n + 1;

    exerciseButtons.append(newButton);
}

function createOptionButtons() {
    const optionButtons = document.getElementById('optionBtns').children;

    for(let i = 0; i < 4; i++) {
        if (option == i) {
            optionButtons[i].className = 'btn btn-primary d-flex';
        }

        optionButtons[i].href = `exercise.html?id=${exerciseID}&option=${i}`;
    }

    if(option != 1 && option != 2 && option != 3) {
        optionButtons[0].className = 'btn btn-primary d-flex';
    }
}


    // Fetch exercise data.
function fetchExerciseByID(exerciseID) {
    return fetch(`http://localhost:3000/exercises?id=${exerciseID}`)
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! Status: ${response.status}`);
            }
            return response.json();
        })
        .then(exercise => {
            return exercise;
        })
        .catch(error => {
            console.error('Error fetching exercise:', error);
            throw error;
        });
}