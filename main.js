import { CELLS_PER_ROW, config, ROWS_NUMBER } from './constants.js';
import { playRow } from './music.js';

let rows = [];
let currentRow = 0;
let isPlaying = false;
let playingInterval;

document.addEventListener('DOMContentLoaded', function() {
  drawGrid();
  addGridCellEventListeners();
  document.getElementById('toggle-play-btn').addEventListener('click', togglePlay);
  document.getElementById('stop-btn').addEventListener('click', stopPlaying);
  document.getElementById('reset-btn').addEventListener('click', reset);
  document.getElementById('scales').addEventListener('change', changeScale);
});


function drawGrid() {
  const gridElement = document.getElementById('grid');
  for(let i = 0; i < ROWS_NUMBER; i++) {
    const rowElement = document.createElement('div');
    rowElement.classList.add('grid-row');
    for(let j = 0; j < CELLS_PER_ROW; j++) {
      const cellElement = document.createElement('div');
      cellElement.classList.add('grid-cell');
      rowElement.appendChild(cellElement);
    }
    gridElement.appendChild(rowElement);
  }
};

function addGridCellEventListeners() {
  Array.from(document.getElementsByClassName('grid-cell')).forEach(function(gridCell, index) {
    gridCell.addEventListener('mouseenter', mouseEnterGridCell);
    gridCell.addEventListener('mouseleave', mouseLeaveGridCell);
    gridCell.addEventListener('click', clickGridCell);
    gridCell.addEventListener('click', function() {
      toggleNoteActive(index);
    });
  });
}

function mouseEnterGridCell(e) {
  e.target.classList.add('grid-cell-mouse-over');
}

function mouseLeaveGridCell(e) {
  e.target.classList.remove('grid-cell-mouse-over');
}

function clickGridCell(e) {
  if (e.target.classList.contains('grid-cell-active')) {
    e.target.classList.remove('grid-cell-active');
  } else {
    e.target.classList.add('grid-cell-active');
  }
}

function startPlaying() {
  isPlaying = true;
  document.getElementById('toggle-play-btn').innerHTML = 'Pause';
  playingInterval = setInterval(playLoop, 500);
}

function pausePlaying() {
  isPlaying = false;
  document.getElementById('toggle-play-btn').innerHTML = 'Play';
  clearInterval(playingInterval);
}

function stopPlaying() {
  pausePlaying();
  currentRow = 0;
}

function reset() {
  rows = [];
  Array.from(document.getElementsByClassName('grid-cell')).forEach(function(gridCell) {
    gridCell.classList.remove('grid-cell-active');
  });
}

function playLoop() {
  const gridRow = Array.from(document.getElementsByClassName('grid-row'))[currentRow];
  gridRow.classList.add('is-playing');
  gridRow.classList.remove('has-played');
  if (rows[currentRow]) {
    playRow(rows[currentRow]);
  }
  setTimeout(function() {
    gridRow.classList.remove('is-playing');
    gridRow.classList.add('has-played');
  }, 500);
  currentRow++;
  if (currentRow >= ROWS_NUMBER) {
    currentRow = 0;
  }
}

function toggleNoteActive(index) {
  const row = Math.floor(index / CELLS_PER_ROW);
  const col = Math.floor(index % CELLS_PER_ROW);
  if (!rows[row]) {
    rows[row] = [];
  }
  if (rows[row][col]) {
    delete rows[row][col];
  } else {
    rows[row][col] = col;
  }
}

function togglePlay() {
  if (isPlaying) {
    pausePlaying();
  } else {
    startPlaying();
  }
}

function changeScale(e) {
  config.scale = e.target.value;
}

// MEDIAPIPE
const videoElement = document.getElementsByClassName('input-video')[0];
const canvasElement = document.getElementsByClassName('output-canvas')[0];
const canvasCtx = canvasElement.getContext('2d');

let lastTimePressed = false;

function onResults(results) {
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  // canvasCtx.drawImage(
      // results.image, 0, 0, canvasElement.width, canvasElement.height);
  if (results.multiHandLandmarks) {
    for (const landmarks of results.multiHandLandmarks) {
      const indexFingerLandmark = [landmarks[8]];
      drawLandmarks(canvasCtx, indexFingerLandmark, {color: 'blue', lineWidth: 2});
      drawConnectors(canvasCtx, landmarks, HAND_CONNECTIONS,
                     {color: '#00FF00', lineWidth: 10});
      drawLandmarks(canvasCtx, landmarks, {color: '#FF0000', lineWidth: 2});
      drawLandmarks(canvasCtx, indexFingerLandmark, {color: 'blue', lineWidth: 2});
       // TO DO REMOVE HARCODED VALUES BELOW
      if (indexFingerLandmark[0].x > 0 && indexFingerLandmark[0].x < 0.645)
      {
        const gridCellIndex = Math.floor(indexFingerLandmark[0].x / 0.053) +  Math.floor(indexFingerLandmark[0].y / 0.125) * 12
        const gridCellElement = document.getElementsByClassName('grid-cell')[gridCellIndex];
        if (!lastTimePressed && indexFingerLandmark[0].z < -0.1) {
          lastTimePressed = true;
          toggleNoteActive(gridCellIndex);
          if (gridCellElement.classList.contains('grid-cell-active')) {
            gridCellElement.classList.remove('grid-cell-active');
          } else {
            gridCellElement.classList.add('grid-cell-active');
          }
        } else if (indexFingerLandmark[0].z > -0.1) {
          lastTimePressed = false;
          Array.from(document.getElementsByClassName('grid-cell')).forEach(function (el, index) {
            if (index === gridCellIndex && el.classList.contains('grid-cell-active') === false) {
              el.classList.add('grid-cell-mouse-over');
            } else {
              el.classList.remove('grid-cell-mouse-over');
            }
          })
        }
      }
    }
  }
  canvasCtx.restore();
}

const hands = new Hands({locateFile: (file) => {
  return `https://cdn.jsdelivr.net/npm/@mediapipe/hands/${file}`;
}});
hands.setOptions({
  maxNumHands: 1,
  minDetectionConfidence: 0.8,
  minTrackingConfidence: 0.5
});
hands.onResults(onResults);

const camera = new Camera(videoElement, {
  onFrame: async () => {
    await hands.send({image: videoElement});
  },
  width: 1600,
  height: 800
});
camera.start();
