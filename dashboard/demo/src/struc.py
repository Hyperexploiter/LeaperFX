import os
from pathlib import Path
from typing import Union


class DirectoryTree:
    def __init__(self, root_dir: Union[str, Path]):
        self.root_dir = Path(root_dir)
        self.tree_str = ""
        self.indent = "    "
        self.branch = "│   "
        self.tee = "├── "
        self.last = "└── "

    def generate_tree(self) -> str:
        """Generate the directory tree structure."""
        self.tree_str = f"{self.root_dir}\n"
        self._walk_directory(self.root_dir, "")
        return self.tree_str

    def _walk_directory(self, current_path: Path, prefix: str):
        """Recursively walk through directories and files."""
        # Get directories and files, sorted alphabetically
        entries = sorted(list(os.scandir(current_path)),
                         key=lambda e: e.name.lower())

        # Filter out hidden files/directories (starting with '.')
        entries = [e for e in entries if not e.name.startswith('.')]

        # Process each entry
        for idx, entry in enumerate(entries):
            is_last = idx == len(entries) - 1
            connector = self.last if is_last else self.tee

            # Add entry to tree
            self.tree_str += f"{prefix}{connector}{entry.name}\n"

            # Recursively process directories
            if entry.is_dir():
                next_prefix = prefix + ("    " if is_last else self.branch)
                self._walk_directory(entry.path, next_prefix)


def print_directory_tree(path: Union[str, Path]):
    """Print the directory tree for the given path."""
    try:
        tree = DirectoryTree(path)
        print(tree.generate_tree())
    except Exception as e:
        print(f"Error generating directory tree: {str(e)}")


if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(
        description="Generate a directory tree structure"
    )
    parser.add_argument(
        "path",
        nargs="?",
        default=".",
        help="Path to the directory (default: current directory)"
    )

    args = parser.parse_args()
    print_directory_tree(args.path)
