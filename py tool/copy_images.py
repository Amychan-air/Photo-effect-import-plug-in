import os
import shutil
import json

def copy_image(source_path, destination_path):
    """复制图像文件从源路径到目标路径"""
    try:
        # 确保目标文件夹存在
        os.makedirs(os.path.dirname(destination_path), exist_ok=True)
        
        # 复制文件
        shutil.copy2(source_path, destination_path)
        print(f"成功：文件已从 {source_path} 复制到 {destination_path}")
        return True
    except Exception as e:
        print(f"错误：无法复制文件 - {str(e)}")
        return False

def copy_images_from_json(json_file_path):
    """从JSON文件中读取路径信息并复制图像"""
    try:
        # 明确指定使用utf-8编码读取JSON文件
        with open(json_file_path, 'r', encoding='utf-8') as f:
            source_paths = json.load(f)
        
        if not isinstance(source_paths, list):
            print("错误：JSON文件必须包含路径字符串列表")
            return
            
        # 创建目标目录
        output_dir = "./copied_images"
        os.makedirs(output_dir, exist_ok=True)
        
        # 遍历所有源路径
        for source_path in source_paths:
            if isinstance(source_path, str) and os.path.exists(source_path):
                # 获取文件名
                filename = os.path.basename(source_path)
                
                # 提取目录结构的最后一部分作为子文件夹
                # 例如: .../AmazingFeature/seq/1-bg/1-bg_00001.png
                # 将保存在 ./copied_images/1-bg/1-bg_00001.png
                parts = source_path.replace('\\', '/').split('/')
                if len(parts) >= 2:
                    subfolder = parts[-2]  # 获取文件所在的目录名
                    destination_dir = os.path.join(output_dir, subfolder)
                else:
                    destination_dir = output_dir
                
                os.makedirs(destination_dir, exist_ok=True)
                
                # 构建目标路径
                destination_path = os.path.join(destination_dir, filename)
                
                # 复制文件
                copy_image(source_path, destination_path)
            else:
                print(f"警告：源路径无效或不存在 - {source_path}")
                
    except Exception as e:
        print(f"错误：处理JSON文件时出错 - {str(e)}")

json_file_path = "image_list.json"
copy_images_from_json(json_file_path)
