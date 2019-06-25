var PLUGIN_NAME = "cordova-android-support-gradle-release";
var PLUGIN_VAR = "ANDROID_SUPPORT_VERSION";
var PACKAGE_PATTERN = /(compile|implementation|api|annotationProcessor)( "com.android.support:[^:]+:)([^"]+)"/g;
var PLUGIN_GRADLE_FOLDER_PATH = "platforms/android/"+PLUGIN_NAME;
var VERSION_PATTERN = new RegExp('def '+PLUGIN_VAR+' = "[^"]+"');
var VERSION_TEMPLATE = "def "+PLUGIN_VAR+" = \"<VERSION>\"";

var V6 = "V6";
var V7 = "V7+";

var FILE_PATHS = {};
FILE_PATHS[V6] = {
    "build.gradle": "platforms/android/build.gradle"
};
FILE_PATHS[V7] = {
    "build.gradle": "platforms/android/app/build.gradle"
};

var deferral, fs, path, semver,
    platformVersion;

function log(message) {
    console.log(PLUGIN_NAME + ": " + message);
}

function onError(error) {
    log("ERROR: " + error);
    deferral.resolve();
}

function getCordovaAndroidVersion(){
    var cordovaVersion = require(path.resolve(process.cwd(),'platforms/android/cordova/version')).version;
    if (semver.satisfies(cordovaVersion, "6.x", { includePrerelease: true })){
        return V6;
    }
    return V7;
}

function run() {
    try {
        fs = require('fs');
        path = require('path');
        semver = require('semver');
    } catch (e) {
        throw("Failed to load dependencies. If using cordova@6 CLI, ensure this plugin is installed with the --fetch option: " + e.toString());
    }

    platformVersion = getCordovaAndroidVersion();
    log("Android platform: " + platformVersion);

    var customVersion;
    try{
        var packageJSON = JSON.parse(fs.readFileSync('./package.json'));
        customVersion = packageJSON.cordova.plugins[PLUGIN_NAME][PLUGIN_VAR];
    }catch(e){
        log("No custom version found in package.json - using plugin default");
    }


    // build.gradle
    if (customVersion) {
        var buildGradlePath = path.resolve(process.cwd(), FILE_PATHS[platformVersion]["build.gradle"]);
        var contents = fs.readFileSync(buildGradlePath).toString();
        fs.writeFileSync(buildGradlePath, contents.replace(PACKAGE_PATTERN, "$1 $2" + customVersion + '"'), 'utf8');
        log("Wrote custom version '" + customVersion + "' to " + buildGradlePath);

        // plugin gradle
        var pluginGradleFolderPath = path.resolve(process.cwd(), PLUGIN_GRADLE_FOLDER_PATH);
        var pluginGradleFileName = fs.readdirSync(pluginGradleFolderPath)[0];
        var pluginGradleFilePath = path.resolve(pluginGradleFolderPath, pluginGradleFileName);
        var pluginGradleFileContents = fs.readFileSync(pluginGradleFilePath).toString();
        pluginGradleFileContents = pluginGradleFileContents.replace(VERSION_PATTERN, VERSION_TEMPLATE.replace(/<VERSION>/, customVersion));
        fs.writeFileSync(pluginGradleFilePath, pluginGradleFileContents, 'utf8');
        log("Wrote custom version '" + customVersion + "' to " + pluginGradleFilePath);
    }
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
    try{
        deferral = require('q').defer();
    }catch(e){
        e.message = 'Unable to load node module dependency \'q\': '+e.message;
        log(e.message);
        throw e;
    }
    attempt(run)();
    return deferral.promise;
};
