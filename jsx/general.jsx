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
if (typeof $ == 'undefined') {
  $ = {};
}

// 添加ExtendScript中的错误处理和文件加载功能
$._ext = {
  // 评估JSX文件
  evalFiles: function (jsxFolderPath) {
    var folder = new Folder(jsxFolderPath);
    
    if (folder.exists) {
      var jsxFiles = folder.getFiles("*.jsx");
      for (var i = 0; i < jsxFiles.length; i++) {
        var currentFile = jsxFiles[i];
        // 避免加载自身导致的无限循环
        if (currentFile.name !== "general.jsx") {
          try {
            $.evalFile(currentFile.absoluteURI);
          } catch (error) {
            // 在ExtendScript中处理错误
            if (typeof app !== 'undefined' && app.name === "Adobe Premiere Pro") {
              app.setSDKEventMessage("加载脚本错误: " + currentFile.name, "error");
            } else {
              alert("加载脚本错误: " + currentFile.name + "\n错误: " + error.toString());
            }
          }
        }
      }
    }
    
    return "已加载JSX文件";
  },

  // 错误处理辅助函数
  handleError: function (err) {
    if (typeof err === "string") {
      return err;
    } else if (err instanceof Error) {
      return err.name + ": " + err.message;
    } else {
      return "未知错误: " + String(err);
    }
  },

  // 安全执行函数
  safeExecute: function (fn, args) {
    try {
      return fn.apply(null, args || []);
    } catch (e) {
      return "错误: " + this.handleError(e);
    }
  }
};

// 创建PPP命名空间用于Premiere Pro特定功能
$._PPP_ = {
  // 版本信息
  getVersionInfo: function() {
    return "Premiere Pro 扩展 v1.0";
  },
  
  // 保持面板加载状态
  keepPanelLoaded: function() {
    return "面板已加载";
  },
  
  // 选择图像序列文件夹
  selectImageSequenceFolder: function() {
    try {
      var folder = Folder.selectDialog("选择图像序列文件夹");
      if (folder) {
        return folder.fsName;
      } else {
        return "[未选择文件夹]";
      }
    } catch (error) {
      return "[选择文件夹出错: " + error.toString() + "]";
    }
  },
  
  // 预览图像序列
  previewImageSequence: function(params) {
    try {
      var parts = params.split(";");
      var folderPath = parts[0];
      var frameRate = parseFloat(parts[1]) || 24;
      var sortOrder = parts[2] || "numeric";
      
      // 在这里实现预览逻辑
      
      return "正在预览...";
    } catch (error) {
      return "预览错误: " + error.toString();
    }
  }
};

// this file should contain jsx-code that can run in all apps
// like polyfills of e.g. JSON
