import os
import shutil
import sys

def clean_jsx_directory(jsx_dir, keep_files=None):
    """
    清除jsx目录下的无用文件，只保留指定的文件
    
    Args:
        jsx_dir: jsx目录的路径
        keep_files: 要保留的文件列表，如果为None，则使用默认列表
    """
    if not os.path.exists(jsx_dir):
        print(f"错误: 目录 {jsx_dir} 不存在!")
        return False
        
    # 默认保留的文件列表 - 只保留实际需要的JSX文件和相关配置
    if keep_files is None:
        keep_files = [
            "general.jsx",     # 实际的JSX脚本文件
            "jsconfig.json",   # VSCode配置文件
        ]
    
    # 默认保留的目录
    keep_dirs = [
        "PPRO",               # Premiere Pro特定脚本目录
    ]
    
    print(f"开始清理 {jsx_dir} 目录...")
    print(f"将保留以下文件: {', '.join(keep_files)}")
    print(f"将保留以下目录: {', '.join(keep_dirs)}")
    
    # 获取目录中的所有文件
    files = os.listdir(jsx_dir)
    
    # 计数器
    removed_count = 0
    kept_count = 0
    
    # 遍历并处理每个文件
    for item in files:
        item_path = os.path.join(jsx_dir, item)
        
        # 如果是目录
        if os.path.isdir(item_path):
            if item in keep_dirs:
                print(f"保留目录: {item}")
                kept_count += 1
            else:
                try:
                    # 删除目录
                    shutil.rmtree(item_path)
                    print(f"已删除目录: {item}")
                    removed_count += 1
                except Exception as e:
                    print(f"删除目录 {item} 时出错: {str(e)}")
        # 如果是文件
        else:
            # 检查是否应该保留该文件
            if item in keep_files:
                print(f"保留文件: {item}")
                kept_count += 1
            else:
                try:
                    # 删除文件
                    os.remove(item_path)
                    print(f"已删除文件: {item}")
                    removed_count += 1
                except Exception as e:
                    print(f"删除文件 {item} 时出错: {str(e)}")
    
    print(f"\n清理完成! 已删除 {removed_count} 个项目，保留 {kept_count} 个项目。")
    return True

if __name__ == "__main__":
    # 获取JSX目录路径
    current_dir = os.getcwd()
    jsx_directory = os.path.join(current_dir, "jsx")
    
    # 要保留的文件列表
    files_to_keep = [
        "general.jsx",      # 实际的JSX脚本文件
        "jsconfig.json",    # VSCode配置文件
    ]
    
    # 执行清理操作
    clean_jsx_directory(jsx_directory, files_to_keep) 