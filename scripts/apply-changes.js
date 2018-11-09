const PLUGIN_NAME = "cordova-android-support-gradle-release";
const PACKAGE_PATTERN = /(compile "com.android.support:[^:]+:)([^"]+)"/g;
const PROPERTIES_TEMPLATE = 'ext {ANDROID_SUPPORT_VERSION = "<VERSION>"}';

var V6 = "V6";
var V7_OLD = "V7.0.0-7.1.1";
var V7_NEW = "V7.1.2+";

var FILE_PATHS = {};
FILE_PATHS[V6] = {
    "build.gradle": "platforms/android/build.gradle",
    "properties.gradle": "platforms/android/"+PLUGIN_NAME+"/properties.gradle"
};
FILE_PATHS[V7_OLD] = {
    "build.gradle": "platforms/android/app/build.gradle",
    "properties.gradle": "platforms/android/app/"+PLUGIN_NAME+"/properties.gradle"
};
FILE_PATHS[V7_NEW] = {
    "build.gradle": "platforms/android/app/build.gradle",
    "properties.gradle": "platforms/android/app/src/main/"+PLUGIN_NAME+"/properties.gradle"
};

var deferral, fs, path, parser, platformVersion, semver;


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
    }else if(semver.satisfies(cordovaVersion, '7.0.0 - 7.1.1')){
        return V7_OLD;
    }
    return V7_NEW;
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

    var data = fs.readFileSync(path.resolve(process.cwd(), 'config.xml'));
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

            // properties.gradle
            var propertiesGradlePath = path.resolve(process.cwd(), FILE_PATHS[platformVersion]["properties.gradle"]);
            fs.writeFileSync(propertiesGradlePath, PROPERTIES_TEMPLATE.replace(/<VERSION>/, version), 'utf8');
            log("Wrote custom version '" + version + "' to " + propertiesGradlePath);
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
