//
// stateful helper for binaryajax.js's BinaryFile class
// 
// modelled on Flash's ByteArray, mostly, although some names
// (int/short/long) differ in definition
//

function BinaryFileWrapper(binFile) {
    
    this.position = 0;
    this.bigEndian = true;

    this.getByte = function() {
        var byte = binFile.getByteAt(this.position);
        this.position++;
        return byte;
    }

    this.getLength = function() {
        return binFile.getLength();
    }

    this.getSByte = function() {
        var sbyte = binFile.getSByteAt(this.position);
        this.position++;
        return sbyte;
    }

    this.getShort = function() {
        var short = binFile.getShortAt(this.position, this.bigEndian);
        this.position += 2;
        return short;
    }
    
    this.getSShort = function() {
        var sshort = binFile.getSShortAt(this.position, this.bigEndian);
        this.position += 2;
        return sshort;
    }
    
    this.getLong = function() {
        var l = binFile.getLongAt(this.position, this.bigEndian);
        this.position += 4;
        return l;
    }
    
    this.getSLong = function() {
        var l = binFile.getSLongAt(this.position, this.bigEndian);
        this.position += 4;
        return l;
    }
    
    this.getString = function(iLength) {
        var s = binFile.getStringAt(this.position, iLength);
        this.position += iLength;
        return s;
    }

    this.getDouble = function() {
        var d = binFile.getDoubleAt(this.position, this.bigEndian);
        this.position += 8;
        return d;
    }

    this.getChar = function() {
        var c = binFile.getCharAt(this.position);
        this.position++;
        return c;
    }
}