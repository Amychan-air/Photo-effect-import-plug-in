/* eslint-disable no-undef */
/* eslint-disable no-unused-vars */

function onLoaded () {
	var csInterface = new CSInterface();

	var env = csInterface.hostEnvironment;
	var appName 	= csInterface.hostEnvironment.appName;
	var appVersion 	= csInterface.hostEnvironment.appVersion;
	var APIVersion	= csInterface.getCurrentApiVersion();

	// 確保我們在Premiere Pro中運行
	if(appName !== "PPRO") {
		alert("此插件僅支持Premiere Pro!");
		return;
	}

	loadJSX();
	
	updateThemeWithAppSkinInfo(csInterface.hostEnvironment.appSkinInfo);

	// 更新主題顏色
	csInterface.addEventListener(CSInterface.THEME_COLOR_CHANGED_EVENT, onAppThemeColorChanged);

	// 設置默認圖片存儲路徑
	csInterface.evalScript("$._PPP_.setImagesPath('C:/Users/User/Documents/GitHub/Photo-effect-import-plug-in/copied_images')");

	// 註冊事件監聽器
	setupEventListeners();

	// 初始化插件
	initializePlugin();

	// 保持面板加載
	csInterface.evalScript("$._PPP_.keepPanelLoaded()");
}

// 初始化插件
function initializePlugin() {
	var csInterface = new CSInterface();
	
	// 獲取插件版本信息
	csInterface.evalScript("$._PPP_.getVersionInfo()", function(result) {
		document.getElementById("version_string").innerHTML = result;
	});
	
	// 檢查是否有活動序列
	csInterface.evalScript("$._PPP_.getActiveSequenceName()", function(result) {
		document.getElementById("status").innerHTML = 
			result ? "已打開項目：" + result : "請在Premiere Pro中打開一個項目";
	});

	// 掃描效果文件夾
	populateEffectFolders();
}

// 設置事件監聽器
function setupEventListeners() {
	var csInterface = new CSInterface();
	
	// 播放按鈕點擊事件
	document.getElementById("play-btn").addEventListener("click", function() {
		if(currentEffect) {
			startPlayback();
		} else {
			alert("請先選擇一個效果");
		}
	});
	
	// 暫停按鈕點擊事件
	document.getElementById("pause-btn").addEventListener("click", function() {
		stopPlayback();
	});
	
	// 插入按鈕點擊事件
	document.getElementById("import-btn").addEventListener("click", function() {
		if(currentEffect) {
			importEffectToProject();
		} else {
			alert("請先選擇一個效果");
		}
	});
	
	// 刷新效果列表按鈕點擊事件
	document.getElementById("refresh-btn").addEventListener("click", function() {
		populateEffectFolders();
	});
	
	// 幀率選擇變更事件
	document.getElementById("frame-rate").addEventListener("change", function() {
		if(isPlaying) {
			stopPlayback();
			startPlayback();
		}
	});
	
	// 監聽Premiere Pro事件
	csInterface.addEventListener("com.adobe.csxs.events.PProPanelRenderEvent", function(event) {
		document.getElementById("status").innerHTML = "渲染完成: " + event.data;
	});
	
	csInterface.addEventListener("com.adobe.csxs.events.WorkspaceChanged", function(event) {
		// 工作區變更時可能需要更新UI
	});
	
	// 註冊項目選擇變更事件
	csInterface.evalScript("$._PPP_.registerProjectPanelSelectionChangedFxn()");
	
	// 註冊序列激活事件
	csInterface.evalScript("$._PPP_.registerSequenceActivatedFxn()");
}

// 全局變量 - 效果和播放控制
let effectFolders = [];
let currentEffect = null;
let currentFrame = 0;
let isPlaying = false;
let playInterval = null;

// 填充效果文件夾列表
function populateEffectFolders() {
	var csInterface = new CSInterface();
	
	// 調用ExtendScript來獲取文件系統中的文件夾
	csInterface.evalScript("$._PPP_.scanEffectFolders()", function(result) {
		try {
			// 解析返回的JSON
			if (result && result !== "[]") {
				var resultObj = JSON.parse(result);
				if (resultObj.success && resultObj.folders) {
					effectFolders = resultObj.folders;
					// 更新UI
					displayEffectFolders();
					// 顯示根路徑信息
					if (resultObj.rootPath) {
						document.getElementById("status").innerHTML = 
							`從 ${resultObj.rootPath} 找到 ${effectFolders.length} 個效果文件夾`;
					}
				} else {
					// 顯示錯誤信息
					document.getElementById("status").innerHTML = resultObj.message || "獲取效果文件夾失敗";
					effectFolders = [];
					displayEffectFolders();
				}
			} else {
				// 顯示提示，沒有找到效果文件夾或用戶取消了選擇
				document.getElementById("status").innerHTML = "請點擊刷新按鈕選擇效果文件夾";
			}
		} catch (e) {
			console.error("Error parsing effect folders: " + e);
			document.getElementById("status").innerHTML = "獲取效果文件夾失敗：" + e.message;
		}
	});
}

// 顯示效果文件夾列表
function displayEffectFolders() {
	const effectList = document.getElementById('effect-list');
	effectList.innerHTML = '';
	
	if (!effectFolders || effectFolders.length === 0) {
		document.getElementById("status").innerHTML = 
			document.getElementById("status").innerHTML || "未找到效果文件夾";
		return;
	}
	
	effectFolders.forEach(effect => {
		const li = document.createElement('li');
		li.textContent = effect.name;
		li.dataset.path = effect.path;
		li.dataset.frames = effect.imageCount;
		li.addEventListener('click', () => loadEffect(effect));
		effectList.appendChild(li);
	});
	
	if (!document.getElementById("status").innerHTML.includes("找到")) {
		document.getElementById("status").innerHTML = 
			`找到 ${effectFolders.length} 個效果文件夾`;
	}
}

// 加載效果
function loadEffect(effect) {
	// 清除當前活動效果的高亮顯示
	document.querySelectorAll('#effect-list li').forEach(item => {
		item.classList.remove('active');
	});
	
	// 高亮顯示當前選中的效果
	document.querySelector(`#effect-list li[data-path="${effect.path}"]`).classList.add('active');
	
	currentEffect = effect;
	currentFrame = 0;
	
	// 更新標題
	document.getElementById('effect-title').textContent = `預覽: ${effect.name}`;
	
	// 停止當前播放
	stopPlayback();
	
	// 獲取文件夾中的所有圖像
	loadImagesInFolder(effect.path);
}

// 加載文件夾中的所有圖像
let effectImages = [];
function loadImagesInFolder(folderPath) {
	var csInterface = new CSInterface();
	
	// 顯示加載指示器
	document.getElementById('loading-indicator').style.display = 'block';
	
	csInterface.evalScript(`$._PPP_.getImagesInFolder("${folderPath}")`, function(result) {
		try {
			// 解析返回的JSON
			if (result && result !== "[]") {
				var resultObj = JSON.parse(result);
				if (resultObj.success && resultObj.images) {
					effectImages = resultObj.images;
					
					// 加載第一幀
					currentFrame = 0;
					updatePreviewImage();
					
					// 更新狀態信息
					document.getElementById('status').textContent = 
						`已加載 "${currentEffect.name}"，共 ${effectImages.length} 幀圖像`;
				} else {
					document.getElementById('status').textContent = resultObj.message || "未找到圖像文件";
					effectImages = [];
				}
			} else {
				document.getElementById('status').textContent = "未找到圖像文件";
				effectImages = [];
			}
		} catch (e) {
			console.error("Error parsing images: " + e);
			document.getElementById('status').textContent = "加載圖像失敗：" + e.message;
			effectImages = [];
		} finally {
			// 隱藏加載指示器
			document.getElementById('loading-indicator').style.display = 'none';
		}
	});
}

// 更新預覽圖像
function updatePreviewImage() {
	if (!currentEffect || effectImages.length === 0) return;
	
	// 獲取預覽圖像元素
	const previewImage = document.getElementById('preview-image');
	
	// 確保當前幀在有效範圍內
	currentFrame = currentFrame % effectImages.length;
	
	// 設置圖像路徑
	previewImage.src = effectImages[currentFrame].path;
}

// 開始播放
function startPlayback() {
	if (!currentEffect || isPlaying || effectImages.length === 0) return;
	
	isPlaying = true;
	const frameRate = document.getElementById('frame-rate').value;
	const interval = 1000 / frameRate;
	
	playInterval = setInterval(() => {
		currentFrame = (currentFrame + 1) % effectImages.length;
		updatePreviewImage();
	}, interval);
	
	document.getElementById('status').textContent = `正在播放 "${currentEffect.name}" (${frameRate} fps)`;
}

// 停止播放
function stopPlayback() {
	isPlaying = false;
	if (playInterval) {
		clearInterval(playInterval);
		playInterval = null;
	}
	
	if (currentEffect) {
		document.getElementById('status').textContent = `已暫停 "${currentEffect.name}"`;
	}
}

// 將效果導入到項目
function importEffectToProject() {
	if (!currentEffect) {
		alert('請先選擇一個效果');
		return;
	}
	
	const frameRate = document.getElementById('frame-rate').value;
	document.getElementById('status').textContent = `正在導入 "${currentEffect.name}"...`;
	
	var csInterface = new CSInterface();
	csInterface.evalScript(`$._PPP_.importEffectSequence("${currentEffect.path}", ${frameRate})`, function(result) {
		try {
			if(result) {
				var resultObj = JSON.parse(result);
				if(resultObj.success) {
					document.getElementById('status').textContent = 
						`已將 "${currentEffect.name}" 以 ${frameRate} fps 的速率插入到項目中`;
				} else {
					document.getElementById('status').textContent = 
						`導入失敗: ${resultObj.message}`;
				}
			} else {
				document.getElementById('status').textContent = 
					`導入失敗: 未收到響應`;
			}
		} catch(e) {
			console.error("Error parsing import result: " + e);
			document.getElementById('status').textContent = 
				`導入失敗: ${e.message}`;
		}
	});
}

/**
 * Update the theme with the AppSkinInfo retrieved from the host product.
 */
function updateThemeWithAppSkinInfo(appSkinInfo) {
	//Update the background color of the panel
	var panelBackgroundColor = appSkinInfo.panelBackgroundColor.color;
	document.body.bgColor 	= toHex(panelBackgroundColor);

	var styleId 			= "ppstyle";
	var gradientBg			= "background-image: -webkit-linear-gradient(top, " + toHex(panelBackgroundColor, 40) + " , " + toHex(panelBackgroundColor, 10) + ");";
	var gradientDisabledBg	= "background-image: -webkit-linear-gradient(top, " + toHex(panelBackgroundColor, 15) + " , " + toHex(panelBackgroundColor, 5) + ");";
	var boxShadow			= "-webkit-box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.4), 0 1px 1px rgba(0, 0, 0, 0.2);";
	var boxActiveShadow		= "-webkit-box-shadow: inset 0 1px 4px rgba(0, 0, 0, 0.6);";

	var isPanelThemeLight	= panelBackgroundColor.red > 50; // choose your own sweet spot
	var fontColor, disabledFontColor, borderColor, inputBackgroundColor, gradientHighlightBg;

	if(isPanelThemeLight) {
		fontColor				= "#000000;";
		disabledFontColor		= "color:" + toHex(panelBackgroundColor, -70) + ";";
		borderColor				= "border-color: " + toHex(panelBackgroundColor, -90) + ";";
		inputBackgroundColor	= toHex(panelBackgroundColor, 54) + ";";
		gradientHighlightBg		= "background-image: -webkit-linear-gradient(top, " + toHex(panelBackgroundColor, -40) + " , " + toHex(panelBackgroundColor,-50) + ");";
	} else {
		fontColor				= "#ffffff;";
		disabledFontColor		= "color:" + toHex(panelBackgroundColor, 100) + ";";
		borderColor				= "border-color: " + toHex(panelBackgroundColor, -45) + ";";
		inputBackgroundColor	= toHex(panelBackgroundColor, -20) + ";";
		gradientHighlightBg		= "background-image: -webkit-linear-gradient(top, " + toHex(panelBackgroundColor, -20) + " , " + toHex(panelBackgroundColor, -30) + ");";
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
	// Should get a latest HostEnvironment object from application.
	var skinInfo = JSON.parse(window.__adobe_cep__.getHostEnvironment()).appSkinInfo;
	// Gets the style information such as color info from the skinInfo, 
	// and redraw all UI controls of your extension according to the style info.
	updateThemeWithAppSkinInfo(skinInfo);
} 

/**
* Load JSX file into the scripting context of the product. All the jsx files in 
* folder [ExtensionRoot]/jsx & [ExtensionRoot]/jsx/[AppName] will be loaded.
*/
function loadJSX() {
	var csInterface = new CSInterface();
	var extensionPath = csInterface.getSystemPath(SystemPath.EXTENSION);
	
	// 加載主要的JSX文件
	csInterface.evalScript(`$.evalFile("${extensionPath}/PProPanel.jsx")`);
}
