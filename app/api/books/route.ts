import { errorResponse, json, parseJsonBody, requireAdminPassword } from "@/lib/server/http";
import {
  addBookFromOpenLibrary,
  bulkAddTagToBooks,
  createTag,
  deleteBook,
  deleteTag,
  exportHugoPayload,
  getBookById,
  listAllBooks,
  parseHighlightsFile,
  updateBook,
  updateTag,
} from "@/lib/server/repository";

export const runtime = "nodejs";

type BooksActionBody = {
  password?: string;
  action?: string;
  data?: Record<string, unknown>;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const id = searchParams.get("id");

    if (action === "export-hugo") {
      return json(await exportHugoPayload());
    }

    if (id) {
      const book = await getBookById(id);
      if (!book) return errorResponse(404, "Book not found");
      return json(book);
    }

    return json(await listAllBooks());
  } catch (error) {
    return errorResponse(500, error instanceof Error ? error.message : "Internal server error");
  }
}

export async function POST(request: Request) {
  try {
    const body = await parseJsonBody<BooksActionBody>(request);
    requireAdminPassword(body.password);

    const action = body.action;
    const data = body.data ?? {};

    switch (action) {
      case "add": {
        const olid = String(data.olid ?? "");
        if (!olid) return errorResponse(400, "Missing olid");
        const shelf = data.shelf ? String(data.shelf) : undefined;
        const book = await addBookFromOpenLibrary({ olid, shelf });
        return json({ message: "Book added", book });
      }
      case "update": {
        const result = await updateBook(data);
        return json({ message: "Updated", rowsAffected: result.rowsAffected });
      }
      case "delete": {
        const id = String(data.id ?? "");
        if (!id) return errorResponse(400, "Missing id");
        await deleteBook(id);
        return json({ message: "Deleted" });
      }
      case "parse-highlights": {
        const fileContent = String(data.fileContent ?? "");
        const fileName = String(data.fileName ?? "");
        if (!fileContent || !fileName) return errorResponse(400, "Missing fileContent or fileName");
        return json(parseHighlightsFile(fileContent, fileName));
      }
      case "tag-create": {
        const result = await createTag({ name: data.name, color: data.color });
        return json({ message: "Tag created", id: result.id });
      }
      case "tag-update": {
        await updateTag({ id: data.id, name: data.name, color: data.color });
        return json({ message: "Tag updated" });
      }
      case "tag-delete": {
        const id = String(data.id ?? "");
        if (!id) return errorResponse(400, "Missing id");
        await deleteTag(id);
        return json({ message: "Tag deleted" });
      }
      case "tag-bulk-add": {
        await bulkAddTagToBooks({ tagId: data.tagId, bookIds: data.bookIds });
        return json({ message: "Tags added" });
      }
      default:
        return errorResponse(400, "Unknown action");
    }
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error ? Number((error as { status: unknown }).status) : 500;
    return errorResponse(status || 500, error instanceof Error ? error.message : "Internal server error");
  }
}
