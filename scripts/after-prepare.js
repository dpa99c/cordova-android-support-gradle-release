const PLUGIN_NAME = "cordova-android-support-gradle-release";
const SCRIPT_NAME = "after-prepare";
const V6 = "cordova-android@6";
const V7 = "cordova-android@7";

var FILE_PATHS = {};
FILE_PATHS[V6] = {
    "build.gradle": "platforms/android/build.gradle"
};
FILE_PATHS[V7] = {
    "build.gradle": "platforms/android/app/build.gradle"
};

var deferral, fs, path, parser, platformVersion;


function log(message) {
    console.log(PLUGIN_NAME + "." + SCRIPT_NAME + ": " + message);
}

function onError(error) {
    log("ERROR: " + error);
    deferral.resolve();
}

function getCordovaAndroidVersion(){
    var testPath = path.join(process.cwd(), 'platforms/android/app/src');
    return fs.existsSync(testPath) ? V7 : V6;
}


function run() {
    try {
        fs = require('fs');
        path = require('path');
        parser = require('xml2js');
    } catch (e) {
        throw("Failed to load dependencies. If using cordova@6 CLI, ensure this plugin is installed with the --fetch option: " + e.toString());
    }

    platformVersion = getCordovaAndroidVersion();
    log("Android platform: " + platformVersion);

    const GRADLE_FILENAME = path.resolve(process.cwd(), FILE_PATHS[platformVersion]["build.gradle"]);
    const PACKAGE_PATTERN = /(compile "com.android.support:[^:]+:)([^"]+)"/;

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
            var contents = fs.readFileSync(GRADLE_FILENAME).toString();
            fs.writeFileSync(GRADLE_FILENAME, contents.replace(PACKAGE_PATTERN, "$1" + version + '"'), 'utf8');
            log("Wrote custom version '" + version + "' to " + GRADLE_FILENAME);
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
