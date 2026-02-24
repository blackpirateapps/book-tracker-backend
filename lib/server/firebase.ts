import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getOptionalFirebaseConfig } from "@/lib/server/env";

function initFirebaseAdmin() {
  if (getApps().length > 0) {
    return getApps()[0];
  }

  const cfg = getOptionalFirebaseConfig();

  if (cfg.serviceAccountJson) {
    const parsed = JSON.parse(cfg.serviceAccountJson) as {
      project_id: string;
      client_email: string;
      private_key: string;
    };
    return initializeApp({
      credential: cert({
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key,
      }),
    });
  }

  if (cfg.projectId && cfg.clientEmail && cfg.privateKey) {
    return initializeApp({
      credential: cert({
        projectId: cfg.projectId,
        clientEmail: cfg.clientEmail,
        privateKey: cfg.privateKey,
      }),
    });
  }

  throw new Error("Firebase Admin is not configured");
}

export async function verifyFirebaseBearerToken(authHeader: string | null) {
  if (!authHeader?.startsWith("Bearer ")) {
    throw Object.assign(new Error("Missing Bearer token"), { status: 401 });
  }

  const token = authHeader.slice("Bearer ".length).trim();
  const app = initFirebaseAdmin();
  const decoded = await getAuth(app).verifyIdToken(token);

  return {
    uid: decoded.uid,
    email: decoded.email ?? null,
    name: decoded.name ?? null,
    picture: decoded.picture ?? null,
  };
}
