from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

from jsonschema import Draft202012Validator, FormatChecker
from referencing import Registry, Resource
from rdflib import Graph, Namespace
from pyshacl import validate


ROOT = Path(__file__).resolve().parents[1]
SCHEMA_DIR = ROOT / "schemas"
JSON_SCHEMA_DIR = SCHEMA_DIR / "json-schema"
JSONLD_CONTEXT_DIR = SCHEMA_DIR / "jsonld-context"
SHACL_DIR = SCHEMA_DIR / "shacl"
EXAMPLES_DIR = SCHEMA_DIR / "examples"

BIBO = Namespace("http://purl.org/ontology/bibo/")


class ValidationFailure(Exception):
    pass


def load_json(path: Path) -> Any:
    with path.open("r", encoding="utf-8") as file:
        return json.load(file)


def build_registry() -> Registry:
    resources: list[tuple[str, Resource]] = []

    for path in sorted(JSON_SCHEMA_DIR.glob("*.schema.json")):
        schema = load_json(path)
        resource = Resource.from_contents(schema)
        resources.append((path.as_uri(), resource))
        if "$id" in schema:
            resources.append((schema["$id"], resource))

    return Registry().with_resources(resources)


def validator_for(schema_name: str, registry: Registry) -> Draft202012Validator:
    schema = load_json(JSON_SCHEMA_DIR / schema_name)
    Draft202012Validator.check_schema(schema)
    return Draft202012Validator(
        schema,
        registry=registry,
        format_checker=FormatChecker(),
    )


def iter_values(value: Any, key: str):
    if isinstance(value, dict):
        for item_key, item_value in value.items():
            if item_key == key:
                yield item_value
            yield from iter_values(item_value, key)
    elif isinstance(value, list):
        for item in value:
            yield from iter_values(item, key)


def is_valid_isbn10(value: str) -> bool:
    if len(value) != 10:
        return False
    total = 0
    for index, char in enumerate(value):
        if char == "X" and index == 9:
            digit = 10
        elif char.isdigit():
            digit = int(char)
        else:
            return False
        total += digit * (10 - index)
    return total % 11 == 0


def is_valid_isbn13(value: str) -> bool:
    if len(value) != 13 or not value.isdigit():
        return False
    total = sum(int(char) * (1 if index % 2 == 0 else 3) for index, char in enumerate(value[:12]))
    check_digit = (10 - (total % 10)) % 10
    return check_digit == int(value[-1])


def is_valid_isbn(value: str) -> bool:
    return is_valid_isbn10(value) if len(value) == 10 else is_valid_isbn13(value)


def validate_json_schemas(registry: Registry) -> None:
    for path in sorted(JSON_SCHEMA_DIR.glob("*.schema.json")):
        schema = load_json(path)
        Draft202012Validator.check_schema(schema)
        Resource.from_contents(schema)
        print(f"OK JSON Schema: {path.relative_to(ROOT)}")


def validate_jsonld_contexts() -> None:
    for path in sorted(JSONLD_CONTEXT_DIR.glob("*.jsonld")):
        graph = Graph()
        graph.parse(path, format="json-ld")
        print(f"OK JSON-LD: {path.relative_to(ROOT)}")


def validate_turtle_syntax() -> None:
    for path in sorted(SHACL_DIR.glob("*.ttl")):
        graph = Graph()
        graph.parse(path, format="turtle")
        print(f"OK Turtle: {path.relative_to(ROOT)}")


def validate_shacl_shapes_are_structural() -> None:
    for path in sorted(SHACL_DIR.glob("*.ttl")):
        shapes = Graph()
        shapes.parse(path, format="turtle")
        conforms, _, report_text = validate(
            data_graph=Graph(),
            shacl_graph=shapes,
            inference="rdfs",
            abort_on_first=False,
            allow_infos=True,
            allow_warnings=True,
        )
        if not conforms:
            raise ValidationFailure(f"SHACL shape structural validation failed for {path}:\n{report_text}")
        print(f"OK SHACL structural: {path.relative_to(ROOT)}")


def validate_json_example(path: Path, schema_name: str, should_pass: bool, registry: Registry) -> None:
    instance = load_json(path)
    validator = validator_for(schema_name, registry)
    errors = sorted(validator.iter_errors(instance), key=lambda error: list(error.path))

    isbn_errors = [
        f"{isbn!r} has an invalid ISBN check digit"
        for isbn in list(iter_values(instance, "isbn")) + list(iter_values(instance, "eisbn"))
        if isinstance(isbn, str) and not is_valid_isbn(isbn)
    ]

    if should_pass and (errors or isbn_errors):
        details = "\n".join([error.message for error in errors] + isbn_errors)
        raise ValidationFailure(f"Expected valid JSON example to pass: {path}\n{details}")

    if not should_pass and not errors and not isbn_errors:
        raise ValidationFailure(f"Expected invalid JSON example to fail: {path}")

    result = "valid" if should_pass else "invalid"
    print(f"OK JSON example ({result}): {path.relative_to(ROOT)}")


def validate_json_examples(registry: Registry) -> None:
    validate_json_example(EXAMPLES_DIR / "publication.valid.json", "publication.schema.json", True, registry)
    validate_json_example(EXAMPLES_DIR / "publication.invalid.json", "publication.schema.json", False, registry)
    validate_json_example(EXAMPLES_DIR / "contributor.valid.json", "contributor.schema.json", True, registry)
    validate_json_example(EXAMPLES_DIR / "contributor.invalid.json", "contributor.schema.json", False, registry)


def parse_jsonld_examples() -> None:
    for path in sorted(EXAMPLES_DIR.glob("*.json")):
        graph = Graph()
        graph.parse(path, format="json-ld", publicID=path.as_uri())
        print(f"OK JSON-LD example: {path.relative_to(ROOT)}")


def validate_turtle_example(path: Path, shape_path: Path, should_pass: bool) -> None:
    data_graph = Graph()
    data_graph.parse(path, format="turtle")

    shapes = Graph()
    shapes.parse(shape_path, format="turtle")

    conforms, _, report_text = validate(
        data_graph=data_graph,
        shacl_graph=shapes,
        inference="rdfs",
        abort_on_first=False,
        allow_infos=True,
        allow_warnings=True,
    )

    isbn_errors = [
        f"{isbn} has an invalid ISBN check digit"
        for isbn in data_graph.objects(None, BIBO.isbn)
        if not is_valid_isbn(str(isbn))
    ]

    passed = conforms and not isbn_errors
    if should_pass and not passed:
        details = "\n".join(isbn_errors + [report_text])
        raise ValidationFailure(f"Expected valid Turtle example to pass: {path}\n{details}")

    if not should_pass and passed:
        raise ValidationFailure(f"Expected invalid Turtle example to fail: {path}")

    result = "valid" if should_pass else "invalid"
    print(f"OK SHACL example ({result}): {path.relative_to(ROOT)}")


def validate_turtle_examples() -> None:
    validate_turtle_example(EXAMPLES_DIR / "publication.valid.ttl", SHACL_DIR / "publication.ttl", True)
    validate_turtle_example(EXAMPLES_DIR / "publication.invalid.ttl", SHACL_DIR / "publication.ttl", False)
    validate_turtle_example(EXAMPLES_DIR / "contributor.valid.ttl", SHACL_DIR / "contributor.ttl", True)
    validate_turtle_example(EXAMPLES_DIR / "contributor.invalid.ttl", SHACL_DIR / "contributor.ttl", False)


def main() -> int:
    try:
        registry = build_registry()
        validate_json_schemas(registry)
        validate_json_examples(registry)
        validate_jsonld_contexts()
        parse_jsonld_examples()
        validate_turtle_syntax()
        validate_shacl_shapes_are_structural()
        validate_turtle_examples()
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    print("OK: schema validation completed")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
