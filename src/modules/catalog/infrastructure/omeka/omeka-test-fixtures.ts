import { OmekaJsonObject } from "./omeka-api-client";
import { OmekaCatalogSnapshot } from "./omeka-catalog-snapshot-loader";
import { OMEKA_PNPU_RESOURCE_TEMPLATES } from "./omeka-resource-template-classifier";

export function createCompleteOmekaCatalogSnapshot(): OmekaCatalogSnapshot {
  const subject = omekaResource(10, OMEKA_PNPU_RESOURCE_TEMPLATES.subject, {
    "skos:notation": literals("37.01"),
    "skos:prefLabel": literals("Educacion superior"),
  });
  const contributor = omekaResource(20, OMEKA_PNPU_RESOURCE_TEMPLATES.contributor, {
    "pnpu:uuid": literals("01990f5a-0000-7000-8000-000000000201"),
    "foaf:name": literals("Ana Perez"),
    "schema:roleName": literals("author"),
  });
  const university = omekaResource(30, OMEKA_PNPU_RESOURCE_TEMPLATES.university, {
    "pnpu:uuid": literals("01990f5a-0000-7000-8000-000000000202"),
    "schema:name": literals("Universidad de La Habana"),
    "schema:addressCountry": literals("CU"),
  });
  const publisher = omekaResource(40, OMEKA_PNPU_RESOURCE_TEMPLATES.publisher, {
    "pnpu:uuid": literals("01990f5a-0000-7000-8000-000000000203"),
    "schema:name": literals("Editorial UH"),
    "schema:parentOrganization": linkedResource(30),
    "schema:addressCountry": literals("CU"),
  });
  const collection = omekaResource(50, OMEKA_PNPU_RESOURCE_TEMPLATES.collection, {
    "pnpu:uuid": literals("01990f5a-0000-7000-8000-000000000204"),
    "dcterms:title": literals("Biblioteca PNPU"),
    "dcterms:publisher": linkedResource(40),
    "dcterms:subject": linkedResource(10),
  });
  const publication = omekaResource(60, OMEKA_PNPU_RESOURCE_TEMPLATES.publication, {
    "pnpu:uuid": literals("01990f5a-0000-7000-8000-000000000205"),
    "dcterms:title": literals("Gestion editorial universitaria"),
    "dcterms:issued": literals("2026-07-16"),
    "dcterms:language": literals("es"),
    "dcterms:type": literals("book"),
    "dcterms:format": literals("application/pdf"),
    "dcterms:identifier": literals("https://pnpu.mes.gob.cu/publicaciones/gestion-editorial"),
    "dcterms:publisher": linkedResource(40),
    "dcterms:creator": linkedResource(20),
    "dcterms:subject": linkedResource(10),
    "dcterms:isPartOf": linkedResource(50),
  });
  const media = omekaResource(70, OMEKA_PNPU_RESOURCE_TEMPLATES.digitalResource, {
    "o:item": {
      "@id": "http://127.0.0.1/omeka-s/api/items/60",
      "o:id": 60,
    },
    "pnpu:resourceType": literals("pdf"),
    "o:original_url": uris("http://127.0.0.1/omeka-s/files/original/book.pdf"),
    "dcterms:format": literals("application/pdf"),
  });

  return {
    items: [subject, contributor, university, publisher, publication],
    itemSets: [collection],
    media: [media],
    resourceTemplates: Object.values(OMEKA_PNPU_RESOURCE_TEMPLATES).map((label, index) => ({
      "o:id": index + 1,
      "o:label": label,
    })),
    classifications: [],
    quality: {
      issues: [],
      rejectedCount: 0,
      warningCount: 0,
    },
  };
}

export function omekaResource(
  id: number,
  templateLabel: string,
  values: Record<string, unknown>,
): OmekaJsonObject {
  return {
    "o:id": id,
    "o:resource_template": {
      "o:label": templateLabel,
    },
    ...values,
  };
}

export function literals(...values: readonly string[]): readonly OmekaJsonObject[] {
  return values.map((value) => ({ "@value": value }));
}

export function uris(...values: readonly string[]): readonly OmekaJsonObject[] {
  return values.map((value) => ({ "@id": value }));
}

export function linkedResource(id: number): readonly OmekaJsonObject[] {
  return [
    {
      "@id": `http://127.0.0.1/omeka-s/api/items/${String(id)}`,
      value_resource_id: id,
    },
  ];
}
