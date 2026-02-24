import { put } from "@vercel/blob";
import { errorResponse, json } from "@/lib/server/http";
import { verifyFirebaseBearerToken } from "@/lib/server/firebase";

export const runtime = "nodejs";

function sanitizeFileName(name: string) {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_");
}

export async function POST(request: Request) {
  try {
    const user = await verifyFirebaseBearerToken(request.headers.get("authorization"));
    const form = await request.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return errorResponse(400, "Missing file");
    }

    if (!file.type.startsWith("image/")) {
      return errorResponse(400, "File must be an image");
    }

    const ext = file.name.includes(".") ? file.name.split(".").pop() : "jpg";
    const blobPath = `covers/${user.uid}/${Date.now()}-${crypto.randomUUID()}.${sanitizeFileName(ext || "jpg")}`;
    const uploaded = await put(blobPath, file, {
      access: "public",
      addRandomSuffix: false,
      contentType: file.type,
    });

    return json({
      url: uploaded.url,
      pathname: uploaded.pathname,
      contentType: file.type,
      size: file.size,
    });
  } catch (error) {
    const status = typeof error === "object" && error && "status" in error ? Number((error as { status: unknown }).status) : 500;
    return errorResponse(status || 500, error instanceof Error ? error.message : "Internal server error");
  }
}
