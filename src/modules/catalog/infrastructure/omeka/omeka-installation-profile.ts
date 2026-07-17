export interface OmekaVocabularyRequirement {
  readonly prefix: string;
  readonly namespaceUri: string;
  readonly label: string;
}

export interface OmekaTemplatePropertyRequirement {
  readonly term: string;
  readonly required: boolean;
}

export interface OmekaResourceTemplateRequirement {
  readonly label: string;
  readonly resourceType: "item" | "item_set" | "media";
  readonly properties: readonly OmekaTemplatePropertyRequirement[];
}

export interface OmekaInstallationProfile {
  readonly vocabularies: readonly OmekaVocabularyRequirement[];
  readonly resourceTemplates: readonly OmekaResourceTemplateRequirement[];
}

export const PNPU_OMEKA_INSTALLATION_PROFILE: OmekaInstallationProfile = {
  vocabularies: [
    {
      prefix: "dcterms",
      namespaceUri: "http://purl.org/dc/terms/",
      label: "Dublin Core",
    },
    {
      prefix: "bibo",
      namespaceUri: "http://purl.org/ontology/bibo/",
      label: "Bibliographic Ontology",
    },
    {
      prefix: "foaf",
      namespaceUri: "http://xmlns.com/foaf/0.1/",
      label: "Friend of a Friend",
    },
    {
      prefix: "schema",
      namespaceUri: "https://schema.org/",
      label: "Schema.org",
    },
    {
      prefix: "skos",
      namespaceUri: "http://www.w3.org/2004/02/skos/core#",
      label: "Simple Knowledge Organization System",
    },
    {
      prefix: "pnpu",
      namespaceUri: "https://pnpu.mes.gob.cu/ns#",
      label: "PNPU",
    },
  ],
  resourceTemplates: [
    {
      label: "PNPU Publication",
      resourceType: "item",
      properties: [
        required("pnpu:uuid"),
        required("dcterms:title"),
        optional("dcterms:alternative"),
        optional("dcterms:abstract"),
        required("dcterms:issued"),
        required("dcterms:language"),
        required("dcterms:type"),
        required("dcterms:format"),
        optional("dcterms:license"),
        required("dcterms:publisher"),
        required("dcterms:creator"),
        optional("dcterms:contributor"),
        required("dcterms:identifier"),
        optional("bibo:isbn"),
        optional("bibo:doi"),
        required("dcterms:subject"),
        optional("dcterms:isPartOf"),
        optional("schema:keywords"),
      ],
    },
    {
      label: "PNPU Contributor",
      resourceType: "item",
      properties: [
        required("pnpu:uuid"),
        required("foaf:name"),
        optional("foaf:givenName"),
        optional("foaf:familyName"),
        required("schema:roleName"),
        optional("schema:sameAs"),
        optional("schema:affiliation"),
        optional("schema:description"),
        optional("schema:nationality"),
      ],
    },
    {
      label: "PNPU Publisher",
      resourceType: "item",
      properties: [
        required("pnpu:uuid"),
        required("schema:name"),
        optional("dcterms:title"),
        optional("schema:alternateName"),
        optional("pnpu:publisherCode"),
        optional("dcterms:description"),
        required("schema:parentOrganization"),
        optional("schema:addressLocality"),
        required("schema:addressCountry"),
        optional("schema:url"),
        optional("schema:logo"),
        optional("schema:email"),
        optional("schema:telephone"),
        optional("schema:contactPoint"),
      ],
    },
    {
      label: "PNPU University",
      resourceType: "item",
      properties: [
        required("pnpu:uuid"),
        required("schema:name"),
        optional("schema:alternateName"),
        optional("pnpu:universityCode"),
        optional("schema:addressLocality"),
        required("schema:addressCountry"),
        optional("schema:url"),
      ],
    },
    {
      label: "PNPU Collection",
      resourceType: "item_set",
      properties: [
        required("pnpu:uuid"),
        required("dcterms:title"),
        required("dcterms:publisher"),
        optional("dcterms:description"),
        optional("pnpu:collectionCode"),
        optional("pnpu:editorialSeries"),
        optional("dcterms:subject"),
      ],
    },
    {
      label: "PNPU Subject",
      resourceType: "item",
      properties: [
        required("skos:notation"),
        optional("dcterms:identifier"),
        required("skos:prefLabel"),
        optional("schema:url"),
        optional("skos:broader"),
        optional("skos:related"),
      ],
    },
    {
      label: "PNPU Digital Resource",
      resourceType: "media",
      properties: [
        required("pnpu:resourceType"),
        required("dcterms:format"),
        optional("pnpu:fileSize"),
        optional("pnpu:checksum"),
        optional("dcterms:language"),
        optional("dcterms:license"),
      ],
    },
  ],
};

function required(term: string): OmekaTemplatePropertyRequirement {
  return { term, required: true };
}

function optional(term: string): OmekaTemplatePropertyRequirement {
  return { term, required: false };
}
