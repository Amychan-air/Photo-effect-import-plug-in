/*************************************************************************
* Premiere Pro 扩展 - 图像序列处理
**************************************************************************/

// 确保PPP命名空间存在
if (typeof $._PPP_ === 'undefined') {
    $._PPP_ = {};
}

// 预设配置
$._PPP_.settings = {
    // 预设文件夹路径 - 使用用户文档目录作为备选
    defaultImageFolder: "C:\\Program Files (x86)\\Common Files\\Adobe\\CEP\\extensions\\premiere_pro_plugin\\copied_images",
    // 调试设置
    debug: true
};

// 尝试使用文档文件夹作为备用方案
try {
    $._PPP_.settings.backupFolder = Folder.myDocuments.fsName + "\\premiere_pro_plugin_images";
} catch(e) {
    // 忽略错误
}

// 调试日志功能
$._PPP_.log = function(message, level) {
    if ($._PPP_.settings.debug) {
        level = level || "info"; // 默认级别为info
        var logPrefix = "[PPP " + level.toUpperCase() + "] ";
        
        // 如果在Premiere Pro环境中，使用SDK消息
        if (typeof app !== 'undefined' && app.name === "Adobe Premiere Pro") {
            app.setSDKEventMessage(logPrefix + message, level === "error" ? "error" : "info");
        }
        
        // 同时尝试写入系统日志文件
        try {
            // 首先尝试在当前脚本目录写入日志
            var scriptFolder = new File($.fileName).parent;
            var logFile = new File(scriptFolder.fsName + "/debug.log");
            
            // 如果不能写入，尝试在文档目录写入
            if (!logFile.open("a")) {
                if (typeof Folder.myDocuments !== 'undefined') {
                    logFile = new File(Folder.myDocuments.fsName + "/premiere_pro_plugin_debug.log");
                }
            }
            
            if (logFile.open("a")) {
                logFile.writeln(new Date().toLocaleString() + " " + logPrefix + message);
                logFile.close();
            }
        } catch (e) {
            // 无法写入日志文件，但我们不希望这影响主要功能
        }
    }
};

// 扩展PPP命名空间，添加Premiere Pro特定功能
$._PPP_.getVersionInfo = function() {
    return "Premiere Pro 图像序列扩展 v1.0";
};

$._PPP_.keepPanelLoaded = function() {
    return "面板已加载";
};

// 获取默认图像文件夹路径
$._PPP_.getDefaultImageFolder = function() {
    try {
        $._PPP_.log("正在获取默认图像文件夹: " + $._PPP_.settings.defaultImageFolder);
        var defaultFolder = new Folder($._PPP_.settings.defaultImageFolder);
        
        // 检查文件夹是否存在，如果不存在则创建
        if (!defaultFolder.exists) {
            $._PPP_.log("默认文件夹不存在，尝试创建");
            
            // 尝试创建目录
            try {
                var created = defaultFolder.create();
                if (!created) {
                    $._PPP_.log("无法创建默认文件夹，尝试备用文件夹", "error");
                    
                    // 尝试使用备用文件夹（文档目录下）
                    if ($._PPP_.settings.backupFolder) {
                        var backupFolder = new Folder($._PPP_.settings.backupFolder);
                        if (!backupFolder.exists) {
                            backupFolder.create();
                        }
                        if (backupFolder.exists) {
                            $._PPP_.log("使用备用文件夹: " + backupFolder.fsName);
                            return backupFolder.fsName;
                        }
                    }
                    
                    // 如果备用文件夹也失败，使用临时目录
                    var tempFolder = Folder.temp;
                    if (tempFolder.exists) {
                        var ppTempFolder = new Folder(tempFolder.fsName + "/premiere_pro_plugin");
                        if (!ppTempFolder.exists) {
                            ppTempFolder.create();
                        }
                        if (ppTempFolder.exists) {
                            $._PPP_.log("使用临时文件夹: " + ppTempFolder.fsName);
                            return ppTempFolder.fsName;
                        }
                    }
                    
                    return "[默认文件夹创建失败]";
                }
            } catch (createError) {
                $._PPP_.log("创建文件夹错误: " + createError.toString(), "error");
                return "[创建文件夹错误]";
            }
            
            $._PPP_.log("成功创建默认文件夹");
        }
        
        $._PPP_.log("返回默认文件夹路径: " + defaultFolder.fsName);
        return defaultFolder.fsName;
    } catch (error) {
        $._PPP_.log("获取默认文件夹时出错: " + error.toString(), "error");
        return "[获取默认文件夹出错: " + error.toString() + "]";
    }
};

// 选择图像序列文件夹
$._PPP_.selectImageSequenceFolder = function() {
    try {
        $._PPP_.log("正在打开文件夹选择对话框");
        // 获取默认文件夹作为初始位置
        var defaultPath = $._PPP_.settings.defaultImageFolder;
        var initialFolder = new Folder(defaultPath);
        
        // 如果默认文件夹不存在，尝试备用方案
        if (!initialFolder.exists) {
            $._PPP_.log("默认文件夹不存在，尝试备用方案");
            
            // 尝试使用备用文件夹
            if ($._PPP_.settings.backupFolder) {
                initialFolder = new Folder($._PPP_.settings.backupFolder);
                if (!initialFolder.exists) {
                    initialFolder.create();
                }
            }
            
            // 如果备用文件夹也不存在，使用文档目录
            if (!initialFolder.exists && typeof Folder.myDocuments !== 'undefined') {
                $._PPP_.log("使用文档目录");
                initialFolder = Folder.myDocuments;
            }
            
            // 最后的备用方案 - 使用桌面或临时目录
            if (!initialFolder.exists) {
                if (typeof Folder.desktop !== 'undefined') {
                    initialFolder = Folder.desktop;
                } else if (typeof Folder.temp !== 'undefined') {
                    initialFolder = Folder.temp;
                }
            }
        }
        
        // 使用初始位置打开文件夹选择对话框
        try {
            var folder = Folder.selectDialog("选择图像序列文件夹", initialFolder.fsName);
            if (folder) {
                $._PPP_.log("用户选择了文件夹: " + folder.fsName);
                return folder.fsName;
            } else {
                $._PPP_.log("用户取消了选择，返回默认文件夹");
                // 如果用户取消选择，返回默认文件夹
                return $._PPP_.getDefaultImageFolder();
            }
        } catch (selectError) {
            $._PPP_.log("文件夹选择对话框失败: " + selectError.toString(), "error");
            return $._PPP_.getDefaultImageFolder();
        }
    } catch (error) {
        $._PPP_.log("选择文件夹时出错: " + error.toString(), "error");
        return "[选择文件夹出错: " + error.toString() + "]";
    }
};

// 预览图像序列
$._PPP_.previewImageSequence = function(params) {
    try {
        $._PPP_.log("开始处理图像序列导入请求");
        var parts = params.split(";");
        var folderPath = parts[0];
        var frameRate = parseFloat(parts[1]) || 24;
        var sortOrder = parts[2] || "numeric";
        
        $._PPP_.log("参数: 路径=" + folderPath + ", 帧率=" + frameRate + ", 排序=" + sortOrder);
        
        // 检查文件夹是否存在
        var imageSequenceFolder = new Folder(folderPath);
        if (!imageSequenceFolder.exists) {
            $._PPP_.log("文件夹不存在: " + folderPath, "error");
            return "错误: 文件夹不存在 - " + folderPath;
        }
        
        // 检查Premiere Pro是否可用
        if (typeof app === 'undefined' || !app.project) {
            $._PPP_.log("Premiere Pro 不可用或没有活动项目", "error");
            return "错误: Premiere Pro 不可用或没有活动项目";
        }
        
        // 获取活动项目
        var proj = app.project;
        if (!proj) {
            $._PPP_.log("没有活动项目", "error");
            return "错误: 无活动项目";
        }
        
        // 记录文件夹内容到日志
        $._PPP_.log("文件夹内容:");
        var allFiles = imageSequenceFolder.getFiles();
        for (var i = 0; i < Math.min(allFiles.length, 10); i++) {
            $._PPP_.log(" - " + allFiles[i].name + (allFiles[i] instanceof File ? " (文件)" : " (目录)"));
        }
        if (allFiles.length > 10) {
            $._PPP_.log(" ... 等共 " + allFiles.length + " 项");
        }
        
        // 根据排序方式获取文件
        var imageFiles = imageSequenceFolder.getFiles(function(file) {
            try {
                return file instanceof File && 
                       file.name.match(/\.(jpg|jpeg|png|tiff|tif|exr|psd)$/i);
            } catch (e) {
                $._PPP_.log("过滤文件时出错: " + e.toString(), "error");
                return false;
            }
        });
        
        $._PPP_.log("找到 " + imageFiles.length + " 个图像文件");
        
        if (imageFiles.length === 0) {
            $._PPP_.log("文件夹中没有图像文件", "error");
            return "错误: 文件夹中没有发现支持的图像文件";
        }
        
        // 根据排序方式对文件进行排序
        if (sortOrder === "numeric") {
            $._PPP_.log("使用数字排序");
            imageFiles.sort(function(a, b) {
                try {
                    // 提取数字部分
                    var numA = a.name.replace(/[^\d]/g, '');
                    var numB = b.name.replace(/[^\d]/g, '');
                    return parseInt(numA) - parseInt(numB);
                } catch (e) {
                    $._PPP_.log("排序出错: " + e.toString(), "error");
                    return 0;
                }
            });
        } else if (sortOrder === "alphabetical") {
            $._PPP_.log("使用字母排序");
            imageFiles.sort();
        }
        
        $._PPP_.log("第一个图像文件: " + imageFiles[0].name);
        
        // 使用Premiere Pro原生的导入功能
        try {
            $._PPP_.log("开始导入图像序列");
            // 在Premiere Pro中，我们直接使用project.importFiles()方法
            var firstImage = imageFiles[0];
            
            // 详细记录要导入的文件
            $._PPP_.log("文件路径: " + firstImage.fsName);
            $._PPP_.log("文件存在: " + firstImage.exists);
            $._PPP_.log("文件大小: " + firstImage.length);
            
            // 导入前检查Premiere Pro API
            if (typeof proj.importFiles !== 'function') {
                $._PPP_.log("importFiles方法不可用", "error");
                return "错误: Premiere Pro导入API不可用";
            }
            
            // 设置导入选项
            var suppressUI = true;       // 不显示导入对话框
            var targetBin = null;        // 导入到哪个bin
            
            // 尝试获取根目录
            try {
                targetBin = app.project.rootItem;
                $._PPP_.log("获取到根目录: " + (targetBin ? "成功" : "失败"));
            } catch (binError) {
                $._PPP_.log("获取根目录失败: " + binError.toString(), "error");
                targetBin = null; // 使用默认值
            }
            
            var importAsSequence = true; // 作为序列导入
            
            $._PPP_.log("准备调用importFiles方法");
            
            // 执行导入
            var importArgs = [firstImage.fsName];
            $._PPP_.log("执行导入: importFiles(" + JSON.stringify(importArgs) + ", " + suppressUI + ", targetBin, " + importAsSequence + ")");
            
            var importedItems = [];
            
            try {
                // 使用带有错误处理的导入方法
                importedItems = proj.importFiles(importArgs, suppressUI, targetBin, importAsSequence);
                $._PPP_.log("导入完成，返回 " + (importedItems ? importedItems.length : 0) + " 个项目");
            } catch (directImportError) {
                $._PPP_.log("直接导入失败: " + directImportError.toString(), "error");
                
                // 尝试替代方法1: 单个文件导入
                try {
                    $._PPP_.log("尝试单个文件导入");
                    var importOption = new ImportOptions(firstImage.fsName);
                    if (importOption) {
                        importOption.importAs = ImportAsType.FOOTAGE;
                        importOption.sequence = true;
                        var singleItem = proj.importFile(importOption);
                        if (singleItem) {
                            importedItems = [singleItem];
                            $._PPP_.log("单个文件导入成功");
                        }
                    }
                } catch (altError1) {
                    $._PPP_.log("替代方法1失败: " + altError1.toString(), "error");
                    
                    // 尝试替代方法2: 使用eval调用
                    try {
                        $._PPP_.log("尝试使用eval调用导入函数");
                        var result = eval("app.project.importSequence('" + firstImage.fsName.replace(/\\/g, "\\\\") + "')");
                        if (result) {
                            importedItems = [result];
                            $._PPP_.log("eval调用导入成功");
                        }
                    } catch (evalError) {
                        $._PPP_.log("eval调用失败: " + evalError.toString(), "error");
                    }
                }
            }
            
            // 检查导入结果
            if (importedItems && importedItems.length > 0) {
                var importedSequence = importedItems[0];
                $._PPP_.log("成功导入项目: " + importedSequence.name);
                
                // 检查活动序列
                if (app.project.activeSequence) {
                    var activeSequence = app.project.activeSequence;
                    $._PPP_.log("找到活动序列: " + activeSequence.name);
                    
                    // 尝试添加到序列中
                    try {
                        if (activeSequence.videoTracks && activeSequence.videoTracks.length > 0) {
                            $._PPP_.log("找到视频轨道，准备插入剪辑");
                            var videoTrack = activeSequence.videoTracks[0];
                            
                            if (videoTrack && typeof videoTrack.insertClip === 'function') {
                                $._PPP_.log("尝试插入剪辑");
                                var success = videoTrack.insertClip(importedSequence, 0);
                                
                                if (success) {
                                    $._PPP_.log("成功添加到序列");
                                    return "已成功导入图像序列并添加到序列中";
                                } else {
                                    $._PPP_.log("无法添加到序列", "error");
                                    return "已导入图像序列，但添加到序列失败";
                                }
                            } else {
                                $._PPP_.log("视频轨道无效或缺少insertClip方法", "error");
                                return "已导入图像序列，但无法添加到序列 (API错误)";
                            }
                        } else {
                            $._PPP_.log("没有找到视频轨道", "error");
                            return "已导入图像序列，但序列没有视频轨道";
                        }
                    } catch (seqError) {
                        $._PPP_.log("添加到序列时出错: " + seqError.toString(), "error");
                        return "已导入图像序列，但添加到序列时出错: " + seqError.toString();
                    }
                } else {
                    $._PPP_.log("没有活动序列", "warning");
                    return "已成功导入图像序列 (无活动序列)";
                }
                
                $._PPP_.log("完成导入");
                return "已成功导入图像序列";
            } else {
                $._PPP_.log("导入失败，没有返回项目", "error");
                return "导入失败: 无法导入图像序列";
            }
        } catch (importError) {
            $._PPP_.log("导入过程出错: " + importError.toString(), "error");
            
            // 详细记录错误信息
            if (importError.fileName) $._PPP_.log("错误文件: " + importError.fileName, "error");
            if (importError.line) $._PPP_.log("错误行号: " + importError.line, "error");
            if (importError.stack) $._PPP_.log("错误堆栈: " + importError.stack, "error");
            
            return "导入错误: " + importError.toString();
        }
    } catch (error) {
        $._PPP_.log("处理过程出错: " + error.toString(), "error");
        return "处理错误: " + error.toString();
    }
}; 