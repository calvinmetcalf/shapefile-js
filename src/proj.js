/*
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * 
 */
 // based on http://google-maps-utility-library-v3.googlecode.com/svn/trunk/arcgislink/docs/examples.html
 //by Nianwei Liu (nianwei at gmail dot com)
(function(exports){
	
function parseWKT(wkt,robj) {
	robj=robj||{};
	var projections = {
		"Lambert Tangential Conformal Conic Projection": "lcc",
		"Lambert_Conformal_Conic": "lcc",
		"Mercator": "merc",
		"Popular Visualisation Pseudo Mercator": "merc",
		"Mercator_1SP": "merc",
		"Transverse_Mercator": "tmerc",
		"Transverse Mercator": "tmerc",
		"Lambert Azimuthal Equal Area": "laea",
		"Universal Transverse Mercator System": "utm"
	};
	var wktMatch = wkt.match(/^(\w+)\[(.*)\]$/);
		if (!wktMatch){
			return;
		}
		var wktObject = wktMatch[1];
		var wktContent = wktMatch[2];
		var wktTemp = wktContent.split(",");
		var wktName;
		if (wktObject.toUpperCase() == "TOWGS84") {
			wktName = wktObject;  //no name supplied for the TOWGS84 array
		} else {
			wktName = wktTemp.shift();
		}
		wktName = wktName.replace(/^\"/,"");
		wktName = wktName.replace(/\"$/,"");

		var wktArray = [];
		var bkCount = 0;
		var obj = "";
		var token;
		for (var i=0, len = wktTemp.length; i<len; ++i) {
			token = wktTemp[i];
			for (var j=0; j<token.length; ++j) {
				if (token.charAt(j) == "["){
					++bkCount;
				}
				if (token.charAt(j) == "]"){
					--bkCount;
				}
			}
			obj += token;
			if (bkCount === 0) {
				wktArray.push(obj);
				obj = "";
			} else {
				obj += ",";
			}
		}

		//do something based on the type of the wktObject being parsed
		//add in variations in the spelling as required
		switch (wktObject) {
			case 'LOCAL_CS':
				robj.projName = 'identity';
				robj.localCS = true;
				robj.srsCode = wktName;
				break;
			case 'GEOGCS':
				robj.projName = 'longlat';
				robj.geocsCode = wktName;
				if (!robj.srsCode){
					robj.srsCode = wktName;
				}
				break;
			case 'PROJCS':
				robj.srsCode = wktName;
				break;
			case 'GEOCCS':
				break;
			case 'PROJECTION':
				robj.projName = projections[wktName];
				break;
			case 'DATUM':
				robj.datumName = wktName;
				break;
			case 'LOCAL_DATUM':
				robj.datumCode = 'none';
				break;
			case 'SPHEROID':
				robj.ellps = wktName;
				robj.a = parseFloat(wktArray.shift());
				robj.rf = parseFloat(wktArray.shift());
				break;
			case 'PRIMEM':
				robj.from_greenwich = parseFloat(wktArray.shift()); //to radians?
				break;
			case 'UNIT':
				robj.unitName = wktName;
				robj.unit = parseFloat(wktArray.shift());
				break;
			case 'PARAMETER':
				var name = wktName.toLowerCase();
				var value = parseFloat(wktArray.shift());
				//there may be many variations on the wktName values, add in case
				//statements as required
				switch (name) {
					case 'false_easting':
						robj.x0 = value;
						break;
					case 'false_northing':
						robj.y0 = value;
						break;
					case 'scale_factor':
						robj.k0 = value;
						break;
					case 'central_meridian':
						robj.long0 = value;
						break;
					case 'latitude_of_origin':
						robj.lat0 = value;
						break;
					case 'standard_parallel_1':
						robj.sp1=value;
						break;
					case 'standard_parallel_2':
						robj.sp2=value;
						break;
					default:
						break;
					}
				break;
			case 'TOWGS84':
				robj.datum_params = wktArray;
				break;
				//DGR 2010-11-12: AXIS
			case 'AXIS':
				var axisName= wktName.toLowerCase();
				var axisValue= wktArray.shift();
				switch (value) {
					case 'EAST' :
						axisValue= 'e';
						break;
					case 'WEST' :
						axisValue= 'w';
						break;
					case 'NORTH':
						axisValue= 'n';
						break;
					case 'SOUTH':
						axisValue= 's';
						break;
					case 'UP'   :
						axisValue= 'u';
						break;
					case 'DOWN' : 
						axisValue= 'd';
						break;
					//case 'OTHER': 
					default : 
						axisValue= ' ';
						break;//
				}
				if (!robj.axis) {
					robj.axis= "enu";
				}
				switch(axisName) {
					case 'x':
						robj.axis= axisValue + robj.axis.substr(1,2);
						break;
					case 'y':
						robj.axis= robj.axis.substr(0,1) + axisValue + robj.axis.substr(2,1);
						break;
					case 'z':
						robj.axis = robj.axis.substr(0,2) + axisValue;
						break;
					default :
						break;
				}
			break;
		case 'MORE_HERE':
			break;
		default:
			break;
	}
	for (var ji=0,lenj=wktArray.length; ji<lenj; ++ji) {
		parseWKT(wktArray[ji],robj);
	}
	return robj;
}
function lcc(params){
	/*
	based off http://gmaps-utility-gis.googlecode.com/svn/trunk/v3samples/customprojection.html
	*/

	/*=========parameters=================*/

	params=params||{};

	var _a = (params.a ||6378137.0 )/(params.unit||0.3048006096012192);
	var _f_i=params.rf||298.257222101;//this.
	var _phi1 = (params.sp1||34.33333333333334) * (Math.PI / 180);
	var _phi2 = (params.sp2||36.16666666666666) * (Math.PI / 180);
	var _phiF = (params.lat0||33.75) * (Math.PI / 180);
	var _lamdaF = (params.long0||-79.0)* (Math.PI / 180);
	var _FE = params.x0||2000000.002616666;//this.
	var _FN = params.y0||0.0;//this.
	/*========== functions to calc values, potentially can move outside as static methods=========*/
	var calc_m = function(phi, es){
		var sinphi = Math.sin(phi);
			return Math.cos(phi) / Math.sqrt(1 - es * sinphi * sinphi);
		};

	var calc_t = function(phi, e){
		var esinphi = e * Math.sin(phi);
		return Math.tan(Math.PI / 4 - phi / 2) / Math.pow((1 - esinphi) / (1 + esinphi), e / 2);
	};
	var calc_r = function(a, F, t, n){
		return a * F * Math.pow(t, n);
	};
	var calc_phi = function(t_i, e, phi){
		var esinphi = e * Math.sin(phi);
		return Math.PI / 2 - 2 * Math.atan(t_i * Math.pow((1 - esinphi) / (1 + esinphi), e / 2));
	};
	var solve_phi = function(t_i, e, init){
		// iteration
		var i = 0;
		var phi = init;
		var newphi = calc_phi(t_i, e, phi);//this.
		while (Math.abs(newphi - phi) > 0.000000001 && i++ < 10) {
			phi = newphi;
			newphi = calc_phi(t_i, e, phi);//this.
		}
		return newphi;
	};
	/*=========shared, not point specific params or intermediate values========*/
	var _f = 1.0 /_f_i;//this.
	/*e: eccentricity of the ellipsoid where e^2 = 2f - f^2 */
	var _es = 2 * _f - _f * _f;
	var _e = Math.sqrt(_es);
	var _m1 = calc_m(_phi1, _es);//this.
	var _m2 = calc_m(_phi2, _es);//this.
	var _tF = calc_t(_phiF, _e);//this.
	var _t1 = calc_t(_phi1, _e);//this.
	var _t2 = calc_t(_phi2, _e);//this.
	var _n = Math.log(_m1 / _m2) / Math.log(_t1 / _t2);
	var _F = _m1 / (_n * Math.pow(_t1, _n));
	var _rF = calc_r(_a, _F, _tF, _n);//this.
   /**

	* convert lat lng to coordinates 

	* @param {Array<double>} latlng array with 2 double: [lat,lng]

 */

	return function(xy){
		var E = xy[0];
		var N = xy[1];
		var theta_i = Math.atan((E - _FE) / (_rF - (N - _FN)));
		var r_i = (_n > 0 ? 1 : -1) * Math.sqrt((E - _FE) * (E - _FE) + (_rF - (N - _FN)) * (_rF - (N - _FN)));
		var t_i = Math.pow((r_i / (_a * _F)), 1 / _n);
		var phi = solve_phi(t_i, _e, 0);
		var lamda = theta_i / _n + _lamdaF;
		return  [lamda * (180 / Math.PI),phi * (180 / Math.PI)];
	


}
}
// from http://gmaps-utility-gis.googlecode.com/svn/trunk/arcgislink/src/arcgislink_code.js apache lisensed
function tmerc(params) {
	var RAD_DEG = (Math.PI / 180);
	params = params || {};
	var _a = (params.a ||6378137.0 )/(params.unit||0.3048006096012192);
	var f_i=params.rf||298.257222101;//this.
	var _k0 = params.k0;
	var phi0 = (params.lat0||33.75) * RAD_DEG;
	var _lamda0 =(params.long0||-79.0)* RAD_DEG;
	var _FE = params.x0||2000000.002616666;
	var _FN =  params.y0||0.0;//this.
	var f = 1.0 / f_i;//this.
	/*e: eccentricity of the ellipsoid where e^2  =  2f - f^2 */
	var _es = 2 * f - f * f;
	//var _e  =  Math.sqrt(_es);
	/* e^4 */
	var _ep4 = _es * _es;
	/* e^6 */
	var _ep6 = _ep4 * _es;
	/* e'  second eccentricity where e'^2  =  e^2 / (1-e^2) */
	var _eas = _es / (1 - _es);
	function _calc_m(phi, a, es, ep4, ep6) {
		return a * ((1 - es / 4 - 3 * ep4 / 64 - 5 * ep6 / 256) * phi - (3 * es / 8 + 3 * ep4 / 32 + 45 * ep6 / 1024) * Math.sin(2 * phi) + (15 * ep4 / 256 + 45 * ep6 / 1024) * Math.sin(4 * phi) - (35 * ep6 / 3072) * Math.sin(6 * phi));
	}
	var _M0 = _calc_m(phi0, _a, _es, _ep4, _ep6);
	return function(coords) {
		var E = coords[0];
		var N = coords[1];
		var e1 = (1 - Math.sqrt(1 - _es)) / (1 + Math.sqrt(1 - _es));
		var M1 = _M0 + (N - _FN) / _k0;
		var mu1 = M1 / (_a * (1 - _es / 4 - 3 * _ep4 / 64 - 5 * _ep6 / 256));
		var phi1 = mu1 + (3 * e1 / 2 - 27 * Math.pow(e1, 3) / 32) * Math.sin(2 * mu1) + (21 * e1 * e1 / 16 - 55 * Math.pow(e1, 4) / 32) * Math.sin(4 * mu1) + (151 * Math.pow(e1, 3) / 6) * Math.sin(6 * mu1) + (1097 * Math.pow(e1, 4) / 512) * Math.sin(8 * mu1);
		var C1 = _eas * Math.pow(Math.cos(phi1), 2);
		var T1 = Math.pow(Math.tan(phi1), 2);
		var N1 = _a / Math.sqrt(1 - _es * Math.pow(Math.sin(phi1), 2));
		var R1 = _a * (1 - _es) / Math.pow((1 - _es * Math.pow(Math.sin(phi1), 2)), 3 / 2);
		var D = (E - _FE) / (N1 * _k0);
		var phi = phi1 - (N1 * Math.tan(phi1) / R1) * (D * D / 2 - (5 + 3 * T1 + 10 * C1 - 4 * C1 * C1 - 9 * _eas) * Math.pow(D, 4) / 24 + (61 + 90 * T1 + 28 * C1 + 45 * T1 * T1 - 252 * _eas - 3 * C1 * C1) * Math.pow(D, 6) / 720);
		var lamda = _lamda0 + (D - (1 + 2 * T1 + C1) * Math.pow(D, 3) / 6 + (5 - 2 * C1 + 28 * T1 - 3 * C1 * C1 + 8 * _eas + 24 * T1 * T1) * Math.pow(D, 5) / 120) / Math.cos(phi1);
		return [lamda / RAD_DEG, phi / RAD_DEG];
	};
}
var projes = {};
projes.lcc = lcc;
projes.tmerc = tmerc;

exports.proj = function(wkt){
	var projObj = parseWKT(wkt);
	var projection = projes[projObj.projName];
	if(projection){
		return projection(projObj);
	}
};

})(shp);