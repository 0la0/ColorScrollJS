/**********************************
 *  VARIABLES SHARED WITH WORKER  *
 **********************************/
var NO_SCROLL = 0;
var SCROLL_UP = 1;
var SCROLL_DOWN = 2;
var SCROLL_LEFT = 3;
var SCROLL_RIGHT = 4;
var SET_COLOR = 0;
var SCROLL_WIN = 1;

var distanceThresh = 50;
var controls = {};

/**********************
 *  MESSAGE LISTENER  *
 **********************/
onmessage = function (e) {
  switch (e.data.type) {
    case SET_COLOR:
      setColor(e.data.direction, e.data.img);
      break;
    case SCROLL_WIN:
      processImage(e.data.img);
      break;
  }
}

/*************************
 *  SET DIRECTION COLOR  *
 *************************/
function setColor (dir, image) {
  var ave = getAvgColor(image);
  //Set local color data structure
  controls[dir] = {
    r: ave.r,
    g: ave.g,
    b: ave.b
  };
  //Send direction and color associated
  //with it back to the main thread
  postMessage({
    type: SET_COLOR,
    direction: dir,
    r: ave.r,
    g: ave.g,
    b: ave.b
  });
}

/*********************************
 *  DETERMINE SCROLL DIRECTION   *
 *********************************/
function processImage (image) {
  //Get the average color of the image
  var colorObj = getAvgColor(image);
  //Find the closest color out of the direction colors
  var distances = [];
  for (var direction in controls) {
    if (controls[direction] != null) {
      distances.push({
        direction: direction,
        distance: colorDistance(controls[direction], colorObj)
      });
    }
  }
  if (distances.length) {
    //sort distances by distance
    distances.sort(function (a, b) {
      return a.distance - b.distance;
    });
  }
  //If the webcam image is within the specified color distance
  //of a direction color, then send message back to main thread
  //with the direction to scroll.
  if (distances[0].distance <= distanceThresh) {
    postMessage({
      type: SCROLL_WIN,
      direction: distances[0].direction
    });
  }
}

/***********************************************
 *  EUCLIDEAN DISTANCE BETWEEN TWO RGB COLORS  *
 ***********************************************/
function colorDistance (c1, c2) {
  var r = Math.pow((c1.r - c2.r), 2);
  var g = Math.pow((c1.g - c2.g), 2);
  var b = Math.pow((c1.b - c2.b), 2);
  return Math.sqrt(r + g + b);
}

/*************************************
 *  AVERAGE PIXEL COLOR OF AN IMAGE  *
 *************************************/
function getAvgColor (image) {
  var rTot = 0;
  var gTot = 0;
  var bTot = 0;
  var aTot = 0;
  var size = image.data.length / 4;
  for (var i = 0; i < image.data.length; i += 4) {
    rTot += image.data[i + 0];
    gTot += image.data[i + 1];
    bTot += image.data[i + 2];
    aTot += image.data[i + 3];
  }
  return ({
    r: Math.floor(rTot / size),
    g: Math.floor(gTot / size),
    b: Math.floor(bTot / size),
    a: Math.floor(aTot / size)
  });
}