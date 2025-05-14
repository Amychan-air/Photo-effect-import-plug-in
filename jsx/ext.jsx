// ext.jsx - 通用的ExtendScript加載器

// 全局命名空間
if (typeof($) == 'undefined') {
    $ = {};
}

$._ext = {
    // 評估一個文件夾中的所有JSX文件
    evalFiles: function(jsxFolderPath) {
        try {
            var folder = new Folder(jsxFolderPath);
            if (folder.exists) {
                var jsxFiles = folder.getFiles("*.jsx");
                for (var i = 0; i < jsxFiles.length; i++) {
                    var jsxFile = jsxFiles[i];
                    // 不要加載自己，避免循環引用
                    if (jsxFile.name.indexOf("ext.jsx") === -1) {
                        $.evalFile(jsxFile);
                    }
                }
                return "1";
            } else {
                return "0";
            }
        } catch (e) {
            return "Error: " + e.toString();
        }
    },
    
    // 評估一個具體的JSX文件
    evalFile: function(jsxFilePath) {
        try {
            var jsxFile = new File(jsxFilePath);
            if (jsxFile.exists) {
                $.evalFile(jsxFile);
                return "1";
            } else {
                return "0";
            }
        } catch (e) {
            return "Error: " + e.toString();
        }
    }
}; 