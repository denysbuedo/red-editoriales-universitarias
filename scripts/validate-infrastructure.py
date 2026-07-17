from pathlib import Path

import yaml


REQUIRED_FILES = [
    "infrastructure/inventories/dev/hosts.yml",
    "infrastructure/playbooks/provision.yml",
    "infrastructure/playbooks/deploy.yml",
    "infrastructure/playbooks/verify.yml",
    "infrastructure/playbooks/rollback.yml",
    "infrastructure/monitoring/prometheus.yml",
    "infrastructure/monitoring/alert-rules.yml",
    "infrastructure/roles/portal/defaults/main.yml",
    "infrastructure/roles/portal/handlers/main.yml",
    "infrastructure/roles/portal/tasks/main.yml",
    "infrastructure/roles/portal/templates/portal.env.j2",
    "infrastructure/roles/portal/templates/pnpu-portal.service.j2",
]

REQUIRED_GROUP_VARS = {
    "pnpu_catalog_repository",
    "pnpu_omeka_base_url",
    "pnpu_omeka_timeout_ms",
}


def load_yaml(path: Path) -> object:
    with path.open("r", encoding="utf-8") as file:
        return yaml.safe_load(file)


def main() -> None:
    root = Path(__file__).resolve().parents[1]

    for relative_path in REQUIRED_FILES:
        path = root / relative_path
        if not path.exists():
            raise FileNotFoundError(f"Required infrastructure file is missing: {relative_path}")

    for path in sorted((root / "infrastructure").rglob("*.yml")):
        load_yaml(path)

    inventory = load_yaml(root / "infrastructure/inventories/dev/hosts.yml")
    if not isinstance(inventory, dict) or "all" not in inventory:
        raise ValueError("Development inventory must define the 'all' group.")

    group_vars = load_yaml(root / "infrastructure/group_vars/all.yml.example")
    if not isinstance(group_vars, dict):
        raise ValueError("Infrastructure group vars example must be a YAML mapping.")

    missing_group_vars = REQUIRED_GROUP_VARS.difference(group_vars)
    if missing_group_vars:
        missing = ", ".join(sorted(missing_group_vars))
        raise ValueError(f"Infrastructure group vars example is missing: {missing}")

    if group_vars["pnpu_catalog_repository"] != "in-memory":
        raise ValueError("pnpu_catalog_repository must default to in-memory.")

    if not isinstance(group_vars["pnpu_omeka_timeout_ms"], int):
        raise ValueError("pnpu_omeka_timeout_ms must be an integer.")

    prometheus = load_yaml(root / "infrastructure/monitoring/prometheus.yml")
    if not isinstance(prometheus, dict) or "scrape_configs" not in prometheus:
        raise ValueError("Prometheus configuration must define scrape_configs.")

    alert_rules = load_yaml(root / "infrastructure/monitoring/alert-rules.yml")
    if not isinstance(alert_rules, dict) or "groups" not in alert_rules:
        raise ValueError("Prometheus alert rules must define groups.")

    print("Infrastructure YAML validation passed.")


if __name__ == "__main__":
    main()
