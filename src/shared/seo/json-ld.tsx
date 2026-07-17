export type JsonLdValue =
  string | number | boolean | null | JsonLdObject | readonly JsonLdValue[] | undefined;

export interface JsonLdObject {
  readonly [key: string]: JsonLdValue;
}

interface JsonLdScriptProps {
  readonly id: string;
  readonly data: JsonLdObject;
}

export function JsonLdScript({ id, data }: JsonLdScriptProps) {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: serializeJsonLd(data),
      }}
      id={id}
      type="application/ld+json"
    />
  );
}

export function serializeJsonLd(data: JsonLdObject): string {
  return JSON.stringify(data).replaceAll("<", "\\u003c");
}
