/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

// 确保jQuery可用
if (typeof jQuery !== 'undefined' && typeof $ === 'undefined') {
    window.$ = jQuery;
    console.log("已手动设置$符号在ext.js中");
}

// 确保CSInterface可用
var csInterface;

function onLoaded () {
	try {
		csInterface = new CSInterface();
		var env = csInterface.hostEnvironment;
		
		loadJSX();
		
		updateThemeWithAppSkinInfo(csInterface.hostEnvironment.appSkinInfo);

		// Update the color of the panel when the theme color of the product changed.
		csInterface.addEventListener(CSInterface.THEME_COLOR_CHANGED_EVENT, onAppThemeColorChanged);

		// 初始化默认图像文件夹
		initializeDefaultImageFolder();

		// 图像序列导入功能的监听器
		$("#importImageSequence").on("click", function (e) {
			e.preventDefault();
			var csInterface = new CSInterface();
			csInterface.evalScript('$._PPP_.selectImageSequenceFolder()', function(result) {
				if (result && result !== "[未选择文件夹]") {
					document.getElementById("imageSequencePath").innerHTML = result;
				}
			});
		});

		$("#previewImageSequence").on("click", function (e) {
			e.preventDefault();
			var csInterface = new CSInterface();
			var folderPath = document.getElementById("imageSequencePath").innerHTML;
			
			if (folderPath === "[未选择文件夹]") {
				alert("请先选择图像文件夹！");
				return;
			}
			
			var frameRate = document.getElementById("frameRate").value;
			var sortOrder = document.getElementById("sortOrder").value;
			
			var params = folderPath + ";" + frameRate + ";" + sortOrder;
			csInterface.evalScript('$._PPP_.previewImageSequence("' + params + '")', function(result) {
				// 显示操作结果
				if (result) {
					alert(result);
				}
			});
		});

		csInterface.evalScript("$._PPP_.getVersionInfo()", myVersionInfoFunction);
		csInterface.evalScript("$._PPP_.keepPanelLoaded()");
	} catch (e) {
		console.error("加载错误: " + e.message);
		if (document.getElementById("debug-info")) {
			document.getElementById("debug-info").innerHTML += "<div class='error'><strong>初始化错误:</strong> " + e.message + "</div>";
		}
	}
}

// 初始化默认图像文件夹
function initializeDefaultImageFolder() {
	try {
		var csInterface = new CSInterface();
		csInterface.evalScript('$._PPP_.getDefaultImageFolder()', function(result) {
			if (result && result !== "[默认文件夹创建失败]") {
				document.getElementById("imageSequencePath").innerHTML = result;
			} else {
				document.getElementById("imageSequencePath").innerHTML = "[未选择文件夹]";
			}
		});
	} catch (e) {
		console.error("初始化默认文件夹错误: " + e.message);
	}
}

function myVersionInfoFunction (data) {
	var v_string = document.getElementById("version_string");
	v_string.innerHTML = data;
}

/**
 * Update the theme with the AppSkinInfo retrieved from the host product.
 */
function updateThemeWithAppSkinInfo(appSkinInfo) {
	try {
		//Update the background color of the panel
		var panelBackgroundColor = appSkinInfo.panelBackgroundColor.color;
		document.body.bgColor = toHex(panelBackgroundColor);

		var styleId = "ppstyle";
		var gradientBg = "background-image: -webkit-linear-gradient(top, " + toHex(panelBackgroundColor, 40) + " , " + toHex(panelBackgroundColor, 10) + ");";
		var gradientDisabledBg = "background-image: -webkit-linear-gradient(top, " + toHex(panelBackgroundColor, 15) + " , " + toHex(panelBackgroundColor, 5) + ");";
		var boxShadow = "-webkit-box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 1px 1px rgba(0, 0, 0, 0.2);";
		var boxActiveShadow = "-webkit-box-shadow: inset 0 1px 4px rgba(0, 0, 0, 0.6);";

		var isPanelThemeLight = panelBackgroundColor.red > 50; // choose your own sweet spot
		var fontColor, disabledFontColor, borderColor, inputBackgroundColor, gradientHighlightBg;

		if(isPanelThemeLight) {
			fontColor = "#000000;";
			disabledFontColor = "color:" + toHex(panelBackgroundColor, -70) + ";";
			borderColor = "border-color: " + toHex(panelBackgroundColor, -90) + ";";
			inputBackgroundColor = toHex(panelBackgroundColor, 54) + ";";
			gradientHighlightBg = "background-image: -webkit-linear-gradient(top, " + toHex(panelBackgroundColor, -40) + " , " + toHex(panelBackgroundColor,-50) + ");";
		} else {
			fontColor = "#ffffff;";
			disabledFontColor = "color:" + toHex(panelBackgroundColor, 100) + ";";
			borderColor = "border-color: " + toHex(panelBackgroundColor, -45) + ";";
			inputBackgroundColor = toHex(panelBackgroundColor, -20) + ";";
			gradientHighlightBg = "background-image: -webkit-linear-gradient(top, " + toHex(panelBackgroundColor, -20) + " , " + toHex(panelBackgroundColor, -30) + ");";
		}
		
		//Update the default text style with pp values
		addRule(styleId, ".default", "font-size:" + appSkinInfo.baseFontSize + "px" + "; color:" + fontColor + "; background-color:" + toHex(panelBackgroundColor) + ";");
		addRule(styleId, "button, select, input[type=text], input[type=button], input[type=submit]", borderColor);	   
		addRule(styleId, "p", "color:" + fontColor + ";");	  
		addRule(styleId, "h1", "color:" + fontColor + ";");	  
		addRule(styleId, "h2", "color:" + fontColor + ";");	  
		addRule(styleId, "button", "font-family: " + appSkinInfo.baseFontFamily + ", Arial, sans-serif;");	  
		addRule(styleId, "button", "color:" + fontColor + ";");	   
		addRule(styleId, "button", "font-size:" + (1.2 * appSkinInfo.baseFontSize) + "px;");	
		addRule(styleId, "button, select, input[type=button], input[type=submit]", gradientBg);	
		addRule(styleId, "button, select, input[type=button], input[type=submit]", boxShadow);
		addRule(styleId, "button:enabled:active, input[type=button]:enabled:active, input[type=submit]:enabled:active", gradientHighlightBg);
		addRule(styleId, "button:enabled:active, input[type=button]:enabled:active, input[type=submit]:enabled:active", boxActiveShadow);
		addRule(styleId, "[disabled]", gradientDisabledBg);
		addRule(styleId, "[disabled]", disabledFontColor);
		addRule(styleId, "input[type=text]", "padding:1px 3px;");
		addRule(styleId, "input[type=text]", "background-color: " + inputBackgroundColor + ";");
		addRule(styleId, "input[type=text]:focus", "background-color: #ffffff;");
		addRule(styleId, "input[type=text]:focus", "color: #000000;");
	} catch(e) {
		console.error("更新主题出错: " + e.message);
	}
}

function addRule(stylesheetId, selector, rule) {
	var stylesheet = document.getElementById(stylesheetId);
	if (stylesheet) {
		stylesheet = stylesheet.sheet;
		if( stylesheet.addRule ) {
			stylesheet.addRule(selector, rule);
		} else if( stylesheet.insertRule ) {
			stylesheet.insertRule(selector + " { " + rule + " }", stylesheet.cssRules.length);
		}
	}
}

function computeValue(value, delta) {
	var computedValue = !isNaN(delta) ? value + delta : value;
	if (computedValue < 0) {
		computedValue = 0;
	} else if (computedValue > 255) {
		computedValue = 255;
	}

	computedValue = Math.round(computedValue).toString(16);
	return computedValue.length == 1 ? "0" + computedValue : computedValue;
}

function toHex(color, delta) {
	var hex = "";
	if (color) {
		hex = computeValue(color.red, delta) + computeValue(color.green, delta) + computeValue(color.blue, delta);
	}
	return "#" + hex;
}

function onAppThemeColorChanged(event) {
	try {
		// Should get a latest HostEnvironment object from application.
		var skinInfo = JSON.parse(window.__adobe_cep__.getHostEnvironment()).appSkinInfo;
		// Gets the style information such as color info from the skinInfo, 
		// and redraw all UI controls of your extension according to the style info.
		updateThemeWithAppSkinInfo(skinInfo);
	} catch(e) {
		console.error("主题变更处理错误: " + e.message);
	}
} 

/**
* Load JSX file into the scripting context of the product. All the jsx files in 
* folder [ExtensionRoot]/jsx & [ExtensionRoot]/jsx/[AppName] will be loaded.
*/
function loadJSX() {
	try {
		var csInterface = new CSInterface();

		// get the appName of the currently used app. For Premiere Pro it's "PPRO"
		var appName = csInterface.hostEnvironment.appName;
		var extensionPath = csInterface.getSystemPath(SystemPath.EXTENSION);

		// load general JSX script independent of appName
		var extensionRootGeneral = extensionPath + "/jsx/";
		csInterface.evalScript("$._ext.evalFiles(\"" + extensionRootGeneral + "\")");

		// load JSX scripts based on appName
		var extensionRootApp = extensionPath + "/jsx/" + appName + "/";
		csInterface.evalScript("$._ext.evalFiles(\"" + extensionRootApp + "\")");
		
		console.log("JSX文件加载完成");
	} catch(e) {
		console.error("加载JSX文件出错: " + e.message);
		if (document.getElementById("debug-info")) {
			document.getElementById("debug-info").innerHTML += "<div class='error'><strong>JSX加载错误:</strong> " + e.message + "</div>";
		}
	}
}

function evalScript(script, callback) {
	try {
		new CSInterface().evalScript(script, callback);
	} catch(e) {
		console.error("执行脚本错误: " + e.message);
		if (callback) {
			callback("执行错误: " + e.message);
		}
	}
}
