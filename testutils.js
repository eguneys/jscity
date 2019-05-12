const ok = runtest(matcher((a) => a !== null && a !== undefined, '[is null or undefined]'));

const not = runtest(matcher((a, b) => a !== b, '==='));

const is = runtest(matcher((a, b) => a === b, '!=='));

const isabove = runtest(matcher((a, b) => a >= b, '>=!'));

const deep_is = runtest(matcher((a, b) => {
  if (a !== null && b !== null && typeof a === 'object' && typeof b === 'object') return objectCompare(a, b);
  else return a === b;
}, '!=='));

function matcher(f, s) {
  return { matcher: f, onfail: s };
}

function runtest({ matcher, onfail }) {
  return function(msg, a, b) {
    var passfail = '';
    var res = '';
    var colorcode;
    if (matcher(a, b)) {
      passfail = '%cpass';
      colorcode = 'background: green;';
    } else {
      passfail = '%cfail ';
      colorcode = 'background: red;';
      res += JSON.stringify(a) + ` ${onfail} ` + JSON.stringify(b);
    }
    res = msg + ' ' + res;
    console.log(passfail, colorcode,res);  
  };
}

function log(msg) {
  console.log('%c ## ', 'background: yellow;', msg);
}

module.exports = {
  ok,
  not,
  is,
  isabove,
  deep_is,
  matcher,
  runtest,
  log
};

function objectCompare(obj1, obj2) {
	//Loop through properties in object 1
	for (var p in obj1) {
		//Check property exists on both objects
		if (obj1.hasOwnProperty(p) !== obj2.hasOwnProperty(p)) return false;
 
		switch (typeof (obj1[p])) {
			//Deep compare objects
			case 'object':
				if (!objectCompare(obj1[p], obj2[p])) return false;
				break;
			//Compare function code
			case 'function':
				if (typeof (obj2[p]) == 'undefined' || (p != 'compare' && obj1[p].toString() != obj2[p].toString())) return false;
				break;
			//Compare values
			default:
				if (obj1[p] != obj2[p]) return false;
		}
	}
 
	//Check object 2 for any extra properties
	for (var p in obj2) {
		if (typeof (obj1[p]) == 'undefined') return false;
	}
	return true;
};
