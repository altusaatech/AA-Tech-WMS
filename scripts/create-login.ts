/**
 * Create (or update) a single A A Tech login credential.
 *
 * Creates a Firebase auth user (with the given password), grants the
 * `authenticated` custom claim (Supabase RLS), and enrols an employees row so
 * the login gate accepts the email. Idempotent: reuses an existing Firebase
 * user (resetting the password) and updates an existing employees row.
 *
 * Run:
 *   pnpm exec tsx --env-file=.env.local scripts/create-login.ts
 */

import { eq, sql } from "drizzle-orm";
import { getApps, initializeApp, cert } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { db } from "../lib/db";
import { employees } from "../db/schema";

const EMAIL = "altusAdmin.aatech@gmail.com";
const PASSWORD = "Unleashed@12";
const NAME = "Altus Admin";
const IS_ADMIN = true;

async function main() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing FIREBASE_PROJECT_ID / FIREBASE_CLIENT_EMAIL / FIREBASE_PRIVATE_KEY");
  }
  if (!getApps().length) {
    initializeApp({ credential: cert({ projectId, clientEmail, privateKey }) });
  }
  const auth = getAuth();
  const email = EMAIL.toLowerCase().trim();

  // Firebase: create or reuse, ensuring the password is set.
  let uid: string;
  try {
    const created = await auth.createUser({ email, password: PASSWORD, emailVerified: true, disabled: false });
    uid = created.uid;
    console.log(`✓ created Firebase user: ${email}`);
  } catch (err: unknown) {
    const code = (err as { code?: string })?.code;
    if (code === "auth/email-already-exists") {
      const found = await auth.getUserByEmail(email);
      uid = found.uid;
      await auth.updateUser(uid, { password: PASSWORD });
      console.log(`• reused existing Firebase user (password reset): ${email}`);
    } else {
      throw err;
    }
  }

  try {
    await auth.setCustomUserClaims(uid, { role: "authenticated" });
  } catch (err) {
    console.warn(`! could not set custom claim (continuing):`, (err as Error).message ?? err);
  }

  // Employees row: insert or update so the email is enrolled.
  const existing = await db.query.employees.findFirst({
    where: sql`lower(${employees.email}) = ${email}`,
  });
  if (existing) {
    await db
      .update(employees)
      .set({ isActive: true, isAdmin: IS_ADMIN, firebaseUid: uid })
      .where(eq(employees.id, existing.id));
    console.log(`• updated existing employee row: ${email}`);
  } else {
    await db.insert(employees).values({
      name: NAME,
      email,
      role: "both",
      isAdmin: IS_ADMIN,
      isActive: true,
      firebaseUid: uid,
      invitedAt: new Date(),
    });
    console.log(`✓ enrolled employee row: ${email}`);
  }

  console.log(`\nDone. Login: ${email} · admin: ${IS_ADMIN}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
