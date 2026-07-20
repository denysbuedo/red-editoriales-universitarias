import { describe, expect, it } from "vitest";

import {
  authorizeEditorialScopedAccess,
  readEditorialAccessConfig,
  readEditorialPublisherIds,
  readOidcRoles,
} from "./editorial-access";

const config = {
  adminRole: "pnpu-admin",
  clientId: "pnpu-portal",
  coordinatorRole: "pnpu-editorial-coordinator",
  editorRole: "pnpu-editorial-metadata-editor",
  reviewerRole: "pnpu-editorial-reviewer",
  viewerRole: "pnpu-editorial-viewer",
};

describe("editorial access control", () => {
  it("reads roles from realm, client and group claims", () => {
    expect(
      readOidcRoles(
        {
          groups: ["pnpu-editorial-viewer"],
          realm_access: {
            roles: ["pnpu-admin"],
          },
          resource_access: {
            "pnpu-portal": {
              roles: ["pnpu-editorial-coordinator"],
            },
          },
        },
        "pnpu-portal",
      ),
    ).toEqual(["pnpu-admin", "pnpu-editorial-coordinator", "pnpu-editorial-viewer"]);
  });

  it("reads editorial scope from supported publisher claim names", () => {
    expect(
      readEditorialPublisherIds({
        pnpu_editorial_id: "publisher-1",
        pnpu_editorial_ids: ["publisher-2", "publisher-3 publisher-4"],
        publisher_ids: "publisher-5,publisher-6",
      }),
    ).toEqual([
      "publisher-1",
      "publisher-2",
      "publisher-3",
      "publisher-4",
      "publisher-5",
      "publisher-6",
    ]);
  });

  it("allows a coordinator to submit only for an assigned editorial", () => {
    expect(
      authorizeEditorialScopedAccess(
        {
          pnpu_editorial_ids: ["publisher-eduniv"],
          realm_access: {
            roles: ["pnpu-editorial-coordinator"],
          },
        },
        {
          operation: "submit",
          publisherId: "publisher-eduniv",
        },
        config,
      ),
    ).toMatchObject({
      allowed: true,
      matchedRoles: ["pnpu-editorial-coordinator"],
      publisherIds: ["publisher-eduniv"],
    });

    expect(
      authorizeEditorialScopedAccess(
        {
          pnpu_editorial_ids: ["publisher-eduniv"],
          realm_access: {
            roles: ["pnpu-editorial-coordinator"],
          },
        },
        {
          operation: "submit",
          publisherId: "publisher-oriente",
        },
        config,
      ).allowed,
    ).toBe(false);
  });

  it("allows metadata editors to edit but not submit", () => {
    const claims = {
      pnpu_editorial_ids: ["publisher-eduniv"],
      resource_access: {
        "pnpu-portal": {
          roles: ["pnpu-editorial-metadata-editor"],
        },
      },
    };

    expect(
      authorizeEditorialScopedAccess(
        claims,
        {
          operation: "edit",
          publisherId: "publisher-eduniv",
        },
        config,
      ).allowed,
    ).toBe(true);

    expect(
      authorizeEditorialScopedAccess(
        claims,
        {
          operation: "submit",
          publisherId: "publisher-eduniv",
        },
        config,
      ).allowed,
    ).toBe(false);
  });

  it("allows viewers to view but not review", () => {
    const claims = {
      pnpu_editorial_ids: ["publisher-eduniv"],
      groups: ["pnpu-editorial-viewer"],
    };

    expect(
      authorizeEditorialScopedAccess(
        claims,
        {
          operation: "view",
          publisherId: "publisher-eduniv",
        },
        config,
      ).allowed,
    ).toBe(true);

    expect(
      authorizeEditorialScopedAccess(
        claims,
        {
          operation: "review",
          publisherId: "publisher-eduniv",
        },
        config,
      ).allowed,
    ).toBe(false);
  });

  it("allows national administrators across all editorials", () => {
    expect(
      authorizeEditorialScopedAccess(
        {
          realm_access: {
            roles: ["pnpu-admin"],
          },
        },
        {
          operation: "submit",
          publisherId: "publisher-eduniv",
        },
        config,
      ),
    ).toMatchObject({
      allowed: true,
      matchedRoles: ["pnpu-admin"],
      publisherIds: [],
    });
  });

  it("reads configurable role names from environment", () => {
    expect(
      readEditorialAccessConfig({
        PNPU_ADMIN_REQUIRED_ROLE: "admin-total",
        PNPU_EDITORIAL_COORDINATOR_ROLE: "coord",
        PNPU_EDITORIAL_METADATA_EDITOR_ROLE: "metadata",
        PNPU_EDITORIAL_REVIEWER_ROLE: "reviewer",
        PNPU_EDITORIAL_VIEWER_ROLE: "viewer",
        PNPU_OIDC_CLIENT_ID: "portal",
      }),
    ).toEqual({
      adminRole: "admin-total",
      clientId: "portal",
      coordinatorRole: "coord",
      editorRole: "metadata",
      reviewerRole: "reviewer",
      viewerRole: "viewer",
    });
  });
});
