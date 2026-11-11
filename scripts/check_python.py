from pathlib import Path


def main() -> None:
    files = sorted(Path("templates").rglob("*.py")) + sorted(Path("scripts").glob("*.py"))
    failures: list[str] = []
    for path in files:
        try:
            compile(path.read_text(encoding="utf-8"), str(path), "exec")
        except Exception as exc:
            failures.append(f"{path}: {exc}")
    if failures:
        raise SystemExit("Python syntax errors:\n" + "\n".join(failures))
    print(f"Python syntax OK: {len(files)} files")


if __name__ == "__main__":
    main()
