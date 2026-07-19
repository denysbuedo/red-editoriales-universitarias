from __future__ import annotations

import argparse
import json
import re
import sys
import tempfile
import zipfile
from collections import Counter
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from xml.etree import ElementTree


SPREADSHEET_NS = {"x": "http://schemas.openxmlformats.org/spreadsheetml/2006/main"}
REL_NS = {"r": "http://schemas.openxmlformats.org/package/2006/relationships"}
OFFICE_REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"

EXPECTED_COLUMNS = {
    1: "isbn",
    2: "title",
    3: "primaryContributor",
    4: "publisher",
    5: "genreOrPublicationType",
    6: "format",
    7: "publicationDate",
}

PNPU_ENRICHMENT_FIELDS = [
    "pnpuUuid",
    "language",
    "subjects",
    "license",
    "digitalResourceUrl",
    "publisherAuthorityId",
]


@dataclass(frozen=True)
class SpreadsheetRow:
    row_number: int
    isbn: str
    title: str
    primary_contributor: str
    publisher: str
    genre_or_publication_type: str
    format: str
    publication_date: str

    def as_mapping(self) -> dict[str, str]:
        return {
            "isbn": self.isbn,
            "title": self.title,
            "primaryContributor": self.primary_contributor,
            "publisher": self.publisher,
            "genreOrPublicationType": self.genre_or_publication_type,
            "format": self.format,
            "publicationDate": self.publication_date,
        }


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Diagnostica una tabla XLSX de publicaciones entregada por editoriales."
    )
    parser.add_argument("path", nargs="?", help="Ruta del archivo .xlsx a diagnosticar.")
    parser.add_argument("--json", action="store_true", help="Emite el diagnostico como JSON.")
    parser.add_argument("--sheet", default="EDUNIV", help="Nombre de la hoja principal.")
    parser.add_argument("--self-test", action="store_true", help="Ejecuta autopruebas del parser.")
    args = parser.parse_args()

    try:
        if args.self_test:
            run_self_test()
            print("OK: publication spreadsheet parser self-test passed")
            return 0

        if args.path is None:
            raise ValueError("Debe indicar la ruta de un archivo .xlsx.")

        diagnostics = diagnose_workbook(Path(args.path), args.sheet)

        if args.json:
            print(json.dumps(diagnostics, ensure_ascii=False, indent=2))
        else:
            print_human_diagnostics(diagnostics)

        return 0 if diagnostics["summary"]["invalidIsbnCount"] == 0 else 1
    except Exception as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


def diagnose_workbook(path: Path, sheet_name: str = "EDUNIV") -> dict[str, Any]:
    if not path.exists():
        raise FileNotFoundError(f"No existe el archivo: {path}")

    with zipfile.ZipFile(path) as archive:
        shared_strings = read_shared_strings(archive)
        sheet_path = find_sheet_path(archive, sheet_name)
        rows = read_publication_rows(archive, sheet_path, shared_strings)

    missing_by_field = {
        field: sum(1 for row in rows if row.as_mapping()[field].strip() == "")
        for field in EXPECTED_COLUMNS.values()
    }
    invalid_isbn_rows = [
        {
            "row": row.row_number,
            "isbn": row.isbn,
            "title": row.title,
        }
        for row in rows
        if row.isbn.strip() != "" and not is_valid_isbn(row.isbn)
    ]
    rows_with_required_fields = [
        row
        for row in rows
        if all(value.strip() != "" for value in row.as_mapping().values()) and is_valid_isbn(row.isbn)
    ]

    return {
        "source": str(path),
        "sheet": sheet_name,
        "summary": {
            "rowCount": len(rows),
            "rowsWithRequiredSpreadsheetFields": len(rows_with_required_fields),
            "missingFieldCount": sum(missing_by_field.values()),
            "invalidIsbnCount": len(invalid_isbn_rows),
            "missingPnpuEnrichmentFields": PNPU_ENRICHMENT_FIELDS,
        },
        "missingByField": missing_by_field,
        "invalidIsbnRows": invalid_isbn_rows[:20],
        "distinctValues": {
            "publishers": top_values(row.publisher for row in rows),
            "genresOrPublicationTypes": top_values(row.genre_or_publication_type for row in rows),
            "formats": top_values(split_values(row.format) for row in rows),
            "publicationDates": top_values(row.publication_date for row in rows),
        },
        "mappingAssessment": {
            "canPublishDirectlyToPnpu": False,
            "reason": (
                "La tabla no contiene todos los campos obligatorios del modelo PNPU: "
                + ", ".join(PNPU_ENRICHMENT_FIELDS)
            ),
            "recommendedNextStep": "Completar enriquecimiento y mapear contra Omeka S o el flujo aprobado.",
        },
    }


def read_shared_strings(archive: zipfile.ZipFile) -> list[str]:
    try:
        root = ElementTree.fromstring(archive.read("xl/sharedStrings.xml"))
    except KeyError:
        return []

    values: list[str] = []
    for item in root.findall("x:si", SPREADSHEET_NS):
        texts = [node.text or "" for node in item.findall(".//x:t", SPREADSHEET_NS)]
        values.append("".join(texts))

    return values


def find_sheet_path(archive: zipfile.ZipFile, sheet_name: str) -> str:
    workbook = ElementTree.fromstring(archive.read("xl/workbook.xml"))
    relationships = ElementTree.fromstring(archive.read("xl/_rels/workbook.xml.rels"))
    relationship_by_id = {
        relationship.attrib["Id"]: relationship.attrib["Target"]
        for relationship in relationships.findall("r:Relationship", REL_NS)
    }

    for sheet in workbook.findall(".//x:sheet", SPREADSHEET_NS):
        if sheet.attrib.get("name") != sheet_name:
            continue

        relationship_id = sheet.attrib.get(f"{{{OFFICE_REL_NS}}}id")
        if relationship_id is None or relationship_id not in relationship_by_id:
            raise ValueError(f"La hoja {sheet_name} no tiene relacion de archivo valida.")

        target = relationship_by_id[relationship_id]
        return f"xl/{target}" if not target.startswith("xl/") else target

    raise ValueError(f"No se encontro la hoja {sheet_name}.")


def read_publication_rows(
    archive: zipfile.ZipFile, sheet_path: str, shared_strings: list[str]
) -> list[SpreadsheetRow]:
    root = ElementTree.fromstring(archive.read(sheet_path))
    rows: list[SpreadsheetRow] = []

    for row_node in root.findall(".//x:sheetData/x:row", SPREADSHEET_NS):
        row_number = int(row_node.attrib.get("r", "0"))
        if row_number <= 1:
            continue

        values = {field: "" for field in EXPECTED_COLUMNS.values()}
        for cell in row_node.findall("x:c", SPREADSHEET_NS):
            column = column_index(cell.attrib.get("r", ""))
            field = EXPECTED_COLUMNS.get(column)

            if field is not None:
                values[field] = cell_value(cell, shared_strings).strip()

        if "".join(values.values()).strip() == "":
            continue

        rows.append(
            SpreadsheetRow(
                row_number=row_number,
                isbn=values["isbn"],
                title=values["title"],
                primary_contributor=values["primaryContributor"],
                publisher=values["publisher"],
                genre_or_publication_type=values["genreOrPublicationType"],
                format=values["format"],
                publication_date=values["publicationDate"],
            )
        )

    return rows


def column_index(reference: str) -> int:
    letters = re.sub(r"[^A-Z]", "", reference.upper())
    number = 0

    for letter in letters:
        number = number * 26 + ord(letter) - ord("A") + 1

    return number


def cell_value(cell: ElementTree.Element, shared_strings: list[str]) -> str:
    value = cell.find("x:v", SPREADSHEET_NS)
    inline = cell.find("x:is/x:t", SPREADSHEET_NS)

    if inline is not None:
        return inline.text or ""

    if value is None or value.text is None:
        return ""

    if cell.attrib.get("t") == "s":
        return shared_strings[int(value.text)]

    return value.text


def is_valid_isbn(value: str) -> bool:
    normalized = re.sub(r"[^0-9Xx]", "", value).upper()

    if len(normalized) == 10:
        total = 0
        for index, char in enumerate(normalized):
            if char == "X" and index == 9:
                digit = 10
            elif char.isdigit():
                digit = int(char)
            else:
                return False
            total += digit * (10 - index)
        return total % 11 == 0

    if len(normalized) == 13 and normalized.isdigit():
        total = sum(int(char) * (1 if index % 2 == 0 else 3) for index, char in enumerate(normalized[:12]))
        check_digit = (10 - (total % 10)) % 10
        return check_digit == int(normalized[-1])

    return False


def split_values(value: str) -> list[str]:
    return [item.strip().lower() for item in value.split(",") if item.strip()]


def top_values(values: Any, limit: int = 20) -> list[dict[str, Any]]:
    counter: Counter[str] = Counter()

    for value in values:
        if isinstance(value, list):
            for item in value:
                if item:
                    counter[item] += 1
        elif isinstance(value, str) and value.strip():
            counter[value.strip()] += 1

    return [{"value": value, "count": count} for value, count in counter.most_common(limit)]


def print_human_diagnostics(diagnostics: dict[str, Any]) -> None:
    summary = diagnostics["summary"]

    print(f"Archivo: {diagnostics['source']}")
    print(f"Hoja: {diagnostics['sheet']}")
    print(f"Registros: {summary['rowCount']}")
    print(f"Filas con campos base completos: {summary['rowsWithRequiredSpreadsheetFields']}")
    print(f"Campos vacios acumulados: {summary['missingFieldCount']}")
    print(f"ISBN invalidos: {summary['invalidIsbnCount']}")
    print()
    print("Campos faltantes para publicacion PNPU completa:")
    for field in summary["missingPnpuEnrichmentFields"]:
        print(f"- {field}")
    print()
    print("Campos vacios por columna:")
    for field, count in diagnostics["missingByField"].items():
        print(f"- {field}: {count}")
    print()
    print("Valores principales:")
    for group, values in diagnostics["distinctValues"].items():
        print(f"- {group}:")
        for item in values[:10]:
            print(f"  - {item['value']}: {item['count']}")
    print()
    print(f"Publicacion directa en PNPU: {diagnostics['mappingAssessment']['canPublishDirectlyToPnpu']}")
    print(f"Causa: {diagnostics['mappingAssessment']['reason']}")


def run_self_test() -> None:
    with tempfile.TemporaryDirectory() as directory:
        workbook = Path(directory) / "sample.xlsx"
        create_test_workbook(workbook)
        diagnostics = diagnose_workbook(workbook)

    assert diagnostics["summary"]["rowCount"] == 2, "self-test row count mismatch"
    assert (
        diagnostics["summary"]["rowsWithRequiredSpreadsheetFields"] == 1
    ), "self-test complete row count mismatch"
    assert diagnostics["summary"]["invalidIsbnCount"] == 1, "self-test invalid ISBN count mismatch"
    assert diagnostics["missingByField"]["title"] == 0, "self-test missing title count mismatch"
    assert diagnostics["distinctValues"]["formats"][0] == {
        "value": "pdf",
        "count": 2,
    }, "self-test format counter mismatch"


def create_test_workbook(path: Path) -> None:
    shared_strings = [
        "isbn",
        "Titulo: subtitulo",
        "Primer autor o coordinador",
        "Editorial",
        "Genero / Tipo de publicacion",
        "Formato",
        "Fecha",
        "9789590000003",
        "Libro valido",
        "Juana Perez",
        "Editorial Universitaria",
        "Libros Universitarios",
        "pdf",
        "2026",
        "9789590000004",
        "Libro invalido",
    ]
    sheet = """<?xml version="1.0" encoding="UTF-8"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <sheetData>
    <row r="1">
      <c r="A1" t="s"><v>0</v></c><c r="B1" t="s"><v>1</v></c><c r="C1" t="s"><v>2</v></c><c r="D1" t="s"><v>3</v></c><c r="E1" t="s"><v>4</v></c><c r="F1" t="s"><v>5</v></c><c r="G1" t="s"><v>6</v></c>
    </row>
    <row r="2">
      <c r="A2" t="s"><v>7</v></c><c r="B2" t="s"><v>8</v></c><c r="C2" t="s"><v>9</v></c><c r="D2" t="s"><v>10</v></c><c r="E2" t="s"><v>11</v></c><c r="F2" t="s"><v>12</v></c><c r="G2" t="s"><v>13</v></c>
    </row>
    <row r="3">
      <c r="A3" t="s"><v>14</v></c><c r="B3" t="s"><v>15</v></c><c r="C3" t="s"><v>9</v></c><c r="D3" t="s"><v>10</v></c><c r="E3" t="s"><v>11</v></c><c r="F3" t="s"><v>12</v></c><c r="G3" t="s"><v>13</v></c>
    </row>
  </sheetData>
</worksheet>
"""
    with zipfile.ZipFile(path, "w") as archive:
        archive.writestr(
            "xl/workbook.xml",
            """<?xml version="1.0" encoding="UTF-8"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets><sheet name="EDUNIV" sheetId="1" r:id="rId1"/></sheets>
</workbook>
""",
        )
        archive.writestr(
            "xl/_rels/workbook.xml.rels",
            """<?xml version="1.0" encoding="UTF-8"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
</Relationships>
""",
        )
        archive.writestr("xl/worksheets/sheet1.xml", sheet)
        archive.writestr(
            "xl/sharedStrings.xml",
            '<sst xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">'
            + "".join(f"<si><t>{escape_xml(value)}</t></si>" for value in shared_strings)
            + "</sst>",
        )


def escape_xml(value: str) -> str:
    return (
        value.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace('"', "&quot;")
    )


if __name__ == "__main__":
    raise SystemExit(main())
