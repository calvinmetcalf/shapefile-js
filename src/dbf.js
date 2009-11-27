// ported from http://code.google.com/p/vanrijkom-flashlibs/ under LGPL v2.1

function DbfFile(binFile) {

    this.src = new BinaryFileWrapper(binFile);

    var t1 = new Date().getTime();    

    this.header = new DbfHeader(this.src);

    var t2 = new Date().getTime();
    if (window.console && window.console.log) console.log('parsed dbf header in ' + (t2-t1) + ' ms');    

    t1 = new Date().getTime();    
    
    // TODO: could maybe be smarter about this and only parse these on demand
    this.records = [];
    for (var i = 0; i < this.header.recordCount; i++) {
        var record = this.getRecord(i);
        this.records.push(record);
    }    

    t2 = new Date().getTime();
    if (window.console && window.console.log) console.log('parsed dbf records in ' + (t2-t1) + ' ms');    
    
}
DbfFile.prototype.getRecord = function(index) {

    if (index > this.header.recordCount) {
        throw(new DbfError("",DbfError.ERROR_OUTOFBOUNDS));
    }

    this.src.position = this.header.recordsOffset + index * this.header.recordSize;
    this.src.bigEndian = false;

    return new DbfRecord(this.src, this.header);
}


function DbfHeader(src) {
    
    // endian:
    src.bigEndian = false;

    this.version = src.getSByte();
    this.updateYear = 1900+src.getByte();
    this.updateMonth = src.getByte();
    this.updateDay = src.getByte();
    this.recordCount = src.getLong();
    this.headerSize = src.getShort();
    this.recordSize = src.getShort();

    //skip 2:
    src.position += 2;

    this.incompleteTransaction = src.getByte();
    this.encrypted = src.getByte();

    // skip 12:
    src.position += 12;

    this.mdx = src.getByte();
    this.language = src.getByte();

    // skip 2;
    src.position += 2;

    // iterate field descriptors:
    this.fields = [];
    while (src.getSByte() != 0x0D){
        src.position -= 1;
        this.fields.push(new DbfField(src));
    }

    this.recordsOffset = this.headerSize+1;                                                                    
    
}                

function DbfField(src) {

    this.name = this.readZeroTermANSIString(src);

    // fixed length: 10, so:
    src.position += (10-this.name.length);

    this.type = src.getByte();
    this.address = src.getLong();
    this.length = src.getByte();
    this.decimals = src.getByte();

    // skip 2:
    src.position += 2;

    this.id = src.getByte();

    // skip 2:
    src.position += 2;

    this.setFlag = src.getByte();

    // skip 7:
    src.position += 7;

    this.indexFlag = src.getByte();
}
DbfField.prototype.readZeroTermANSIString = function(src) {
    var r = "";
    var b;
    while (b = src.getByte()) {
        r += String.fromCharCode(b);
    }
    return r;
}

function DbfRecord(src, header) {
    this.offset = src.position;
    this.values = {}
    for (var i = 0; i < header.fields.length; i++) {
        var field = header.fields[i];
        this.values[field.name] = src.getString(field.length);
    }                             
}