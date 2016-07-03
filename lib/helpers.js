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

exports.include = include;
exports.strFormat = strFormat;
exports.checkCallback = checkCallback;
