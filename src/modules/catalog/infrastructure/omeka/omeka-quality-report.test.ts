import { describe, expect, it } from "vitest";

import { OmekaQualityReport } from "./omeka-quality-report";

describe("OmekaQualityReport", () => {
  it("records warnings and rejections with counters", () => {
    const report = new OmekaQualityReport();

    report.warn({
      code: "OMEKA_UNKNOWN_TEMPLATE",
      omekaId: 10,
      templateLabel: "Other Template",
      message: "Resource template is not part of PNPU mapping.",
    });
    report.reject({
      code: "OMEKA_MISSING_REQUIRED_FIELD",
      omekaId: 20,
      templateLabel: "PNPU Publication",
      field: "dcterms:title",
      message: "Publication title is required.",
    });

    expect(report.snapshot()).toEqual({
      warningCount: 1,
      rejectedCount: 1,
      issues: [
        {
          severity: "warning",
          code: "OMEKA_UNKNOWN_TEMPLATE",
          omekaId: 10,
          templateLabel: "Other Template",
          message: "Resource template is not part of PNPU mapping.",
        },
        {
          severity: "rejected",
          code: "OMEKA_MISSING_REQUIRED_FIELD",
          omekaId: 20,
          templateLabel: "PNPU Publication",
          field: "dcterms:title",
          message: "Publication title is required.",
        },
      ],
    });
  });
});
