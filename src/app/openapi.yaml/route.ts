import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { NextResponse } from "next/server";

export const dynamic = "force-static";

export async function GET() {
  const contract = await readFile(
    join(process.cwd(), "openapi", "pnpu-portal.openapi.yml"),
    "utf-8",
  );

  return new NextResponse(contract, {
    headers: {
      "Content-Type": "application/yaml; charset=utf-8",
    },
  });
}
