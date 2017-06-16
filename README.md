cordova-android-support-gradle-release
======================================

This Cordova/Phonegap plugin for Android aligns various versions of the Android Support libraries specified by other plugins to the latest release (or a specific) version.

<!-- START doctoc generated TOC please keep comment here to allow auto update -->
<!-- DON'T EDIT THIS SECTION, INSTEAD RE-RUN doctoc TO UPDATE -->
**Table of Contents**

- [Purpose](#purpose)
- [Installation](#installation)
- [Different library versions](#different-library-versions)
  - [Default version](#default-version)
  - [Other versions](#other-versions)
- [Example cases](#example-cases)
  - [Example 1](#example-1)
  - [Example 2](#example-2)
- [License](#license)

<!-- END doctoc generated TOC please keep comment here to allow auto update -->
 
# Purpose

**TL;DR**: To prevent build failures caused by including different versions of the support libraries. 

Some Cordova plugins include [Android Support Libraries](https://developer.android.com/topic/libraries/support-library/index.html) to faciliate them.
Most commonly, these are now included into the Cordova project by specifying them as Gradle dependencies (see the [Cordova plugin spec documenation](https://cordova.apache.org/docs/en/latest/plugin_ref/spec.html#framework)).

Example plugins:
- [cordova-diagnostic-plugin](https://github.com/dpa99c/cordova-diagnostic-plugin)
- [Telerik ImagePicker plugin](https://github.com/Telerik-Verified-Plugins/ImagePicker)
- [cordova-plugin-local-notifications](https://github.com/katzer/cordova-plugin-local-notifications/)
- [cordova-plugin-facebook4](https://github.com/jeduan/cordova-plugin-facebook4)

The problem arises when these plugins specify different versions of the support libraries. This can cause build failures to occur, which are not easy to resolve without changes by the plugin authors to align the specified versions. See these issues:

- [phonegap-plugin-barcodescanner#480](https://github.com/phonegap/phonegap-plugin-barcodescanner/issues/480)
- [cordova-plugin-facebook4#507](https://github.com/jeduan/cordova-plugin-facebook4/issues/507)
- [cordova-plugin-local-notifications#1322](https://github.com/katzer/cordova-plugin-local-notifications/issues/1322)
- [cordova-diagnostic-plugin#211](https://github.com/dpa99c/cordova-diagnostic-plugin/issues/211)

To resolve these version collisions, this plugin injects a Gradle configuration file into the native Android platform project, which overrides any versions specified by other plugins, and forces them to the version specified in its Gradle file.

# Installation

    $ cordova plugin add cordova-android-support-gradle-release
    
Just install the plugin and that's it. It should fix should build.

# Different library versions

## Default version
By default, the `master` branch of this repo and corresponding npm release, will be made to specify the most major version of the most recent release of the support libraries - [see here](https://developer.android.com/topic/libraries/support-library/revisions.html) for a list recent versions. "Most recent release" means the highest major version that will not result in an Alpha or Beta version being included.

For example, if the most recent versions are:
- `26.0.0 Beta 2`
- `25.4.0`

Then this plugin will default to `25.+` because `26` is still in Beta.

## Other versions

In some cases, you may want to specify a different version of the support libraries. For example, [Telerik ImagePicker plugin v2.1.7](https://github.com/Telerik-Verified-Plugins/ImagePicker/tree/2.1.7) specifies `v23` because it contains code that is incompatible with `v24+`. 

In this case, including the default version of this plugin will still result in a build error. So this plugin provides branches for various older major versions of the support libraries.
 
In the above case, you'd want to install the [v23 branch](https://github.com/dpa99c/cordova-android-support-gradle-release/tree/v23) of this plugin which specifies support library versions of v23.
Because Cordova doesn't support tags in plugins sourced from npm, you'll need to install this version directly from the git repo:

    cordova plugin add https://github.com/dpa99c/cordova-android-support-gradle-release#v23
    
The following branches currently exist:
    
- [master](https://github.com/dpa99c/cordova-android-support-gradle-release) (default)
    - The most recent major release
    - Currently uses `25.+`
    - Install with: `cordova plugin add cordova-android-support-gradle-release`
    - Or: `https://github.com/dpa99c/cordova-android-support-gradle-release`
- [edge](https://github.com/dpa99c/cordova-android-support-gradle-release/tree/edge)
    - The most recent bleeding-edge release
    - Uses `+`
    - Install with: `cordova plugin add https://github.com/dpa99c/cordova-android-support-gradle-release#edge`
- [v25](https://github.com/dpa99c/cordova-android-support-gradle-release/tree/v25)
    - The highest v25 version
    - Uses `25.+`
    - Install with: `cordova plugin add https://github.com/dpa99c/cordova-android-support-gradle-release#v25`
- [v24](https://github.com/dpa99c/cordova-android-support-gradle-release/tree/v24)
    - The highest v24 version
    - Uses `24.+`
    - Install with: `cordova plugin add https://github.com/dpa99c/cordova-android-support-gradle-release#v24`
- [v23](https://github.com/dpa99c/cordova-android-support-gradle-release/tree/v23)
    - The highest v23 version
    - Uses `23.+`
    - Install with: `cordova plugin add https://github.com/dpa99c/cordova-android-support-gradle-release#v23`
- [v22](https://github.com/dpa99c/cordova-android-support-gradle-release/tree/v22)
    - The highest v22 version
    - Uses `22.+`
    - Install with: `cordova plugin add https://github.com/dpa99c/cordova-android-support-gradle-release#v22`
    
# Example cases

## Example 1

Forces the latest release version of the support libraries to fix the build issue.

1. `cordova create test1 && cd test1/`
2. `cordova platform add android@latest`
3. `cordova plugin add cordova-plugin-facebook4@1.9.1 --save --variable APP_ID="123456789" --variable APP_NAME="myApplication"`
4. `cordova compile`

Observe the build succeeds and in the console output is `v25.3.1` of Android Support Library:

    :prepareComAndroidSupportSupportV42531Library

5. `cordova plugin add de.appplant.cordova.plugin.local-notification@0.8.5`
6. `cordova compile`

Observe the build failed and in the console output is higher than `v25.3.1` (e.g `v26.0.0-alpha1`) of Android Support Library:

    :prepareComAndroidSupportSupportV42600Alpha1Library

7. `cordova plugin add cordova-android-support-gradle-release`
8. `cordova compile`    

Observe the build succeeds and in the console output is latest release version of Android Support Library.

## Example 2

Forces the v23 version of the support libraries to fix the build issue, because v2.1.7 of the ImagePicker only works with v23.

1. `cordova create test2 && cd test2/`
2. `cordova platform add android@latest`
3. `cordova plugin add https://github.com/Telerik-Verified-Plugins/ImagePicker.git#2.1.7`
4. `cordova compile`

Observe the build succeeds and in the console output is `v23.4.0` of Android Support Library:

    :prepareComAndroidSupportSupportV42340Library
    
5. `cordova plugin add cordova.plugins.diagnostic@3.6.5`

Observe the build failed and in the console output is higher than `v23.4.0` (e.g `v26.0.0-alpha1`) of Android Support Library:

    :prepareComAndroidSupportSupportV42600Alpha1Library
    
7. `cordova plugin add cordova-android-support-gradle-release`
8. `cordova compile`

Observe the build still failed and in the console output is still higher than `v23.4.0` (e.g `v25.3.1`) of Android Support Library:

    :prepareComAndroidSupportSupportV42531Library
    
9. `cordova plugin rm cordova-android-support-gradle-release`
10. `cordova plugin add https://github.com/dpa99c/cordova-android-support-gradle-release#v23`
11. `cordova compile`

License
================

The MIT License

Copyright (c) 2017 Dave Alden / Working Edge Ltd.

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.