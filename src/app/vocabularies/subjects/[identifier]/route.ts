import { NextResponse } from "next/server";

interface SubjectVocabularyRouteContext {
  readonly params: Promise<{
    readonly identifier: string;
  }>;
}

export async function GET(
  request: Request,
  { params }: SubjectVocabularyRouteContext,
): Promise<NextResponse> {
  const { identifier } = await params;
  const normalizedIdentifier = normalizeSubjectIdentifier(decodeURIComponent(identifier));
  const targetUrl = new URL(`/materias/${encodeURIComponent(normalizedIdentifier)}`, request.url);

  return NextResponse.redirect(targetUrl, 308);
}

function normalizeSubjectIdentifier(identifier: string): string {
  return /^\d+(?:-\d+)+$/.test(identifier) ? identifier.replaceAll("-", ".") : identifier;
}
