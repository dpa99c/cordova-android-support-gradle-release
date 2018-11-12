var PLUGIN_NAME = "cordova-android-support-gradle-release";
var PACKAGE_PATTERN = /(compile "com.android.support:[^:]+:)([^"]+)"/g;
var PLUGIN_GRADLE_FOLDER_PATH = "platforms/android/"+PLUGIN_NAME;
var VERSION_PATTERN = /def ANDROID_SUPPORT_VERSION = "[^"]+"/;
var VERSION_TEMPLATE = "def ANDROID_SUPPORT_VERSION = \"<VERSION>\"";

var V6 = "V6";
var V7 = "V7+";

var FILE_PATHS = {};
FILE_PATHS[V6] = {
    "build.gradle": "platforms/android/build.gradle"
};
FILE_PATHS[V7] = {
    "build.gradle": "platforms/android/app/build.gradle"
};

var deferral, fs, path, parser, semver,
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
    if(semver.satisfies(cordovaVersion, "6")){
        return V6;
    }
    return V7;
}

function run() {
    try {
        fs = require('fs');
        path = require('path');
        parser = require('xml2js');
        semver = require('semver');
    } catch (e) {
        throw("Failed to load dependencies. If using cordova@6 CLI, ensure this plugin is installed with the --fetch option: " + e.toString());
    }

    platformVersion = getCordovaAndroidVersion();
    log("Android platform: " + platformVersion);

    // Read config.xml
    var configXmlFilePath = path.resolve(process.cwd(), 'config.xml');
    if(!fs.existsSync(configXmlFilePath)){
        configXmlFilePath = path.resolve(process.cwd(), 'www/config.xml');
    }
    if(!fs.existsSync(configXmlFilePath)){
        throw "Failed to find config.xml if project root or www/";
    }

    var data = fs.readFileSync(configXmlFilePath);
    parser.parseString(data, attempt(function (err, result) {
        if (err) throw err;
        var version, plugins = result.widget.plugin;
        for (var n = 0, len = plugins.length; n < len; n++) {
            var plugin = plugins[n];
            if (plugin.$.name === PLUGIN_NAME && plugin.variable && plugin.variable.length > 0) {
                version = plugin.variable.pop().$.value;
                break;
            }
        }
        if (version) {
            // build.gradle
            var buildGradlePath = path.resolve(process.cwd(), FILE_PATHS[platformVersion]["build.gradle"]);
            var contents = fs.readFileSync(buildGradlePath).toString();
            fs.writeFileSync(buildGradlePath, contents.replace(PACKAGE_PATTERN, "$1" + version + '"'), 'utf8');
            log("Wrote custom version '" + version + "' to " + buildGradlePath);

            // plugin gradle
            var pluginGradleFolderPath = path.resolve(process.cwd(), PLUGIN_GRADLE_FOLDER_PATH);
            var pluginGradleFileName = fs.readdirSync(pluginGradleFolderPath)[0];
            var pluginGradleFilePath = path.resolve(pluginGradleFolderPath, pluginGradleFileName);
            var pluginGradleFileContents = fs.readFileSync(pluginGradleFilePath).toString();
            pluginGradleFileContents = pluginGradleFileContents.replace(VERSION_PATTERN, VERSION_TEMPLATE.replace(/<VERSION>/, version));
            fs.writeFileSync(pluginGradleFilePath, pluginGradleFileContents, 'utf8');
            log("Wrote custom version '" + version + "' to " + pluginGradleFilePath);
        } else {
            log("No custom version found in config.xml - using plugin default");
        }
        deferral.resolve();
    }));
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
