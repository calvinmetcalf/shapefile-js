function Layer(url, style) {

  var shpURL = url+'.shp';
  var dbfURL = url+'.dbf';
  this.style = style;

  var theLayer = this;
  
  this.render = function() {
    // it's a little bit "this"-ish... how to put all these member vars into scope?
    if (this.dbfFile && this.shpFile) {
      var ctx = this.canvas.getContext('2d');
      ctx.clearRect(0,0,this.canvas.width,this.canvas.height);
      if (this.shpFile.header.shapeType == ShpType.SHAPE_POLYGON || this.shpFile.header.shapeType == ShpType.SHAPE_POLYLINE) {
        renderPolygons(this.canvas, this.shpFile.records, this.dbfFile.records, this.box, this.style);
      }
      else if (this.shpFile.header.shapeType == ShpType.SHAPE_POINT) {
        renderPoints(this.canvas, this.shpFile.records, this.dbfFile.records, this.box, this.style);
      }
    }
  }

  var onShpFail = function() { 
    alert('failed to load ' + theLayer.shpURL);
  };
  var onDbfFail = function() { 
    alert('failed to load ' + theLayer.dbfURL);
  }

  var onShpComplete = function(oHTTP) {
    var binFile = oHTTP.binaryResponse;
    log('got data for ' + theLayer.shpURL + ', parsing shapefile');
    theLayer.shpFile = new ShpFile(binFile);
    if (theLayer.dbfFile) theLayer.render();
  }

  var onDbfComplete = function(oHTTP) {
    var binFile = oHTTP.binaryResponse;
    log('got data for ' + theLayer.dbfURL + ', parsing dbf file');
    theLayer.dbfFile = new DbfFile(binFile);
    if (theLayer.shpFile) theLayer.render();
  }  

  this.load = function() {
    this.shpURL = shpURL;
    this.dbfURL = dbfURL;
    this.shpLoader = new BinaryAjax(shpURL, onShpComplete, onShpFail);
    this.dbfLoader = new BinaryAjax(dbfURL, onDbfComplete, onDbfFail);
  }
}

function renderPoints(canvas, records, data, box, style) {

  log('rendering points');

  var t1 = new Date().getTime();
  log('starting rendering...');

  var ctx = canvas.getContext('2d');
  
  var sc = Math.min(canvas.width / box.width, canvas.height / box.height);

  if (style.fillStyle) ctx.fillStyle = style.fillStyle;
  if (style.strokeStyle) ctx.strokeStyle = style.strokeStyle;
  if (style.lineWidth) ctx.lineWidth = style.lineWidth;

  // TODO: style attributes for point type (circle, square) and size/radius

  for (var i = 0; i < records.length; i++) {
    var record = records[i];
    if (record.shapeType == ShpType.SHAPE_POINT) {
      var shp = record.shape;
      if (style.fillStyle) {
        ctx.fillRect(-1.5 + (shp.x - box.x) * sc, -1.5 + canvas.height - (shp.y - box.y) * sc, 3, 3);
      }
      if (style.strokeStyle) {
        ctx.strokeRect(-1.5 + (shp.x - box.x) * sc, -1.5 + canvas.height - (shp.y - box.y) * sc, 3, 3);
      }
    }
  }
  
  if ((style.textFill || style.textStroke) && style.textProp) {
  
    if (!style.helper) {
      style.helper = document.createElement('canvas');
      style.helper.width = canvas.width;
      style.helper.height = canvas.height;
      // TODO: fix for IE?
    }

    var helper = style.helper.getContext('2d');
    helper.clearRect(0,0,style.helper.width,style.helper.height);
    helper.fillStyle = 'black';
    
    //var helper = ctx;

    if (style.font) ctx.font = style.font;
    if (style.textFill) ctx.fillStyle = style.textFill;
    if (style.textStroke) {
      ctx.strokeStyle = style.textStroke;
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';
      ctx.lineWidth = style.textHalo || 1;
    }
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    for (var i = 0; i < records.length; i++) {
      if (data[i] && data[i].values && data[i].values[style.textProp]) {
        var record = records[i];
        if (record.shapeType == ShpType.SHAPE_POINT) {
          var shp = record.shape;
          var text = trim(data[i].values[style.textProp]);
          var tx = Math.round(3 + (shp.x - box.x) * sc);
          var ty = Math.round(canvas.height - (shp.y - box.y) * sc);
          var tw = Math.round(ctx.measureText(text).width);
          var th = 12;

          if (tx < 0 || tx+tw >= canvas.width || ty-th/2 < 0 || ty+th/2 >= canvas.height) continue;
          
          var img = helper.getImageData(tx+tw/2,ty,1,1);
          if (img.data[3]) continue;
          var img = helper.getImageData(tx,ty-th/2,1,1);
          if (img.data[3]) continue;
          img = helper.getImageData(tx+tw,ty-th/2,1,1);
          if (img.data[3]) continue;
          img = helper.getImageData(tx+tw,ty+th/2,1,1);
          if (img.data[3]) continue;
          img = helper.getImageData(tx,ty+th/2,1,1);
          if (img.data[3]) continue;
          
          helper.fillRect(tx, ty-th/2, tw, th);
          
          if (style.textStroke) ctx.strokeText(text, tx, ty);
          if (style.textFill) ctx.fillText(text, tx, ty);
        }
      }
      else {
        log(data[i].values);
      }
    }
  }
  
  t2 = new Date().getTime();
  log('done rendering in ' + (t2 - t1) + ' ms');
}

// from http://blog.stevenlevithan.com/archives/faster-trim-javascript
function trim(str) {
  var str = str.replace(/^\s\s*/, ''),
    ws = /\s/,
    i = str.length;
  while (ws.test(str.charAt(--i)));
  return str.slice(0, i + 1);
}

function renderPolygons(canvas, records, data, box, style) {

  log('rendering polygons');

  var t1 = new Date().getTime();
  log('starting rendering...');

  var ctx = canvas.getContext('2d');
  
  var sc = Math.min(canvas.width / box.width, canvas.height / box.height);

  if (style) {
    for (var p in style) {
      ctx[p] = style[p];
    }
  }
  for (var i = 0; i < records.length; i++) {
    var record = records[i];
    if (record.shapeType == ShpType.SHAPE_POLYGON || record.shapeType == ShpType.SHAPE_POLYLINE) {
      var shp = record.shape;
      ctx.beginPath();
      for (var j = 0; j < shp.rings.length; j++) {
        var ring = shp.rings[j];
        if (ring.length < 1) continue;
        ctx.moveTo((ring[0].x - box.x) * sc, canvas.height - (ring[0].y - box.y) * sc);
        for (var k = 1; k < ring.length; k++) {
          ctx.lineTo((ring[k].x - box.x) * sc, canvas.height - (ring[k].y - box.y) * sc);
        }
      }
      if (style.fillStyle && record.shapeType == ShpType.SHAPE_POLYGON) {
        ctx.fill();
      }
      if (style.strokeStyle) {
        ctx.stroke();
      }
    }
  }
  t2 = new Date().getTime();
  log('done rendering in ' + (t2 - t1) + ' ms');
}