/**
 * If array includes second parameter, returns true.
 * Otherwise return false.
*/
function include(arr, obj) {
    return (arr.indexOf(obj) != -1);
}

/**
 * String format function
 * Gets a string includes {i} and replaces it with nth i parameter.
 */
function strFormat() {
    var s = arguments[0];

    for (var i = 0; i < arguments.length - 1; i++) {
        var reg = new RegExp("\\{" + i + "\\}", "gm");
        s = s.replace(reg, arguments[i + 1]);
    }

    return s;
}

function checkCallback(callback) {
    return callback && typeof(callback) === 'function';
}

Array.range = function(n) {
    // Array.range(5) --> [0,1,2,3,4]
    return Array.apply(null,Array(n)).map((x,i) => i)
};

function chunk(arr, n) {
    return Array.range(Math.ceil(arr.length/n)).map((x,i) => arr.slice(i*n,i*n+n));
}

exports.include = include;
exports.strFormat = strFormat;
exports.checkCallback = checkCallback;
exports.chunk = chunk;
