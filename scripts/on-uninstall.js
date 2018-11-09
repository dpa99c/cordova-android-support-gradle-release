const PLUGIN_NAME = "cordova-android-support-gradle-release";

var FILE_PATHS = [
    "platforms/android/"+PLUGIN_NAME+"/properties.gradle",
    "platforms/android/app/"+PLUGIN_NAME+"/properties.gradle",
    "platforms/android/app/src/main/"+PLUGIN_NAME+"/properties.gradle"
];

var deferral, fs, path;

function log(message) {
    console.log(PLUGIN_NAME + ": " + message);
}

function onError(error) {
    log("ERROR: " + error);
    deferral.resolve();
}

function removeFile(filePath){
    var _filePath = path.resolve(process.cwd(), filePath);
    if(fs.existsSync(_filePath)){
        fs.unlinkSync(_filePath);
        log("removed Gradle config file: "+filePath);
    }
}

function run() {
    try {
        fs = require('fs');
        path = require('path');
    } catch (e) {
        throw("Failed to load dependencies. If using cordova@6 CLI, ensure this plugin is installed with the --fetch option: " + e.toString());
    }

    // Remove properties.gradle
    FILE_PATHS.forEach(function(filePath){
        removeFile(filePath)
    });
    deferral.resolve();
}

function attempt(fn) {
    return function () {
        try {
            fn.apply(this, arguments);
        } catch (e) {
            onError("EXCEPTION: " + e.toString());
        }
    }
}

module.exports = function (ctx) {
    deferral = ctx.requireCordovaModule('q').defer();
    attempt(run)();
    return deferral.promise;
};
