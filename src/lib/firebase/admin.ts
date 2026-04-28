import { existsSync } from "node:fs";
import { readFileSync } from "node:fs";
import {
  applicationDefault,
  cert,
  getApps,
  initializeApp,
  type App,
  type ServiceAccount,
} from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { parseServiceAccountInlineJson } from "@/lib/firebase/parse-service-account-env";

let app: App | null = null;

function loadServiceAccount(): ServiceAccount | null {
  const jsonPath = process.env.FIREBASE_SERVICE_ACCOUNT_JSON_PATH?.trim();
  if (jsonPath && existsSync(jsonPath)) {
    return JSON.parse(readFileSync(jsonPath, "utf8")) as ServiceAccount;
  }
  const credPath = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim();
  if (credPath && existsSync(credPath)) {
    return JSON.parse(readFileSync(credPath, "utf8")) as ServiceAccount;
  }
  const jsonInline = process.env.FIREBASE_SERVICE_ACCOUNT_JSON?.trim();
  if (jsonInline) {
    return parseServiceAccountInlineJson(jsonInline) as ServiceAccount;
  }
  return null;
}

function resolveProjectId(account: ServiceAccount | null): string {
  const fromEnv = process.env.FIREBASE_PROJECT_ID?.trim();
  if (fromEnv) return fromEnv;

  const acc = account as ServiceAccount & { project_id?: string };
  const raw = acc.project_id ?? acc.projectId;
  if (typeof raw === "string" && raw.trim()) {
    return raw.trim();
  }

  throw new Error(
    "Missing FIREBASE_PROJECT_ID (or project_id in the service account JSON). Set in .env.local / hosting.",
  );
}

function initFirebaseAdminApp(): App {
  if (app) return app;
  const existing = getApps()[0];
  if (existing) {
    app = existing;
    return app;
  }

  const account = loadServiceAccount();
  if (account) {
    const projectId = resolveProjectId(account);
    app = initializeApp({
      credential: cert(account),
      projectId,
    });
    return app;
  }

  const projectId = process.env.FIREBASE_PROJECT_ID?.trim();
  if (!projectId) {
    throw new Error(
      "Missing Firebase credentials. Set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS, or use application default credentials with FIREBASE_PROJECT_ID.",
    );
  }

  app = initializeApp({
    credential: applicationDefault(),
    projectId,
  });
  return app;
}

/** Server-only Firestore (Admin SDK). */
export function getAdminFirestore(): Firestore {
  return getFirestore(initFirebaseAdminApp());
}
