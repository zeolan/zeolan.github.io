import yaml
import sys
from pathlib import Path

def check_yaml_file(file_path: Path) -> bool:
    try:
        with file_path.open("r", encoding="utf=8") as f:
            yaml.safe_load(f)
        print(f"[OK] {file_path} is valid YAML.")
        return True
    except yaml.YAMLError as e:
        print(f"[ERROR] {file_path} has a syntax error:\n{e}")
        return False

def check_directory(dir_path: Path) -> bool:
    if not dir_path.is_dir():
        print(f"[SKIP] {dir_path} is not a directory.")
        return False

    all_valid = True
    for file in list(dir_path.rglob("*.yml")) + list(dir_path.rglob("*.yaml")):
        if not check_yaml_file(file):
            all_valid = False
    return all_valid

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python check_yaml.py <directory_path>")
        sys.exit(1)

    dir_path = Path(sys.argv[1])
    success = check_directory(dir_path)

    if not success:
        sys.exit(1)   # return error if any file invalid
    else:
        sys.exit(0)   # success if all files valid
