// PProPanel.jsx - 相片連續效果導入插件 ExtendScript入口點
// 這個文件是Premiere Pro插件的主要ExtendScript入口點

// 包含其他JSX文件
(function() {
    // 獲取當前腳本的路徑
    var scriptPath = $.fileName;
    var lastSlash = scriptPath.lastIndexOf('/');
    if (lastSlash === -1) {
        lastSlash = scriptPath.lastIndexOf('\\');
    }
    var rootPath = scriptPath.substring(0, lastSlash + 1);
    
    // 加載通用模塊
    $.evalFile(rootPath + "jsx/ext.jsx");
    
    // 加載效果導入模塊
    $.evalFile(rootPath + "jsx/effect-import.jsx");
    
    // 可以在這裡加載更多模塊
})();
