function log(s) {
  //if (window.console && window.console.log) console.log(s);
}

function Map(id, layers) {

  var parent = document.getElementById(id);
  if (!parent.style.position) parent.style.position = 'relative';

  for (var i = 0; i < layers.length; i++) {
    log('creating canvas...');

    var layer = layers[i];

    var canvas = document.createElement('canvas');
    canvas.style.position = 'absolute';
    canvas.style.left = '0px';
    canvas.style.top = '0px';
    // TODO get these from parent properties or in constructor:
    canvas.style.width = '1024px';
    canvas.style.height = '512px';
    parent.appendChild(canvas);
    if (window.G_vmlCanvasManager) {
      canvas = G_vmlCanvasManager.initElement(canvas); 
    }  
    canvas.width = parseInt(canvas.style.width.match(/\d+/));
    canvas.height = parseInt(canvas.style.height.match(/\d+/));

    layer.canvas = canvas;
    layer.box = { x: -180, y: -90, width: 360, height: 180 };
    
    layer.load();
  }
  
  var box = { x: -180, y: -90, width: 360, height: 180 };
  
  var render = function() {
    for (var i = 0; i < layers.length; i++) {
      layers[i].box = box;
      layers[i].render();
    }
  }
  
  var panBy = function(x,y) {
    var degreesPerPixel = box.width / 1024.0;
    box.x -= x * degreesPerPixel;
    box.y += y * degreesPerPixel;
    render();
  }
  
  var zoomBy = function(s,x,y) {
    var degreesPerPixel = box.width / 1024.0;
    var boxX = box.x + (x * degreesPerPixel)
    var boxY = box.y + ((512-y) * degreesPerPixel)
    box.x -= boxX;
    box.y -= boxY;
    box.x *= s;
    box.y *= s;
    box.width *= s;
    box.height *= s;
    box.x += boxX;
    box.y += boxY;
    render();
  }
  
  var mouseDown = function(e) {
    var prevMouse = { x: e.clientX, y: e.clientY };
    var mouseMove = function(e) {
      panBy(e.clientX - prevMouse.x, e.clientY - prevMouse.y);
      prevMouse.x = e.clientX;
      prevMouse.y = e.clientY;
      e.preventDefault(); // hopefully no selecting
    }
    var mouseUp = function(e) {
      document.body.style.cursor = null;
      document.removeEventListener('mousemove', mouseMove, false);
      document.removeEventListener('mouseup', mouseUp, false);
    }
    document.body.style.cursor = 'hand';
    document.addEventListener('mousemove', mouseMove, false);
    document.addEventListener('mouseup', mouseUp, false);
  };
  
  parent.addEventListener('mousedown', mouseDown, false);

  var mouseWheel = function(e) {

    var localX = e.clientX;
    var localY = e.clientY;
  
    // correct for scrolled document
    localX += document.body.scrollLeft + document.documentElement.scrollLeft;
    localY += document.body.scrollTop + document.documentElement.scrollTop;

    // correct for nested offsets in DOM
    for(var node = parent; node; node = node.offsetParent) {
      localX -= node.offsetLeft;
      localY -= node.offsetTop;
    }  
    
    var delta = 0;
    if (e.wheelDelta) {
        delta = e.wheelDelta;
    }
    else if (e.detail) {
        delta = -e.detail;
    }
  
    if (delta > 0) {
      zoomBy(0.9, localX, localY);
    }
    else if (delta < 0) {
      zoomBy(1.1, localX, localY);
    }
    
    // cancel page scroll
    e.preventDefault();
  }

  // Safari
  parent.addEventListener('mousewheel', mouseWheel, false);
  // Firefox
  parent.addEventListener('DOMMouseScroll', mouseWheel, false);
  
}