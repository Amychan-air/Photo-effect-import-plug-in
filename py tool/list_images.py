import os
import glob
from pathlib import Path
import json

# 定义图片文件扩展名
IMAGE_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.tiff', '.svg']

# 指定目录路径
cache_dir = r"C:\Users\User\AppData\Local\JianyingPro\User Data\Cache\effect"

def list_images(directory):
    """列出指定目录下的所有图片文件"""
    image_files = []
    
    # 确保目录存在
    if not os.path.exists(directory):
        print(f"目录不存在: {directory}")
        return image_files
    else:
        print(f"目录存在: {directory}")
        print(f"开始扫描图片文件...")
    
    # 计算目录中的文件总数
    all_files = []
    for root, dirs, files in os.walk(directory):
        all_files.extend([os.path.join(root, file) for file in files])
    
    print(f"总共找到 {len(all_files)} 个文件")
    
    # 遍历目录中的所有文件
    for ext in IMAGE_EXTENSIONS:
        # 使用glob模式匹配所有图片文件
        pattern = os.path.join(directory, f"**/*{ext}")
        found = glob.glob(pattern, recursive=True)
        image_files.extend(found)
        
        # 不区分大小写的扩展名也匹配
        pattern = os.path.join(directory, f"**/*{ext.upper()}")
        found_upper = glob.glob(pattern, recursive=True)
        image_files.extend(found_upper)
        
        if found or found_upper:
            print(f"找到 {len(found) + len(found_upper)} 个扩展名为 {ext} 的文件")
    
    # 去重
    image_files = list(set(image_files))
    
    # 按文件名排序
    image_files.sort(key=lambda x: os.path.basename(x).lower())
    
    return image_files

def main():
    print(f"开始检查目录: {cache_dir}")
    images = list_images(cache_dir)
    
    if not images:
        print(f"在 {cache_dir} 目录下没有找到图片文件")
        return
    
    # 将图片列表保存到JSON文件
    with open("image_list.json", 'w', encoding='utf-8') as f:
        json.dump(images, f, ensure_ascii=False, indent=2)
    print(f"\n已将 {len(images)} 个图片文件路径保存到: image_list.json")

if __name__ == "__main__":
    main() 