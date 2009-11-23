// ported from http://code.google.com/p/vanrijkom-flashlibs/ under LGPL v2.1

function DbfHeader(src) {

  var t1 = new Date().getTime();  

  var binState = { offset: 0, bigEndian: true };
  
  // endian:
  binState.bigEndian = false;

  this.version = src.getSByteAt(binState.offset, binState.bigEndian);
  binState.offset += 1;
  this.updateYear = 1900+src.getByteAt(binState.offset, binState.bigEndian);
  binState.offset += 1;
  this.updateMonth = src.getByteAt(binState.offset, binState.bigEndian);
  binState.offset += 1;
  this.updateDay = src.getByteAt(binState.offset, binState.bigEndian);
  binState.offset += 1;
  this.recordCount = src.getLongAt(binState.offset, binState.bigEndian);
  binState.offset += 4;
  this.headerSize = src.getShortAt(binState.offset, binState.bigEndian);
  binState.offset += 2;  
  this.recordSize = src.getShortAt(binState.offset, binState.bigEndian);
  binState.offset += 2;

  //skip 2:
  binState.offset += 2;

  this.incompleteTransaction = src.getByteAt(binState.offset, binState.bigEndian);
  binState.offset += 1;
  this.encrypted = src.getByteAt(binState.offset, binState.bigEndian);
  binState.offset += 1;

  // skip 12:
  binState.offset += 12;

  this.mdx = src.getByteAt(binState.offset, binState.bigEndian);
  binState.offset += 1;
  this.language = src.getByteAt(binState.offset, binState.bigEndian);
  binState.offset += 1;

  // skip 2;
  binState.offset += 2;

  // iterate field descriptors:
  this.fields = [];
  while (src.getSByteAt(binState.offset, binState.bigEndian) != 0x0D){
    this.fields.push(new DbfField(src, binState));
  }

  this.recordsOffset = this.headerSize+1;                                  

  var t2 = new Date().getTime();
  if (window.console && window.console.log) console.log('parsed dbf in ' + (t2-t1) + ' ms');  
  
}

function readZeroTermANSIString(src, binState) {
  var r = "";
  var b;
  while (b = src.getByteAt(binState.offset, binState.bigEndian)) {
    binState.offset += 1;
    r+= String.fromCharCode(b);
  }
  binState.offset += 1;
  return r;
}
        

function DbfField(src, binState) {

  this.name = readZeroTermANSIString(src, binState);

  // fixed length: 10, so:
  binState.offset += (10-this.name.length);

  this.type = src.getByteAt(binState.offset, binState.bigEndian);
  binState.offset += 1;
  this.address = src.getLongAt(binState.offset, binState.bigEndian);
  binState.offset += 4;
  this.length = src.getByteAt(binState.offset, binState.bigEndian);
  binState.offset += 1;
  this.decimals = src.getByteAt(binState.offset, binState.bigEndian);
  binState.offset += 1;

  // skip 2:
  binState.offset += 2;

  this.id = src.getByteAt(binState.offset, binState.bigEndian);
  binState.offset += 1;

  // skip 2:
  binState.offset += 2;

  this.setFlag = src.getByteAt(binState.offset, binState.bigEndian);
  binState.offset += 1;

  // skip 7:
  binState.offset += 7;

  this.indexFlag = src.getByteAt(binState.offset, binState.bigEndian);
  binState.offset += 1;  
}

function getRecord(src, header, index) {
    if (index > header.recordCount) 
            throw(new DbfError("",DbfError.ERROR_OUTOFBOUNDS));

    var binState = { bigEndian: false, 
                     offset: header.recordsOffset + index * header.recordSize };
    return new DbfRecord(src, header, binState);
}

function DbfRecord(src, header, binState) {
  this.offset = binState.offset;
  this.values = {}
  for (var i = 0; i < header.fields.length; i++) {
    var field = header.fields[i];
    this.values[field.name] = src.getStringAt(binState.offset, field.length);
    binState.offset += field.length;
  }               
}


