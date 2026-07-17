export type OmekaQualitySeverity = "warning" | "rejected";

export type OmekaQualityCode =
  | "OMEKA_UNKNOWN_TEMPLATE"
  | "OMEKA_MISSING_REQUIRED_FIELD"
  | "OMEKA_INVALID_VALUE"
  | "OMEKA_UNRESOLVED_REFERENCE";

export interface OmekaQualityIssue {
  readonly severity: OmekaQualitySeverity;
  readonly code: OmekaQualityCode;
  readonly omekaId: number | null;
  readonly templateLabel: string | null;
  readonly field?: string;
  readonly message: string;
}

export interface OmekaQualityReportSnapshot {
  readonly issues: readonly OmekaQualityIssue[];
  readonly rejectedCount: number;
  readonly warningCount: number;
}

export class OmekaQualityReport {
  private readonly issues: OmekaQualityIssue[] = [];

  public warn(issue: Omit<OmekaQualityIssue, "severity">): void {
    this.issues.push({ ...issue, severity: "warning" });
  }

  public reject(issue: Omit<OmekaQualityIssue, "severity">): void {
    this.issues.push({ ...issue, severity: "rejected" });
  }

  public snapshot(): OmekaQualityReportSnapshot {
    return {
      issues: [...this.issues],
      rejectedCount: this.issues.filter((issue) => issue.severity === "rejected").length,
      warningCount: this.issues.filter((issue) => issue.severity === "warning").length,
    };
  }
}
