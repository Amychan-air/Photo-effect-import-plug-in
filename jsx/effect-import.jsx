// 相片連續效果導入插件 - ExtendScript腳本
// 處理文件系統操作和與Premiere Pro的交互

// 全局命名空間
if (typeof($) == 'undefined') {
    $ = {};
}

// 插件命名空間
$._PPP_ = {
    // 默認圖片存儲路徑
    defaultImagesPath: "C:\\Program Files (x86)\\Common Files\\Adobe\\CEP\\extensions\\premiere_pro_plugin\\copied_images",
    
    // 設置圖片存儲路徑
    setImagesPath: function(path) {
        if (path && path !== "") {
            this.defaultImagesPath = path;
            return "圖片路徑已設置為: " + path;
        }
        return "路徑無效";
    },
    
    // 獲取當前圖片存儲路徑
    getImagesPath: function() {
        return this.defaultImagesPath;
    },
    
    // 用戶選擇文件夾
    selectFolder: function(title) {
        try {
            var title = title || "選擇效果根文件夾";
            var rootFolder = Folder.selectDialog(title);
            if (!rootFolder) {
                return { success: false, message: "用戶取消了選擇" }; 
            }
            
            return { 
                success: true, 
                path: rootFolder.fsName,
                name: rootFolder.name
            };
        } catch (e) {
            return { 
                success: false, 
                message: "選擇文件夾時發生錯誤: " + e.toString() 
            };
        }
    },
    
    // 掃描效果文件夾 - 使用默認圖片存儲路徑
    scanEffectFolders: function() {
        try {
            var rootFolder = new Folder(this.defaultImagesPath);
            if (!rootFolder.exists) {
                rootFolder = Folder.selectDialog("選擇效果根文件夾");
                if (!rootFolder) {
                    return JSON.stringify({ 
                        success: false, 
                        message: "用戶取消了選擇",
                        folders: [] 
                    });
                }
                // 更新默認路徑
                this.defaultImagesPath = rootFolder.fsName;
            }

            var effectFolders = [];
            var folders = rootFolder.getFiles(function(file) {
                return file instanceof Folder;
            });

            for (var i = 0; i < folders.length; i++) {
                var folder = folders[i];
                var folderName = folder.name;
                var imageCount = 0;
                
                // 支持的圖像擴展名
                var supportedExtensions = ['.jpg', '.jpeg', '.png', '.tiff', '.tif', '.bmp'];
                
                // 獲取文件夾內的所有文件
                var files = folder.getFiles();
                
                // 過濾出圖像文件
                var imageFiles = [];
                for (var j = 0; j < files.length; j++) {
                    var file = files[j];
                    if (file instanceof File) {
                        var extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
                        if (supportedExtensions.indexOf(extension) !== -1) {
                            imageFiles.push(file);
                        }
                    }
                }
                
                imageCount = imageFiles.length;
                
                if (imageCount > 0) {
                    effectFolders.push({
                        name: folderName,
                        path: folder.fsName,
                        imageCount: imageCount
                    });
                }
            }
            
            return JSON.stringify({ 
                success: true, 
                message: "成功掃描到 " + effectFolders.length + " 個效果文件夾",
                rootPath: rootFolder.fsName,
                folders: effectFolders 
            });
        } catch (e) {
            return JSON.stringify({ 
                success: false, 
                message: "掃描效果文件夾時發生錯誤: " + e.toString(),
                folders: [] 
            });
        }
    },
    
    // 掃描指定路徑的效果文件夾
    scanEffectFoldersFromPath: function(path) {
        try {
            if (!path || path === "") {
                return this.scanEffectFolders();
            }
            
            var rootFolder = new Folder(path);
            if (!rootFolder.exists) {
                return JSON.stringify({ 
                    success: false, 
                    message: "指定路徑不存在: " + path,
                    folders: [] 
                });
            }

            var effectFolders = [];
            var folders = rootFolder.getFiles(function(file) {
                return file instanceof Folder;
            });

            for (var i = 0; i < folders.length; i++) {
                var folder = folders[i];
                var folderName = folder.name;
                var imageCount = 0;
                
                // 支持的圖像擴展名
                var supportedExtensions = ['.jpg', '.jpeg', '.png', '.tiff', '.tif', '.bmp'];
                
                // 獲取文件夾內的所有文件
                var files = folder.getFiles();
                
                // 過濾出圖像文件
                var imageFiles = [];
                for (var j = 0; j < files.length; j++) {
                    var file = files[j];
                    if (file instanceof File) {
                        var extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
                        if (supportedExtensions.indexOf(extension) !== -1) {
                            imageFiles.push(file);
                        }
                    }
                }
                
                imageCount = imageFiles.length;
                
                if (imageCount > 0) {
                    effectFolders.push({
                        name: folderName,
                        path: folder.fsName,
                        imageCount: imageCount
                    });
                }
            }
            
            return JSON.stringify({ 
                success: true, 
                message: "成功掃描到 " + effectFolders.length + " 個效果文件夾",
                rootPath: rootFolder.fsName,
                folders: effectFolders 
            });
        } catch (e) {
            return JSON.stringify({ 
                success: false, 
                message: "掃描指定路徑時發生錯誤: " + e.toString(),
                folders: [] 
            });
        }
    },
    
    // 獲取圖像路徑
    getImagePath: function(relativePath) {
        try {
            // 處理相對路徑
            var fullPath;
            if (relativePath.indexOf('/') === 0 || relativePath.indexOf(':\\') !== -1 || relativePath.indexOf(':/') !== -1) {
                fullPath = relativePath;
            } else {
                // 如果是相對路徑，嘗試從默認圖片存儲路徑查找
                fullPath = this.defaultImagesPath + "/" + relativePath;
            }
            
            var imageFile = new File(fullPath);
            if (imageFile.exists) {
                return JSON.stringify({
                    success: true,
                    path: imageFile.fsName.replace(/\\/g, '/')
                });
            } else {
                // 嘗試遍歷文件夾獲取正確的文件名模式
                var folderPath = fullPath.substring(0, fullPath.lastIndexOf('/'));
                var folder = new Folder(folderPath);
                
                if (folder.exists) {
                    var files = folder.getFiles();
                    if (files.length > 0) {
                        // 返回第一個文件作為示例
                        return JSON.stringify({
                            success: true,
                            path: files[0].fsName.replace(/\\/g, '/')
                        });
                    }
                }
                
                return JSON.stringify({
                    success: false,
                    message: "圖像文件不存在: " + fullPath
                });
            }
        } catch (e) {
            return JSON.stringify({
                success: false,
                message: "獲取圖像路徑時發生錯誤: " + e.toString()
            });
        }
    },
    
    // 獲取文件夾中的所有圖像
    getImagesInFolder: function(folderPath) {
        try {
            var folder = new Folder(folderPath);
            if (!folder.exists) {
                return JSON.stringify({
                    success: false,
                    message: "文件夾不存在: " + folderPath,
                    images: []
                });
            }
            
            // 支持的圖像擴展名
            var supportedExtensions = ['.jpg', '.jpeg', '.png', '.tiff', '.tif', '.bmp'];
            
            // 獲取文件夾內的所有文件
            var files = folder.getFiles();
            
            // 過濾出圖像文件
            var imageFiles = [];
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                if (file instanceof File) {
                    var extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
                    if (supportedExtensions.indexOf(extension) !== -1) {
                        imageFiles.push({
                            name: file.name,
                            path: file.fsName.replace(/\\/g, '/')
                        });
                    }
                }
            }
            
            // 按文件名排序
            imageFiles.sort(function(a, b) {
                return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
            });
            
            return JSON.stringify({
                success: true,
                count: imageFiles.length,
                folderName: folder.name,
                folderPath: folder.fsName,
                images: imageFiles
            });
        } catch (e) {
            return JSON.stringify({
                success: false,
                message: "獲取文件夾圖像時發生錯誤: " + e.toString(),
                images: []
            });
        }
    },
    
    // 將效果序列導入到Premiere Pro項目
    importEffectSequence: function(folderPath, frameRate) {
        try {
            var folder = new Folder(folderPath);
            if (!folder.exists) {
                return JSON.stringify({
                    success: false,
                    message: "文件夾不存在: " + folderPath
                });
            }
            
            // 獲取項目
            var project = app.project;
            if (!project) {
                return JSON.stringify({
                    success: false,
                    message: "無法訪問當前項目"
                });
            }
            
            // 支持的圖像擴展名
            var supportedExtensions = ['.jpg', '.jpeg', '.png', '.tiff', '.tif', '.bmp'];
            
            // 獲取文件夾內的所有文件
            var files = folder.getFiles();
            
            // 過濾出圖像文件
            var imageFiles = [];
            for (var i = 0; i < files.length; i++) {
                var file = files[i];
                if (file instanceof File) {
                    var extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
                    if (supportedExtensions.indexOf(extension) !== -1) {
                        imageFiles.push(file);
                    }
                }
            }
            
            // 按文件名排序
            imageFiles.sort(function(a, b) {
                return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
            });
            
            if (imageFiles.length === 0) {
                return JSON.stringify({
                    success: false,
                    message: "文件夾中沒有支持的圖像文件"
                });
            }
            
            // 創建一個新的bin用於存放導入的圖像序列
            var bin = project.rootItem.createBin(folder.name + "_效果");
            
            // 導入設置
            var importOptions = new ImportOptions();
            importOptions.importAs = ImportAsType.FOOTAGE;
            
            // 導入圖像文件
            var importedItems = [];
            for (var j = 0; j < imageFiles.length; j++) {
                importOptions.file = imageFiles[j];
                var importedItem = project.importFile(importOptions);
                if (importedItem) {
                    importedItems.push(importedItem);
                    // 移動到指定的bin
                    importedItem.moveBin(bin);
                }
            }
            
            // 獲取當前活動序列
            var sequence = project.activeSequence;
            if (!sequence) {
                // 創建一個新序列
                var sequenceName = folder.name + "_序列";
                
                // 使用第一個導入的項目的設置創建序列
                if (importedItems.length > 0) {
                    var firstItem = importedItems[0];
                    var sequenceID = project.createNewSequence(sequenceName, firstItem.nodeId);
                    sequence = project.activeSequence;
                } else {
                    return JSON.stringify({
                        success: false,
                        message: "無法創建序列"
                    });
                }
            }
            
            // 設置序列設置
            if (sequence) {
                // 計算每幀的持續時間（以tick為單位）
                var ticksPerSecond = 254016000000; // Premiere Pro的tick單位
                var frameDuration = Math.round(ticksPerSecond / frameRate);
                
                // 向序列添加圖像項
                for (var k = 0; k < importedItems.length; k++) {
                    var item = importedItems[k];
                    var videoTrackIndex = 0; // 使用第一個視頻軌道
                    
                    // 獲取視頻軌道
                    var videoTrack = sequence.videoTracks[videoTrackIndex];
                    if (videoTrack) {
                        // 計算插入點（以tick為單位）
                        var insertTime = k * frameDuration;
                        
                        // 插入剪輯
                        videoTrack.insertClip(item, insertTime);
                    }
                }
                
                return JSON.stringify({
                    success: true,
                    message: "已將 " + imageFiles.length + " 張圖像以 " + frameRate + " fps 的速率插入到項目中",
                    sequenceName: sequence.name
                });
            } else {
                return JSON.stringify({
                    success: false,
                    message: "無法訪問序列"
                });
            }
        } catch (e) {
            return JSON.stringify({
                success: false,
                message: "導入效果序列時發生錯誤: " + e.toString()
            });
        }
    },
    
    // 獲取版本信息
    getVersionInfo: function() {
        return "相片連續效果導入插件 v1.0.0";
    },
    
    // 獲取活動序列名稱
    getActiveSequenceName: function() {
        try {
            var project = app.project;
            if (project) {
                var sequence = project.activeSequence;
                if (sequence) {
                    return sequence.name;
                }
            }
            return "";
        } catch (e) {
            return "";
        }
    },
    
    // 保持面板加載
    keepPanelLoaded: function() {
        app.setExtensionPersistent("com.example.photoeffectimport", "0");
    },
    
    // 註冊項目面板選擇變更函數
    registerProjectPanelSelectionChangedFxn: function() {
        app.bind("onProjectPanelSelectionChanged", function() {
            // 這個函數將在項目面板選擇變更時調用
            var eventObj = new CSXSEvent();
            eventObj.type = "com.adobe.csxs.events.ProjectPanelSelectionChanged";
            eventObj.data = "Project panel selection changed";
            eventObj.dispatch();
        });
    },
    
    // 註冊序列激活函數
    registerSequenceActivatedFxn: function() {
        app.bind("onActiveSequenceChanged", function() {
            // 這個函數將在活動序列變更時調用
            var eventObj = new CSXSEvent();
            eventObj.type = "com.adobe.csxs.events.SequenceActivated";
            eventObj.data = "Sequence activated";
            eventObj.dispatch();
        });
    }
}; 