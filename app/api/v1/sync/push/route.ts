import { errorResponse, json, parseJsonBody } from "@/lib/server/http";
import { verifyFirebaseBearerToken } from "@/lib/server/firebase";
import { type V1BookPayload, upsertUserBook } from "@/lib/server/v1-books";

export const runtime = "nodejs";

type PushBody = {
  books?: V1BookPayload[];
};

export async function POST(request: Request) {
  try {
    const user = await verifyFirebaseBearerToken(request.headers.get("authorization"));
    const body = await parseJsonBody<PushBody>(request);
    const books = Array.isArray(body.books) ? body.books : [];
    const results = [];
    const conflicts = [];

    for (const book of books) {
      if (!book?.id) {
        continue;
      }
      const result = await upsertUserBook(user.uid, book.id, book);
      if (result.conflict) {
        conflicts.push({ id: book.id, ...result.body });
      } else {
        results.push(result.book);
      }
    }

    return json({
      upserted: results,
      conflicts,
      serverNow: new Date().toISOString(),
    });
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error ? Number((error as { status: unknown }).status) : 500;
    return errorResponse(status || 500, error instanceof Error ? error.message : "Internal server error");
  }
}
