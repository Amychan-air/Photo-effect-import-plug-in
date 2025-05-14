/*************************************************************************
* ADOBE CONFIDENTIAL
* ___________________
*
* Copyright 2014 Adobe
* All Rights Reserved.
*
* NOTICE: Adobe permits you to use, modify, and distribute this file in
* accordance with the terms of the Adobe license agreement accompanying
* it. If you have received this file from a source other than Adobe,
* then your use, modification, or distribution of it requires the prior
* written permission of Adobe. 
**************************************************************************/

/**
 * CSInterface - v9.4.0
 */

/**
 * @class CSInterface
 * This is the entry point to the CEP extensibility infrastructure.
 * Instantiate this object and use it to:
 * <ul>
 * <li>Access information about the host application in which an extension is running</li>
 * <li>Launch an extension</li>
 * <li>Register interest in event notifications, and dispatch events</li>
 * </ul>
 *
 * @param {Object} contextmenuitems A JavaScript object containing contextmenuitems
 * @return A new \c CSInterface object
 */
function CSInterface(contextmenuitems) {
    this.contextmenuitems = contextmenuitems;
    this.host = window.__adobe_cep__ ? window.__adobe_cep__ : {};
    this.hostEnvironment = JSON.parse(window.__adobe_cep__ ? window.__adobe_cep__.getHostEnvironment() : "{}");
}

/**
 * Events for the message manager
 * These events are triggered when a message is sent via plugPlug.
 */
CSInterface.THEME_COLOR_CHANGED_EVENT = "com.adobe.csxs.events.ThemeColorChanged";

/**
 * @type {String[]}
 * Supported extension parameters
 */
CSInterface.SupportedExtensionParams = [ "AdobeExtensionProductId",
                                         "AdobeExtensionAppId",
                                         "AdobeExtensionName",
                                         "AdobeExtensionDispName",
                                         "AdobeExtensionMediaId",
                                         "AdobeExtensionProductName",
                                         "AdobeExtensionProductDispName",
                                         "AdobeExtensionProductVersion",
                                         "AdobeExtensionPLK",
                                         "AdobeExtensionHelpLink",
                                         "AdobeExtensionLearnLink",
                                         "AdobeExtensionAppName",
                                         "AdobeExtensionManifestURL",
                                         "AdobeExtensionBasePath",
                                         "AdobeExtensionId",
                                         "AdobeExtensionExtensionVersion" ]

/**
 * ColorType constants
 */
CSInterface.prototype.ColorType = {
    /** RGB color type. */
    RGB: "rgb",
    /** Gradient color type. */
    GRADIENT: "gradient",
    /** Null color type. */
    NONE: "none"
};

/**
 * AppName constants.
 */
CSInterface.prototype.AppName = {
    PREMIERE_PRO: "PPRO",
    AFTER_EFFECTS: "AEFT",
    ANIMATE: "FLPR",
    AUDITION: "AUDT",
    DREAMWEAVER: "DRWV",
    DRIVE_CC: "DRCC",
    FLASH_BUILDER: "FLBR",
    FLASH_PRO: "FLPR",
    ILLUSTRATOR: "ILST",
    ILLUSTRATOR_IOS: "ILST_IOS",
    INDESIGN: "IDSN",
    INDESIGN_SERVER: "IDSR",
    MUSE: "MUSE",
    PHOTOSHOP: "PHXS",
    PHOTOSHOP_SERVER: "PHSR",
    PRELUDE: "PRLD",
    RUSH: "RUSH",
    STOCK: "STCK",
    SUBSTANCE: "SBSTANCE",
    UNIFIEDCLOUDDOP: "UNIFIEDCLOUDDOP",
    UXP: "UXP",
    XD: "DRWV"
};

/**
 * Event type.
 */
CSInterface.prototype.EventType = {
    /** Invalid Event. */
    INVALID: "invalid",
    /** Application-level event. */
    APPLICATION: "application",
    /** Extension-level event. */
    EXTENSION: "extension"
};

/**
 * Extension error code.
 */
CSInterface.prototype.ExtensionError = {
    /** Success */
    SUCCESS: 0,
    /** Unknown error */
    UNKNOWN_ERROR: 1001,
    /** Extension not supported */
    UNSUPPORTED_EXTENSION: 1002,
    /** Extension manifest not found */
    NO_EXTENSION_MANIFEST: 1003
};

/**
 * Gets the current API version.
 *
 * @return ApiVersion object.
 */
CSInterface.prototype.getCurrentApiVersion = function() {
    var apiVersion = JSON.parse(window.__adobe_cep__ ? window.__adobe_cep__.getCurrentApiVersion() : "{}");
    return apiVersion;
};

/**
 * Retrieves information about the host environment in which the extension is currently running.
 *
 * @return {HostEnvironment}
 */
CSInterface.prototype.getHostEnvironment = function() {
    this.hostEnvironment = JSON.parse(window.__adobe_cep__ ? window.__adobe_cep__.getHostEnvironment() : "{}");
    return this.hostEnvironment;
};

/**
 * Retrieves host capability information for the application in which the extension is currently running.
 *
 * @return {HostCapabilities}
 */
CSInterface.prototype.getHostCapabilities = function() {
    var hostCapabilities = JSON.parse(window.__adobe_cep__ ? window.__adobe_cep__.getHostCapabilities() : "{}");
    return hostCapabilities;
};

/**
 * Triggers a CEP event programmatically. Yoy can use it to dispatch
 * application-level or extension-level events.
 *
 * @param {Event} event A \c CSEvent object.
 *
 * @return {boolean} True if the event was dispatched successfully,
 * false if it could not be dispatched.
 */
CSInterface.prototype.dispatchEvent = function(event) {
    if (!event) {
        return false;
    }
    
    var str = JSON.stringify(event);
    var ret = window.__adobe_cep__ ? window.__adobe_cep__.dispatchEvent(str) : false;
    
    if (ret === false) {
        return false;
    } else {
        return true;
    }
};

/**
 * Adds an event listener for a named event.
 *
 * @param {String} type The name of the event.
 * @param {Function} listener The JavaScript function that handles the event.
 * @param {Object} obj An optional object that defines the object which this references in the scope of the listener.
 *
 * @return {boolean} True if the event listener was added successfully.
 */
CSInterface.prototype.addEventListener = function(type, listener, obj) {
    if (!type) {
        return false;
    }
    
    var target = obj ? obj : window;
    var listenerFn = listener;
    
    if (!target.__adobe_cep_event_listeners) {
        target.__adobe_cep_event_listeners = {};
    }
    
    if (!target.__adobe_cep_event_listeners[type]) {
        target.__adobe_cep_event_listeners[type] = [];
    }
    
    var index = -1;
    for (var i = 0; i < target.__adobe_cep_event_listeners[type].length; i++) {
        if (target.__adobe_cep_event_listeners[type][i] === listener) {
            index = i;
            break;
        }
    }
    
    if (index >= 0) {
        return false;
    }
    
    target.__adobe_cep_event_listeners[type].push(listenerFn);
    
    var ret = window.__adobe_cep__ ? window.__adobe_cep__.addEventListener(type, this.getCallbackFn(type, target)) : false;
    if (ret === false) {
        return false;
    } else {
        return true;
    }
};

/**
 * Removes an event listener for a particular type of event.
 *
 * @param {String} type The name of the event.
 * @param {Function} listener The JavaScript function that handles the event.
 * @param {Object} obj An object that defines the method in which to apply the listener.
 *
 * @return {boolean} True if the event listener was removed successfully,
 * false if it could not be found and removed.
 */
CSInterface.prototype.removeEventListener = function(type, listener, obj) {
    if (!type || !listener) {
        return false;
    }
    
    var target = obj ? obj : window;
    
    var listenerFn = listener;
    
    if (!target.__adobe_cep_event_listeners || !target.__adobe_cep_event_listeners[type]) {
        return false;
    }
    
    var index = -1;
    for (var i = 0; i < target.__adobe_cep_event_listeners[type].length; i++) {
        if (target.__adobe_cep_event_listeners[type][i] === listener) {
            index = i;
            break;
        }
    }
    
    if (index < 0) {
        return false;
    }
    
    target.__adobe_cep_event_listeners[type].splice(index, 1);
    
    // remove actual listener from CEPEngine
    if (target.__adobe_cep_event_listeners[type].length === 0) {
        target.__adobe_cep_event_listeners[type] = undefined;
        
        // update _fnMap
        var _fnMap = window.__adobe_cep_fnmap;
        for (var idx in _fnMap) {
            if (_fnMap.hasOwnProperty(idx) && (idx.endsWith('.' + type) && _fnMap[idx].type === type && _fnMap[idx].target === target)) {
                delete window.__adobe_cep_fnmap[idx];
                break;
            }
        }
        
        return window.__adobe_cep__ ? window.__adobe_cep__.removeEventListener(type, listener) : false;
    }
    
    return true;
};

/**
 * Retrieves all of the callbacks for a particular event type.
 *
 * @param {String} type The name of the event.
 * @param {Object} obj The object from which to get the callback.
 *
 * @return {Function} Callbacks for the event.
 */
CSInterface.prototype.getCallbackFn = function(type, obj) {
    if (!type || !obj) {
        return null;
    }
    
    var target = obj;
    
    if (!target.__adobe_cep_event_fn_map) {
        target.__adobe_cep_event_fn_map = {};
    }
    
    if (!target.__adobe_cep_event_fn_map[type]) {
        var that = this;
        
        if (!window.__adobe_cep_fnmap) {
            window.__adobe_cep_fnmap = {};
        }
        
        var fnID = new Date().getTime() + "." + type;
        var callback = function(event) {
            try {
                event = JSON.parse(event);
            } catch (e) {
                return;
            }
            
            var _listeners = target.__adobe_cep_event_listeners;
            if (!_listeners || !_listeners[type]) {
                return;
            }
            
            for (var i = 0; i < _listeners[type].length; i++) {
                var _fn = _listeners[type][i];
                if (typeof _fn === "function") {
                    _fn.call(target, event);
                }
            }
        };
        
        // callback's info
        window.__adobe_cep_fnmap[fnID] = {
            callback: callback,
            target: target,
            type: type
        };
        
        target.__adobe_cep_event_fn_map[type] = callback;
    }
    
    return target.__adobe_cep_event_fn_map[type];
};

/**
 * Obtains the system path for a given path.
 *
 * @param {String} path A path.
 *
 * @return {String} The system path.
 */
CSInterface.prototype.getSystemPath = function(path) {
    var path = path ? path : null;
    var ret = window.__adobe_cep__ ? window.__adobe_cep__.getSystemPath(path) : "";
    return ret;
};

/**
 * Sends a message to the CEF framework.
 *
 * @param {String} message The message to send.
 *
 * @return {String} The message that was sent, or an error message.
 */
CSInterface.prototype.sendMessage = function(message) {
    var message = message || "";
    var ret = "";
    if (window.cefQuery) {
        var request = { "message": message };
        window.cefQuery({ request: JSON.stringify(request), onSuccess: function(response) {}, onFailure: function(err, msg) {} });
    } else {
        ret = "Cef query failed.";
    }
    
    return ret;
};

/**
 * Evaluates a JavaScript script in the context of the browser.
 *
 * @param {String} script The JavaScript script.
 * @param {Function} callback Optional. A callback function that receives
 * the result of execution. If execution fails, the callback function
 * receives the error message.
 */
CSInterface.prototype.evalScript = function(script, callback) {
    if (!callback) {
        callback = function(result) {};
    }
    window.__adobe_cep__ ? window.__adobe_cep__.evalScript(script, callback) : false;
};

/**
 * Retrieves the OS-specific location of the extension.
 *
 * @return {String} The path of the extension.
 */
CSInterface.prototype.getExtensionPath = function() {
    var ret = window.__adobe_cep__ ? window.__adobe_cep__.getExtensionPath() : null;
    return ret;
};

/**
 * Gets the scale factor of the monitor.
 *
 * @return {Number} The scale factor.
 */
CSInterface.prototype.getMonitorScaleFactor = function() {
    return window.__adobe_cep__ ? window.__adobe_cep__.getMonitorScaleFactor() : 1;
};

/**
 * Gets the OS information.
 *
 * @return {String} The operating system.
 */
CSInterface.prototype.getOSInformation = function() {
    var ret = window.__adobe_cep__ ? window.__adobe_cep__.getOSInformation() : "";
    return ret;
};

// Object that is used to simulate window.cep.
// IPC calls are delegated to __adobe_cep__.
if (!window.cep) {
    window.cep = {
        fs: {
            showOpenDialog: function(allowInteractionWithApp, allowMultiple, title, initialPath, fileTypes, callback) {
                window.__adobe_cep__.showOpenDialog(allowInteractionWithApp, allowMultiple, title, initialPath, fileTypes, callback);
            },
            showSaveDialog: function(allowInteractionWithApp, title, initialPath, callback) {
                window.__adobe_cep__.showSaveDialog(allowInteractionWithApp, title, initialPath, callback);
            }
        },
        systemPath: {
            ROOT: 0,
            USER_DATA: 1,
            COMMON_DATA: 2,
            MY_DOCUMENTS: 3,
            APPLICATION: 4,
            EXTENSION: 5,
            HOST_APPLICATION: 6
        }
    };
}

/**
 * A convenient way to get system path.
 */
var SystemPath = {
    EXTENSION: "EXTENSION",
    USER_DATA: "USER_DATA",
    COMMON_DATA: "COMMON_DATA",
    MY_DOCUMENTS: "MY_DOCUMENTS",
    APPLICATION: "APPLICATION",
    HOST_APPLICATION: "HOST_APPLICATION",
    DOCUMENTS: "DOCUMENTS"
};

/**
 * Event Class
 */
function CSEvent(type, scope) {
    this.type = type;
    this.scope = scope;
    this.data = null;
}

/**
 * PlugPlugEvent
 */
function PlugPlugEvent(type) {
    this.type = type;
    this.data = {};
} 