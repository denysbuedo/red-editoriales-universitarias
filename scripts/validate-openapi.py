from pathlib import Path

from openapi_spec_validator import validate
from yaml import safe_load


OPENAPI_FILES = [
    "openapi/pnpu-portal.openapi.yml",
]


def main() -> None:
    root = Path(__file__).resolve().parents[1]

    for relative_path in OPENAPI_FILES:
        path = root / relative_path
        with path.open("r", encoding="utf-8") as file:
            document = safe_load(file)
        validate(document)

    print("OpenAPI validation passed.")


if __name__ == "__main__":
    main()
