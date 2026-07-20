export interface EditorialAccessClaims {
  readonly groups?: readonly string[];
  readonly pnpu_editorial_id?: string;
  readonly pnpu_editorial_ids?: readonly string[] | string;
  readonly publisher_id?: string;
  readonly publisher_ids?: readonly string[] | string;
  readonly realm_access?: {
    readonly roles?: readonly string[];
  };
  readonly resource_access?: Record<
    string,
    {
      readonly roles?: readonly string[];
    }
  >;
}

export interface EditorialAccessConfig {
  readonly adminRole: string;
  readonly clientId: string;
  readonly coordinatorRole: string;
  readonly editorRole: string;
  readonly reviewerRole: string;
  readonly viewerRole: string;
}

export type EditorialAccessOperation = "edit" | "review" | "submit" | "view";

export interface EditorialAccessDecision {
  readonly allowed: boolean;
  readonly matchedRoles: readonly string[];
  readonly publisherIds: readonly string[];
}

const DEFAULT_ADMIN_ROLE = "pnpu-admin";
const DEFAULT_COORDINATOR_ROLE = "pnpu-editorial-coordinator";
const DEFAULT_EDITOR_ROLE = "pnpu-editorial-metadata-editor";
const DEFAULT_REVIEWER_ROLE = "pnpu-editorial-reviewer";
const DEFAULT_VIEWER_ROLE = "pnpu-editorial-viewer";

export function readEditorialAccessConfig(
  environment: Readonly<Record<string, string | undefined>>,
): EditorialAccessConfig {
  const clientId = readRequiredValue(environment.PNPU_OIDC_CLIENT_ID, "pnpu-portal");

  return {
    adminRole: readRequiredValue(environment.PNPU_ADMIN_REQUIRED_ROLE, DEFAULT_ADMIN_ROLE),
    clientId,
    coordinatorRole: readRequiredValue(
      environment.PNPU_EDITORIAL_COORDINATOR_ROLE,
      DEFAULT_COORDINATOR_ROLE,
    ),
    editorRole: readRequiredValue(
      environment.PNPU_EDITORIAL_METADATA_EDITOR_ROLE,
      DEFAULT_EDITOR_ROLE,
    ),
    reviewerRole: readRequiredValue(
      environment.PNPU_EDITORIAL_REVIEWER_ROLE,
      DEFAULT_REVIEWER_ROLE,
    ),
    viewerRole: readRequiredValue(environment.PNPU_EDITORIAL_VIEWER_ROLE, DEFAULT_VIEWER_ROLE),
  };
}

export function authorizeEditorialScopedAccess(
  claims: EditorialAccessClaims,
  command: {
    readonly operation: EditorialAccessOperation;
    readonly publisherId: string;
  },
  config: EditorialAccessConfig,
): EditorialAccessDecision {
  const roles = readOidcRoles(claims, config.clientId);
  const publisherIds = readEditorialPublisherIds(claims);
  const allowedRoles = readAllowedEditorialRoles(command.operation, config);
  const matchedRoles = allowedRoles.filter((role) => roles.includes(role));
  const hasNationalAdminRole = roles.includes(config.adminRole);
  const hasEditorialScope = publisherIds.includes(command.publisherId);
  const allowed = hasNationalAdminRole || (matchedRoles.length > 0 && hasEditorialScope);

  return {
    allowed,
    matchedRoles: hasNationalAdminRole ? [config.adminRole] : matchedRoles,
    publisherIds,
  };
}

export function readOidcRoles(claims: EditorialAccessClaims, clientId: string): readonly string[] {
  return distinct([
    ...(claims.realm_access?.roles ?? []),
    ...(claims.resource_access?.[clientId]?.roles ?? []),
    ...(claims.groups ?? []),
  ]);
}

export function readEditorialPublisherIds(claims: EditorialAccessClaims): readonly string[] {
  return distinct([
    ...normalizeClaimValues(claims.pnpu_editorial_id),
    ...normalizeClaimValues(claims.pnpu_editorial_ids),
    ...normalizeClaimValues(claims.publisher_id),
    ...normalizeClaimValues(claims.publisher_ids),
  ]);
}

function readAllowedEditorialRoles(
  operation: EditorialAccessOperation,
  config: EditorialAccessConfig,
): readonly string[] {
  if (operation === "submit") {
    return [config.coordinatorRole];
  }

  if (operation === "edit") {
    return [config.coordinatorRole, config.editorRole];
  }

  if (operation === "review") {
    return [config.coordinatorRole, config.editorRole, config.reviewerRole];
  }

  return [config.coordinatorRole, config.editorRole, config.reviewerRole, config.viewerRole];
}

function normalizeClaimValues(value: readonly string[] | string | undefined): readonly string[] {
  if (value === undefined) {
    return [];
  }

  if (typeof value === "string") {
    return splitClaimValue(value);
  }

  return value.flatMap(splitClaimValue);
}

function splitClaimValue(value: string): readonly string[] {
  return value
    .split(/[,\s]+/u)
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

function distinct(values: readonly string[]): readonly string[] {
  return Array.from(new Set(values));
}

function readRequiredValue(value: string | undefined, fallback: string): string {
  const normalized = value?.trim();

  return normalized !== undefined && normalized.length > 0 ? normalized : fallback;
}
