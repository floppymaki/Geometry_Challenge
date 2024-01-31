const urlParams = new URLSearchParams(window.location.search);
const exerciseID = urlParams.get('id');
var currentExercise = 0;
var coords = [[]];
const drawingLayer = new Konva.Layer();
const shapeLayer = new Konva.Layer();
const mirrorLayer = new Konva.Layer();

const stageWidth = 640;
const stageHeight = 640;

const stage = new Konva.Stage({
    container: 'konva-field',
    width: stageWidth,
    height: stageHeight
});
var validQuadrants = [1, 2, 3, 4];

    // TODO: Clean this part up.
document.addEventListener("DOMContentLoaded", function () {
    const titleField = document.getElementById('title');
    createStage();

    if(exerciseID !== 'new') {
        fetchExerciseByID(exerciseID)
        .then(exerciseData => {
            
            const data = exerciseData[0];
            // console.log("Fetched exercise data:", data);
    
            titleField.value = data['title'];
    
            // create an exercise button for each exercise in the fecthed data
            let exerciseCount = data['coords'].length;
            for(let i = 1; i < exerciseCount; i++) {
                addButton(i+1);
            }
         
            // set coords array here
            setCoords(data['coords']);

            // determine active quadrant
            for(let i = 0; i < coords[0].length; i++) {
                validQuadrants = validQuadrant(coords[0][i]);
            }
    
            // call drawDot() here
            for(let i = 0; i < data['coords'][0].length; i++) {
                let pos = data['coords'][0][i];
                drawDot(pos, false);
            }

            drawShape(data['coords'][0]);    
        })
        .catch(error => {
            console.log(error);
        });
    }
    
});

    // Add a new array to coords and add a new exercise button.
function addExercise(btn) {
    var exerciseCount = btn.parentElement.children.length;
    coords[exerciseCount - 1] = [];

    addButton(exerciseCount);
}

    // Add new exercise button to button group.
function addButton(exerciseNumber) {
    const exerciseButtons = document.getElementById('exerciseBtns');

    const newButton = document.createElement("button");
    newButton.type = "button";
    newButton.className = "btn btn-light";
    newButton.textContent = exerciseNumber;
    newButton.onclick = function() { goToExercise(this) };

    const addBtn = exerciseButtons.lastElementChild;
    exerciseButtons.insertBefore(newButton, addBtn);
}

    // Update currentExercise and draw circles and shapes using coords[currentExercise].
function goToExercise(btn){
    if(btn.parentNode.querySelector('.btn-primary')) {
        btn.parentNode.querySelector('.btn-primary').className = "btn btn-light";
    }

    btn.className = "btn btn-primary";

    currentExercise = btn.textContent - 1;
    
    validQuadrants = [1, 2, 3, 4];
    for(let i = 0; i < coords[currentExercise].length; i++) {
        validQuadrants = validQuadrant(coords[currentExercise][i]);
    }

    shapeLayer.destroyChildren();
    drawingLayer.destroyChildren();
    mirrorLayer.destroyChildren();

    if(coords[currentExercise]) {
        for(var i = 0; i < coords[currentExercise].length; i++){
            drawDot(coords[currentExercise][i], false);
        }
    }

    drawShape(coords[currentExercise]);   
}

    // TODO: Make sure the dark grey lines in the middle of the stage are drawn last, so they overlap the light grey lines.
    // Draw a background and grid lines on the Konva stages.
function createStage(){
    var layer = new Konva.Layer();

    var background = new Konva.Rect({
        x: 20,
        y: 20,
        width: 600,
        height: 600,
        fill: 'white',
        stroke: 'lightgrey',
        strokeWidth: 2,
    });
    layer.add(background);

    stage.add(layer);

    layer.draw();


        // HORIZONTAL GRID LINES
    for(var i = 0; i < stage.width() / 60; i++){
        if(i * 60 == background.width() / 2){
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
        if(i * 60 == background.height() / 2){
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

    stage.add(shapeLayer);
    stage.add(mirrorLayer);
    stage.add(drawingLayer);
}

    // Fill coords array with fetched data.
function setCoords(fetchedCoords) {
    for(let i = 0; i < fetchedCoords.length; i++) {
        coords[i] = [];
        for(let j = 0; j < fetchedCoords[i].length; j++) {
            coords[i].push(fetchedCoords[i][j]);
        }
    }
}

    // Add a new object to coords[currentExercise] containing x and y values. Calculate new x and y values so circle snaps to a grid line.
function addDot(pos){
    if(pos === undefined){
        var pos = stage.getPointerPosition();
    }

        // need nearest number divisble by 30. adjust according to extra pixels around the stage.
    var x = Math.round((pos["x"] - 20) / 30) * 30 + 20;
    var y = Math.round((pos["y"] - 20) / 30) * 30 + 20;

    var gridPos = {"x": x, "y": y};

        // if position is occupied or not valid, don't add a circle
    if(!isValid(gridPos)) return;

    if(!coords[currentExercise]) {
        coords[currentExercise] = [];
    }
    coords[currentExercise].push(gridPos);

    drawDot(gridPos, false);
    drawShape(coords[currentExercise]);
}

    // TODO: Clean this function up. thing bool is essential when user wants to draw on 2 different quadrant edges. rename thing...
    // Compare the number of the valid quadrant(s) and the quadrant that's been clicked in. Return false if they do not match.
function isValid(pos) {

            // Return false if a circle has already been placed in this position.
        if(coords[currentExercise].some(coord => coord.x === pos.x && coord.y === pos.y)){
            return false
        } 

            // Return false if user clicked out of bounds.
        if(pos["x"] < 20 || pos["x"] > 620 || pos["y"] < 20 || pos["y"] > 620) {
            return false
        }
    
        
        let thisQuadrant = currentQuadrant(pos);
        var thing = false;
        // FIX THIS
        if(thisQuadrant.length === undefined) {
            if(validQuadrants.includes(thisQuadrant)) {
                validQuadrants = validQuadrant(pos);
                thing = true;
                // return true;
            } else {
                thing = false;
                // return false;
            }
        } else {
            for(let i = 0; i < thisQuadrant.length; i++) {
                    if(validQuadrants.includes(thisQuadrant[i])) {
                        validQuadrants = validQuadrant(pos);
                        thing = true
                        // return true;
                    } else {
                        if(!thing) {
                            thing = false;
                            // return false;
                        }

                    }
            }
        }

        return thing;
}

    // Remove circle that's been selected and remove its xy object from coords[currentExercise]. Redraw the circles and shapes.
function removeDot() {
    var pos = stage.getPointerPosition();
    var x = Math.round((pos["x"] - 20) / 30) * 30 + 20;
    var y = Math.round((pos["y"] - 20) / 30) * 30 + 20;
    pos = {"x": x, "y": y};
    let index = coords[currentExercise].findIndex(coord => coord.x === pos.x && coord.y === pos.y);

    let exists = coords[currentExercise].includes(coords[currentExercise][index]);

    if(!exists) {
        return;
    }

    drawingLayer.destroyChildren();
    coords[currentExercise].splice(index, 1);

    for(let i = 0; i < coords[currentExercise].length; i ++) {
        drawDot(coords[currentExercise][i]);
    }

    drawShape(coords[currentExercise]);
}

    // Draw a circle in selected position. Check if the circle belongs to coords[currentExercise] or if it is a mirrored circle. Change attributes based on isMirrored.
function drawDot(pos, isMirrored){

    var circle = new Konva.Circle({
        x: pos['x'],
        y: pos['y'],
        radius: 10,
        fill: isMirrored ? 'grey' : '#0079FF',
        draggable: isMirrored ? false : true,
    });

    isMirrored ? mirrorLayer.add(circle) : drawingLayer.add(circle);

    if(!isMirrored) {                
        circle.on('mouseover', function () {
            document.body.style.cursor = 'pointer';
        });
        circle.on('mouseout', function () {
            document.body.style.cursor = 'default';
        });
        circle.on('dragstart', function () {
            var pos = stage.getPointerPosition();
            var x = Math.round((pos["x"] - 20) / 30) * 30 + 20;
            var y = Math.round((pos["y"] - 20) / 30) * 30 + 20;
    
            oldGridPos = {"x": x, "y": y};
        });
        circle.on('dragend', function () {
            var pos = stage.getPointerPosition();
            var x = Math.round((pos["x"] - 20) / 30) * 30 + 20;
            var y = Math.round((pos["y"] - 20) / 30) * 30 + 20;
    
            newGridPos = {"x": x, "y": y};
    
            let index = coords[currentExercise].findIndex(coord => coord.x === oldGridPos.x && coord.y === oldGridPos.y);
    
            circle.destroy();
            if(isValid(newGridPos)){
                coords[currentExercise][index] = newGridPos;
                
                drawDot(newGridPos, false);
                drawShape(coords[currentExercise]);
            } else {
                    // snap back to prev position
                drawDot(oldGridPos, false);
            }
        });
    }
}

    // Draw a shape based on the points in flattened array of coords[currentExercise].
function drawShape(pointsArray) {     
    shapeLayer.destroyChildren();

    let points = pointsArray.flatMap(obj => Object.values(obj));

    var shape = new Konva.Line({
        points: points,
        fill: '#62a7f5',
        stroke: '#0079FF',
        strokeWidth: 1,
        closed: true,
      });

    shapeLayer.add(shape);

    mirrorShapes(points);
}

    // TODO: Adjust mirrorCoords[2] so it uses both stagewidth and stageheight. not necessary right now, but nice in case both vars were to differ.
    // Calculate points for the mirrored shapes and draw them.
function mirrorShapes(points) {
    let mirrorCoords = [
        [], [], []
    ]

    mirrorCoords[0] = points.map((point, i) => i % 2 === 0 ? (stageWidth - point) : point);
    mirrorCoords[1] = points.map((point, i) => i % 2 !== 0 ? (stageHeight - point) : point);
    mirrorCoords[2] = points.map((point) => stageWidth - point);

    mirrorLayer.destroyChildren();

    for(let i = 0; i < mirrorCoords.length; i++) {
        for(let j = 0; j < mirrorCoords[i].length; j+=2){
            drawDot({"x": mirrorCoords[i][j], "y": mirrorCoords[i][j+1]}, true);
        }

        var shape = new Konva.Line({
            points: mirrorCoords[i],
            fill: 'lightgrey',
            stroke: 'grey',
            strokeWidth: 1,
            closed: true,
        });

        shapeLayer.add(shape);
    }
}

    // Empty coords[currentExercise] and erase Konva layers.
function eraseExercise() {
    coords[currentExercise] = [];
    shapeLayer.destroyChildren();
    drawingLayer.destroyChildren();
    mirrorLayer.destroyChildren();
    validQuadrants = [1, 2, 3, 4];
}

    // Remove coords[currentExercise] from coords and rebuild exercise buttons.
function removeExercise() {
    if(coords.length < 2) {
        return;
    }

    coords.splice(currentExercise, 1);

    let btnGroup = document.getElementById('exerciseBtns');
    let btns = btnGroup.children;
    
    for (let i = btns.length - 2; i >= 0; i--) {
        btns[i].remove();
    }

    for(let i = 0; i < coords.length; i++) {
        addButton(i+1);
    }

    if(currentExercise === coords.length) {
        goToExercise(btns[currentExercise - 1]);
    } else {
        goToExercise(btns[currentExercise]);
    }
}

    // Determine which quadrant user clicked in.
function currentQuadrant(pos) {
    let quadrant;
    let x = pos["x"];
    let y = pos["y"];

    let halfWidth = stageWidth / 2;
    let halfHeight = stageHeight / 2;

    if(x < halfWidth && y < halfHeight) quadrant = 1;
    if(x > halfWidth && y < halfHeight) quadrant = 2;
    if(x < halfWidth && y > halfHeight) quadrant = 3;
    if(x > halfWidth && y > halfHeight) quadrant = 4;

    if(x === halfWidth && y === halfHeight) quadrant = [1, 2, 3, 4];

    if(x === halfWidth && y < halfHeight) quadrant = [1, 2];
    if(x === halfWidth && y > halfHeight) quadrant = [3, 4];
    if(x < halfWidth && y === halfHeight) quadrant = [1, 3];
    if(x > halfWidth && y === halfHeight) quadrant = [2, 4];

    return quadrant;
}

    // Calculate which quadrants may be drawn in.
function validQuadrant(pos) {
    let x = pos["x"];
    let y = pos["y"];

    let halfWidth = stageWidth / 2;
    let halfHeight = stageHeight / 2;

    if(validQuadrants.length === 1) {
        return validQuadrants;
    }

    if(x < halfWidth) {
        if (y < halfHeight && validQuadrants.includes(1)) {
            validQuadrants = [1];
        } else if (y > halfHeight && validQuadrants.includes(3)) {
            validQuadrants = [3];
        }
    }

    if(x > halfWidth) {
        if (y < halfHeight && validQuadrants.includes(2)) {
            validQuadrants = [2];
        } else if (y > halfHeight && validQuadrants.includes(4)) {
            validQuadrants = [4];
        }
    }


    if(validQuadrants.length >= 2) {
        if(x === halfWidth) {
            if(y < halfHeight) {
                validQuadrants = validQuadrants.filter(number => number !== 4);
                validQuadrants = validQuadrants.filter(number => number !== 3);
            } else if (y > halfHeight) {
                validQuadrants = validQuadrants.filter(number => number !== 1);
                validQuadrants = validQuadrants.filter(number => number !== 2);
            }
        }
    
        if(y === halfHeight) {
            if(x < halfWidth) {
                validQuadrants = validQuadrants.filter(number => number !== 2);
                validQuadrants = validQuadrants.filter(number => number !== 4);
            } else if (x > halfWidth) {
                validQuadrants = validQuadrants.filter(number => number !== 1);
                validQuadrants = validQuadrants.filter(number => number !== 3);
            }
        }    
    }    

    return validQuadrants;
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

    // Save exercise data.
function save(){
    let title = document.getElementById("title").value.trim();

        // TODO: add frontend warning. also check if coords contains anything
    if(title == '') {
        return;
    }

    let method = (exerciseID === 'new') ? 'POST' : 'PATCH';
    let url = (exerciseID === 'new') ? 'http://localhost:3000/exercises' : `http://localhost:3000/exercises/${exerciseID}`

    fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                "title": title,
                "coords": coords
            }),
        })
        .then(response => response.json())
        .then(data => {
            console.log('Success:', data);

            if (method === 'POST') {
                window.location.href = `/create.html?id=${data.id}`;
            }
        })
        .catch(error => {
            console.error('Error:', error);
        });

}