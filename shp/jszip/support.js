define(function() {
	var out = {};
	out.arraybuffer = typeof ArrayBuffer !== "undefined" && typeof Uint8Array !== "undefined";
	out.uint8array = typeof Uint8Array !== "undefined";
	if (typeof ArrayBuffer === "undefined") {
		out.blog = false;
		return out;
	}
	var buffer = new ArrayBuffer(0);
	try {
		out.blog = new Blob([buffer], {
			type: "application/zip"
		}).size === 0;
		return out;
	}
	catch (e) {
		try {
			var b = window.BlobBuilder || window.WebKitBlobBuilder || window.MozBlobBuilder || window.MSBlobBuilder;
			var builder = new b();
			builder.append(buffer);
			out.blob = builder.getBlob('application/zip').size === 0;
			return out;
		}
		catch (e) {
			out.blob = false;
			return out;
		}
	}
	return out;
});