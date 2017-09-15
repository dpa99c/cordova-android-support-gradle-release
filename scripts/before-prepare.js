var fs      = require ('fs');
var path    = require('path');
var parser  = require('xml2js');

const PLUGIN_NAME         = "cordova-android-support-gradle-release";
const GRADLE_FILENAME     = path.resolve(process.cwd(), 'platforms', 'android', PLUGIN_NAME, 'properties.gradle');
const PROPERTIES_TEMPLATE = 'ext {ANDROID_SUPPORT_VERSION = "<VERSION>"}'

// 1. Parse cordova.xml file and fetch this plugin's <variable name="ANDROID_SUPPORT_VERSION" />
fs.readFile(path.resolve(process.cwd(), 'config.xml'), function(err, data) {
  var json = parser.parseString(data, function(err, result) {
    if (err) {
      return console.log(PLUGIN_NAME, " ERROR: ", err);
    }
    var plugins = result.widget.plugin;
    if(!plugins || plugins.length === 0) return;
    for (var n=0,len=plugins.length;n<len;n++) {
      var plugin = plugins[n];
      if (plugin.$.name === PLUGIN_NAME) {
        if (!plugin.variable.length) { 
          return console.log(PLUGIN_NAME, ' ERROR: FAILED TO FIND <variable name="ANDROID_SUPPORT_VERSION" /> in config.xml');
        }
        // 2.  Update .gradle file.
        setGradleVersion(plugin.variable.pop().$.value);
        break;
      }
    }
  });
});

/**
* Write properties.gradle with:
*
ext {
  ANDROID_SUPPORT_VERSION = '<VERSION>'
}
*
*/
function setGradleVersion(version) {
  console.log(PLUGIN_NAME, " ANDROID_SUPPORT_VERSION: ", version);
  fs.writeFile(GRADLE_FILENAME, PROPERTIES_TEMPLATE.replace(/<VERSION>/, version), 'utf8', function (err) {
     if (err) return console.log(PLUGIN_NAME, " FAILED TO WRITE ", GRADLE_FILENAME, " > ", ANDROID_SUPPORT_VERSION, err);
  });
}





