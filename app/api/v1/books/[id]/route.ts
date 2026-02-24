import { errorResponse, json, parseJsonBody } from "@/lib/server/http";
import { verifyFirebaseBearerToken } from "@/lib/server/firebase";
import { getUserBook, softDeleteUserBook, type V1BookPayload, upsertUserBook } from "@/lib/server/v1-books";

export const runtime = "nodejs";

type ParamsLike = { params: { id: string } | Promise<{ id: string }> };

async function readId(params: ParamsLike["params"]) {
  const resolved = await Promise.resolve(params);
  return resolved.id;
}

export async function GET(request: Request, { params }: ParamsLike) {
  try {
    const user = await verifyFirebaseBearerToken(request.headers.get("authorization"));
    const id = await readId(params);
    const book = await getUserBook(user.uid, id);
    if (!book) {
      return errorResponse(404, "Book not found");
    }
    return json(book);
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error ? Number((error as { status: unknown }).status) : 500;
    return errorResponse(status || 500, error instanceof Error ? error.message : "Internal server error");
  }
}

export async function PUT(request: Request, { params }: ParamsLike) {
  try {
    const user = await verifyFirebaseBearerToken(request.headers.get("authorization"));
    const id = await readId(params);
    const body = await parseJsonBody<V1BookPayload>(request);
    const result = await upsertUserBook(user.uid, id, body);
    if (result.conflict) {
      return json(result.body, { status: result.status });
    }
    return json(result.book);
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error ? Number((error as { status: unknown }).status) : 500;
    return errorResponse(status || 500, error instanceof Error ? error.message : "Internal server error");
  }
}

export async function DELETE(request: Request, { params }: ParamsLike) {
  try {
    const user = await verifyFirebaseBearerToken(request.headers.get("authorization"));
    const id = await readId(params);
    const result = await softDeleteUserBook(user.uid, id);
    return json({ message: "Deleted", ...result });
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error ? Number((error as { status: unknown }).status) : 500;
    return errorResponse(status || 500, error instanceof Error ? error.message : "Internal server error");
  }
}
