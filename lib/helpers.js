/**
 * If array includes second parameter, returns true.
 * Otherwise return false.
*/
exports.include = function(arr, obj) {
    return (arr.indexOf(obj) != -1);
};

/**
 * String format function
 * Gets a string includes {i} and replaces it with nth i parameter.
 */
exports.strFormat = function() {
    var s = arguments[0];

    for (var i = 0; i < arguments.length - 1; i++) {
        var reg = new RegExp("\\{" + i + "\\}", "gm");
        s = s.replace(reg, arguments[i + 1]);
    }

    return s;
};
