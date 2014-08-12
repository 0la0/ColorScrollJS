var ColorScroll = function () {
  
  /**********************************
   *  VARIABLES SHARED WITH WORKER  *
   **********************************/
  var WROKER_PATH = 'colorScrollWorker.js';
  var NO_SCROLL = 0;
  var SCROLL_UP = 1;
  var SCROLL_DOWN = 2;
  var SCROLL_LEFT = 3;
  var SCROLL_RIGHT = 4;
  var SET_COLOR = 0;
  var SCROLL_WIN = 1;

  var width = 320;
  var height = 240;
  var isProcessing = false;
  var canStart = false;
  var lastDir = 0;
  var dom = {};
  var g2d, localMediaStream;

  /********************************************
   *  CREATE WORKER AND SET MESSAGE LISTENER  *
   ********************************************/
  var colorWorker = new Worker(WROKER_PATH);
  colorWorker.addEventListener('message', function(e){
    switch (e.data.type) {
      case SET_COLOR:
        paintCellBackground(e.data.direction, e.data.r, e.data.g, e.data.b);
        break;
      case SCROLL_WIN:
        scrollWindow(e.data.direction);
        break;
    }
  }, false);

  /************************
   *  CALL INIT FUNCTION  *
   ************************/
  if (document.readyState == 'complete') {
    initColorScroll();
  } else {
    window.addEventListener('load', function(e){
      initColorScroll();
    }, false);
  }

  function initColorScroll () {

    /*************************
     *  BUILD DOM ELEMENTS   *
     *************************/
    dom.canvas = document.createElement('canvas');
    dom.canvas.width = width;
    dom.canvas.height = height;
    dom.canvas.style.border = '2px solid green';
    dom.canvas.style.display = 'none';
    g2d = dom.canvas.getContext('2d');
    g2d.clearRect(0, 0, width, height);

    dom.mainContainer = document.createElement('div');
    dom.mainContainer.style.zIndex = 99;
    dom.mainContainer.style.position = 'fixed';
    dom.mainContainer.style.left = '0px';
    dom.mainContainer.style.top = '0px';
    dom.mainContainer.style.border = '2px solid black';
    dom.mainContainer.style.background = 'rgba(100, 100, 100, 0.4)';
    dom.mainContainer.style.fontFamily = 'arial, sans-serif';
    dom.mainContainer.style.fontSize = '14px';
    dom.mainContainer.style.color = '#ffffff';
    dom.mainContainer.style.display = 'none';

    var leftContainer = document.createElement('div');
    leftContainer.style.float = 'left';
    
    var rightContainer = document.createElement('div');
    rightContainer.style.float = 'left';
    rightContainer.style.marginTop = '10px';
    rightContainer.style.marginLeft = '4px';
    rightContainer.style.marginRight = '4px';

    dom.video = document.createElement('video');
    dom.video.autoplay = true;
    dom.video.style.border = '1px solid black';
    
    dom.startStop = document.createElement('div');
    dom.startStop.appendChild(document.createTextNode('start'));
    dom.startStop.style.width = '60%';
    dom.startStop.style.height = '32px';
    dom.startStop.style.lineHeight = '32px';
    dom.startStop.style.textAlign = 'center';
    dom.startStop.style.color = '#000000';
    dom.startStop.style.background = '#33cc33';
    dom.startStop.style.border = '4px solid #5555aa';
    dom.startStop.style.cursor = 'pointer';
    dom.startStop.style.marginLeft = '20%';
    
    dom.setUp = document.createElement('div');
    dom.setUp.appendChild(document.createTextNode('set up color'));
    dom.setUp.id = '1';
    dom.setUp.style.border = '2px solid #333333';
    dom.setUp.style.background = '#999999';
    dom.setUp.style.cursor = 'pointer';
    dom.setUp.style.height = '30px';
    dom.setUp.style.lineHeight = '30px';
    dom.setUp.style.marginBottom = '4px';
    dom.setUp.style.textAlign = 'center';
    
    dom.setDown = document.createElement('div');
    dom.setDown.appendChild(document.createTextNode('set down color'));
    dom.setDown.id = '2';
    dom.setDown.style.border = '2px solid #333333';
    dom.setDown.style.background = '#999999';
    dom.setDown.style.cursor = 'pointer';
    dom.setDown.style.height = '30px';
    dom.setDown.style.lineHeight = '30px';
    dom.setDown.style.marginBottom = '4px';
    dom.setDown.style.textAlign = 'center';
    
    dom.setLeft = document.createElement('div');
    dom.setLeft.appendChild(document.createTextNode('set left color'));
    dom.setLeft.id = '3';
    dom.setLeft.style.border = '2px solid #333333';
    dom.setLeft.style.background = '#999999';
    dom.setLeft.style.cursor = 'pointer';
    dom.setLeft.style.height = '30px';
    dom.setLeft.style.lineHeight = '30px';
    dom.setLeft.style.marginBottom = '4px';
    dom.setLeft.style.textAlign = 'center';
    
    dom.setRight = document.createElement('div');
    dom.setRight.appendChild(document.createTextNode('set right color'));
    dom.setRight.id = '4';
    dom.setRight.style.border = '2px solid #333333';
    dom.setRight.style.background = '#999999';
    dom.setRight.style.cursor = 'pointer';
    dom.setRight.style.height = '30px';
    dom.setRight.style.lineHeight = '30px';
    dom.setRight.style.marginBottom = '4px';
    dom.setRight.style.textAlign = 'center';
      
    dom.resetColors = document.createElement('div');
    dom.resetColors.appendChild(document.createTextNode('RESET COLORS'));
    dom.resetColors.id = '5';
    dom.resetColors.style.border = '2px solid #333333';
    dom.resetColors.style.background = '#999999';
    dom.resetColors.style.cursor = 'pointer';
    dom.resetColors.style.height = '30px';
    dom.resetColors.style.lineHeight = '30px';
    dom.resetColors.style.marginTop = '30px';
    dom.resetColors.style.textAlign = 'center';

    /*********************
     *  INSERT INTO DOM  *
     *********************/
    document.body.appendChild(dom.canvas);
    document.body.appendChild(dom.mainContainer);
    dom.mainContainer.appendChild(leftContainer);
    dom.mainContainer.appendChild(rightContainer);
    leftContainer.appendChild(dom.video);
    leftContainer.appendChild(dom.startStop);
    rightContainer.appendChild(dom.setUp);
    rightContainer.appendChild(dom.setDown);
    rightContainer.appendChild(dom.setLeft);
    rightContainer.appendChild(dom.setRight);
    rightContainer.appendChild(dom.resetColors);

    /*******************************
     *  Register Event Listeners   *
     *******************************/
    dom.video.addEventListener('canplay', function (e) {
      this.setAttribute('width', width);
      this.setAttribute('height', height);
    }, false);

    dom.startStop.addEventListener('click', function (e) {
      e.preventDefault();
      isProcessing = !isProcessing;
      if (isProcessing) {
        loop();
        this.style.background = '#cc3333';
        this.innerHTML = 'stop';
      } else {
        this.style.background = '#33cc33';
        this.innerHTML = 'start';
      }
    }, false);

    rightContainer.addEventListener('click', function (e) {
      e.preventDefault();
      var direction = parseInt(e.target.id);
      if (direction >= 1 && direction <= 4) {
        setColorDirection(direction);
      }
      else if (direction == 5) {
        resetColors();
      }
    }, false);

    //Paint direction cells to default color,
    //then flag as ready to start
    resetColors();
    canStart = true;
  }

  /**************************************
   *  Set direction colors to defaults  *
   **************************************/
  function resetColors () {
    setColorDirection(1, 200, 0, 0, true);
    setColorDirection(2, 0, 0, 200, true);
    setColorDirection(3, 0, 200, 0, true);
    setColorDirection(4, 200, 200 ,0, true);
  }

  /**********************
   *  Configure webcam  *
   **********************/
  function startVideo () {
    navigator.getUserMedia = navigator.getUserMedia       ||
                             navigator.webkitGetUserMedia ||
                             navigator.mozGetUserMedia    ||
                             navigator.msGetUserMedia;
    navigator.getUserMedia(
      {video: true, audio: false}, 
      function (stream) {
        if (navigator.mozGetUserMedia) {
          dom.video.mozSrcObject = stream;
        }
        else {
          dom.video.src = window.URL.createObjectURL(stream);
        }
        localMediaStream = stream;
        dom.video.play();
      }, 
      function (err) {
          console.log('video dom.setUp error: ' + err);
      }
    );
  }

  /**********************************
   *  Main loop:                    *
   *     Get image from webcam      *
   *     Send image data to worker  *
   **********************************/
  function loop () {
    setTimeout(function(){
      g2d.drawImage(dom.video, 0, 0, width, height);
      colorWorker.postMessage({
        type: SCROLL_WIN,
        img: g2d.getImageData(0, 0, width, height)
      });
      if (isProcessing) {
        loop();
      }
    }, 60);
  }

  /***************************
   *  Set a direction color  *
   ***************************/
  function setColorDirection (dir, r ,g, b) {
    var imgData;
    //If colors have been passed in params,
    //then create a pixel of that color
    if (r != null && g != null && b != null) {
      imgData = g2d.createImageData(1,1);
      for (var i = 0; i < imgData.data.length; i+=4) {
        imgData.data[i + 0] = r;
        imgData.data[i + 1] = g;
        imgData.data[i + 2] = b;
        imgData.data[i + 3] = 255;
      }
    } 
    //Otherwise, send the webcam image data
    else {
      g2d.drawImage(dom.video, 0, 0, width, height);
      imgData = g2d.getImageData(0, 0, width, height);
    }
    //Send the direction and pixel data to worker
    colorWorker.postMessage({
      type: SET_COLOR,
      direction: dir,
      img: imgData
    });
  }

  /********************************************************
   *  Paint the background color of a direction element   *
   ********************************************************/
  function paintCellBackground (dir, r, g, b) {
    var element;
    switch (dir) {
      case SCROLL_UP:
        element = dom.setUp;
        break;
      case SCROLL_DOWN:
        element = dom.setDown;
        break;
      case SCROLL_LEFT:
        element = dom.setLeft;
        break;
      case SCROLL_RIGHT:
        element = dom.setRight;
        break;
    }
    element.style.background = 'rgb(' + r + ', ' + g + ', ' + b + ')';
  }

  /********************************************
   *  Scroll Window up, down, left, or right  *
   ********************************************/
  function scrollWindow (dir) {
    var x = 0;
    var y = 0;
    switch (parseInt(dir)) {
      case SCROLL_UP:
        y = -10;
        break;
      case SCROLL_DOWN:
        y = 10;
        break;
      case SCROLL_LEFT:
        x = -10;
        break;
      case SCROLL_RIGHT:
        x = 10
        break;
    }
    window.scrollBy(x, y);
  }

  /*************************
   *    Public Functions   *
   *************************/
  return {

    turnOn: function () {
      //if DOM elements are not ready then try again
      if (!canStart) {
        setTimeout(function () {
          ColorScroll.turnOn();
        }, 500);
        return;
      }
      dom.mainContainer.style.display = 'block';
      startVideo();
    },

    turnOff: function () {
      isProcessing = false;
      dom.video.pause();
      localMediaStream.stop();
      dom.mainContainer.style.display = 'none';
    }
    
  }

}();