import os
import shutil
import sys
import ctypes
import traceback
import json

def is_admin():
    """检查当前用户是否有管理员权限"""
    try:
        return ctypes.windll.shell32.IsUserAnAdmin() != 0
    except:
        return False

def create_debug_file(target_dir):
    """
    在目标目录创建.debug文件以启用CEP扩展调试
    """
    debug_content = {
        "PlayerDebugMode": 1,
        "CEF": {"remote-debugging-port": 8088},
        "ExtensionDevTools": {"CEF Command Line": "--allow-file-access-from-files --disable-web-security"}
    }
    
    debug_file_path = os.path.join(os.path.dirname(target_dir), '.debug')
    
    try:
        with open(debug_file_path, 'w') as f:
            json.dump(debug_content, f, indent=4)
        print(f"已创建调试文件: {debug_file_path}")
    except Exception as e:
        print(f"创建调试文件失败: {str(e)}")

def create_debug_html(target_dir):
    """
    创建调试辅助HTML文件
    """
    debug_html = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>CEP 扩展调试辅助</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 20px; }
        pre { background: #f4f4f4; padding: 10px; border-radius: 5px; }
        .error { color: red; }
        .success { color: green; }
    </style>
</head>
<body>
    <h2>CEP 扩展调试辅助</h2>
    <div id="debugInfo"></div>
    
    <script>
    // 捕获所有JavaScript错误
    window.onerror = function(message, source, line, column, error) {
        var debugInfo = document.getElementById('debugInfo');
        var errorDiv = document.createElement('div');
        errorDiv.className = 'error';
        errorDiv.innerHTML = '<h3>错误捕获:</h3><pre>' + 
            '错误: ' + message + '\\n' +
            '来源: ' + source + '\\n' + 
            '行号: ' + line + '\\n' +
            '列号: ' + column + '\\n' +
            '堆栈: ' + (error && error.stack ? error.stack : '无堆栈信息') + '</pre>';
        debugInfo.appendChild(errorDiv);
        return true; // 阻止默认错误处理
    };
    
    // 检查环境信息
    function checkEnvironment() {
        var debugInfo = document.getElementById('debugInfo');
        var infoDiv = document.createElement('div');
        
        try {
            var csInterface = new CSInterface();
            var appInfo = csInterface.getHostEnvironment();
            var extensionInfo = csInterface.getExtensionInfo();
            
            infoDiv.innerHTML = '<h3>环境信息:</h3><pre>' + 
                'Adobe应用: ' + appInfo.appName + ' (' + appInfo.appVersion + ')\\n' +
                '扩展ID: ' + extensionInfo.id + '\\n' +
                '扩展版本: ' + extensionInfo.version + '\\n' +
                '操作系统: ' + appInfo.appUILocale + '</pre>';
            infoDiv.className = 'success';
        } catch (e) {
            infoDiv.innerHTML = '<h3>环境信息:</h3><pre>获取信息时出错: ' + e.message + '</pre>';
            infoDiv.className = 'error';
        }
        
        debugInfo.appendChild(infoDiv);
    }
    
    // 尝试加载CSInterface
    function loadCSInterface() {
        var head = document.getElementsByTagName('head')[0];
        var script = document.createElement('script');
        script.type = 'text/javascript';
        script.onload = function() {
            var successDiv = document.createElement('div');
            successDiv.className = 'success';
            successDiv.textContent = 'CSInterface 加载成功!';
            document.getElementById('debugInfo').appendChild(successDiv);
            checkEnvironment();
        };
        script.onerror = function() {
            var errorDiv = document.createElement('div');
            errorDiv.className = 'error';
            errorDiv.textContent = 'CSInterface 加载失败!';
            document.getElementById('debugInfo').appendChild(errorDiv);
        };
        script.src = './CSInterface.js';
        head.appendChild(script);
    }
    
    // 页面加载完成后执行
    document.addEventListener('DOMContentLoaded', function() {
        loadCSInterface();
        
        // 检查类型转换问题
        var testDiv = document.createElement('div');
        testDiv.innerHTML = '<h3>常见类型错误测试:</h3>';
        
        try {
            // 测试一些常见的类型转换错误
            var tests = [
                { name: "数字到字符串", func: function() { return 123 + ""; } },
                { name: "字符串到数字", func: function() { return parseInt("123"); } },
                { name: "无效数字转换", func: function() { return parseInt("abc"); } },
                { name: "非数字比较", func: function() { return "123" == 123; } },
                { name: "严格类型比较", func: function() { return "123" === 123; } },
                { name: "空值解引用", func: function() { var obj = null; try { return obj.prop; } catch(e) { throw e; } } }
            ];
            
            var results = document.createElement('pre');
            for (var i = 0; i < tests.length; i++) {
                var test = tests[i];
                try {
                    var result = test.func();
                    results.innerHTML += test.name + ": " + result + " (类型: " + typeof(result) + ")\\n";
                } catch (e) {
                    results.innerHTML += test.name + ": 错误 - " + e.message + "\\n";
                }
            }
            testDiv.appendChild(results);
        } catch (e) {
            testDiv.innerHTML += '<pre class="error">测试执行失败: ' + e.message + '</pre>';
        }
        
        document.getElementById('debugInfo').appendChild(testDiv);
    });
    </script>
</body>
</html>
    """
    
    debug_file_path = os.path.join(target_dir, 'debug.html')
    
    try:
        with open(debug_file_path, 'w', encoding='utf-8') as f:
            f.write(debug_html)
        print(f"已创建调试辅助页面: {debug_file_path}")
    except Exception as e:
        print(f"创建调试辅助页面失败: {str(e)}")

def enable_system_debug():
    """
    修改系统级调试设置
    """
    try:
        # 适用于Windows系统
        import winreg
        
        # 打开注册表
        key_path = r"SOFTWARE\Adobe\CSXS.11"
        try:
            key = winreg.OpenKey(winreg.HKEY_CURRENT_USER, key_path, 0, winreg.KEY_SET_VALUE)
        except FileNotFoundError:
            key = winreg.CreateKey(winreg.HKEY_CURRENT_USER, key_path)
        
        # 设置调试模式
        winreg.SetValueEx(key, "PlayerDebugMode", 0, winreg.REG_SZ, "1")
        winreg.CloseKey(key)
        print("已启用系统调试模式 (PlayerDebugMode=1)")
    except Exception as e:
        print(f"启用系统调试模式失败: {str(e)}")
        print("请手动修改注册表设置，将HKEY_CURRENT_USER\\SOFTWARE\\Adobe\\CSXS.11\\PlayerDebugMode设为1")

def create_images_directory(target_dir):
    """
    创建保存图像的目录
    """
    images_dir = os.path.join(target_dir, "copied_images")
    
    try:
        if not os.path.exists(images_dir):
            os.makedirs(images_dir)
            print(f"已创建图像存储目录: {images_dir}")
            
            # 创建一个示例README文件
            readme_path = os.path.join(images_dir, "README.txt")
            with open(readme_path, 'w', encoding='utf-8') as f:
                f.write("此文件夹用于存储图像序列文件。\n请将您的图像序列放置在这里以便加载。")
            print("已创建README文件")
    except Exception as e:
        print(f"创建图像目录失败: {str(e)}")

def copy_to_cep_extensions(source_dir, target_dir=r"C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\premiere_pro_plugin"):
    """
    将源目录中的所有文件复制到Adobe CEP扩展目录
    
    Args:
        source_dir: 源目录路径
        target_dir: 目标CEP扩展目录，默认为Adobe CEP扩展目录
    """
    # 检查管理员权限
    if not is_admin():
        print("警告: 复制到Program Files目录需要管理员权限!")
        print("请以管理员身份运行此脚本。")
        print("方法: 右键点击命令提示符或PowerShell，选择'以管理员身份运行'，然后执行此脚本。")
        return
    
    try:
        # 确保目标目录存在
        if not os.path.exists(target_dir):
            os.makedirs(target_dir)
        
        # 获取当前目录(如果没有提供源目录)
        if not source_dir:
            source_dir = os.getcwd()
        
        print(f"正在从 {source_dir} 复制文件到 {target_dir}...")
        
        # 获取源目录中的所有项目
        items = os.listdir(source_dir)
        
        # 复制每个项目到目标目录
        for item in items:
            s = os.path.join(source_dir, item)
            d = os.path.join(target_dir, item)
            
            # 跳过特定目录和文件
            if item in ["py tool", ".git", "__pycache__", ".vscode"]:
                print(f"跳过: {item}")
                continue
            
            try:
                # 如果是目录，递归复制
                if os.path.isdir(s):
                    if os.path.exists(d):
                        shutil.rmtree(d)
                    shutil.copytree(s, d)
                    print(f"已复制目录: {item}")
                # 如果是文件，直接复制
                else:
                    shutil.copy2(s, d)
                    print(f"已复制文件: {item}")
            except Exception as e:
                print(f"复制 {item} 时出错: {str(e)}")
        
        print(f"完成! 所有文件已成功复制到 {target_dir}")
        
        # 创建调试文件
        create_debug_file(target_dir)
        
        # 创建调试辅助HTML文件
        create_debug_html(target_dir)
        
        # 创建图像存储目录
        create_images_directory(target_dir)
        
        # 启用系统调试模式
        # enable_system_debug()
        
        print("\n调试说明:")
        print("1. 插件文件已复制到扩展目录")
        print("2. 调试模式已启用")
        print("3. 启动Premiere Pro后，使用Chrome浏览器访问 http://localhost:8088 可连接调试工具")
        print("4. 在'chrome://inspect/#devices'页面中也可以找到扩展的调试目标")
        print("\n类型错误调试指南:")
        print("1. AlertException:TypeError 通常表示JavaScript中发生了类型不匹配错误")
        print("2. 常见原因:")
        print("   - 尝试将不兼容的类型进行转换")
        print("   - 调用了不存在的方法或属性")
        print("   - 传递了错误类型的参数到Adobe API函数")
        print("   - 尝试访问null或undefined对象的属性")
        print("3. 解决方法:")
        print("   - 使用调试器检查变量类型和值")
        print("   - 在可能出错的地方添加try/catch块")
        print("   - 使用typeof或instanceof运算符检查类型")
        print("   - 确保在使用对象前检查其是否为null")
        print("4. 访问扩展中的debug.html页面查看更多调试信息")
    
    except Exception as e:
        print(f"发生错误: {str(e)}")
        traceback.print_exc()

if __name__ == "__main__":
    # 使用当前目录作为源目录
    source_directory = os.getcwd()
    
    # 目标CEP扩展目录
    target_directory = r"C:\Program Files (x86)\Common Files\Adobe\CEP\extensions\premiere_pro_plugin"
    
    # 执行复制操作
    copy_to_cep_extensions(source_directory, target_directory)
