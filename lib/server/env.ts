function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getAdminPassword(): string {
  return required("ADMIN_PASSWORD");
}

export function getTursoConfig() {
  return {
    url: required("TURSO_DATABASE_URL"),
    authToken: required("TURSO_AUTH_TOKEN"),
  };
}

export function getOptionalFirebaseConfig() {
  return {
    serviceAccountJson: process.env.FIREBASE_SERVICE_ACCOUNT_JSON,
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n"),
  };
}
