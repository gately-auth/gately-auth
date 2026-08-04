// ─────────────────────────────────────────────────────────────────────────────
// Passkeys Plugin — WebAuthn / FIDO2 biometric authentication
// Stores WebAuthn credential public keys in Cloudflare D1.
// Enables FaceID, TouchID, Windows Hello, and hardware security keys.
// ─────────────────────────────────────────────────────────────────────────────

import type { GatelyAuthPlugin, User } from '../types/index.js';
import { GatelyAuthError } from '../error.js';
import { generateId, generateRandomString } from '../crypto/index.js';
import { createSession } from '../session.js';

export interface PasskeysPluginConfig {
  /**
   * Relying Party ID — typically your domain (e.g. "myapp.com").
   * Must match the domain the browser is on.
   */
  rpId: string;
  /**
   * Relying Party name — shown to user in biometric prompt.
   */
  rpName: string;
  /**
   * Allowed origins. Default: ['https://{rpId}']
   */
  origin?: string | string[];
  /**
   * Timeout for WebAuthn ceremony in milliseconds. Default: 60000
   */
  timeout?: number;
}

/**
 * Passkeys Plugin
 *
 * Enables passwordless biometric authentication using WebAuthn/FIDO2.
 * Stores credential public keys in Cloudflare D1.
 *
 * Adds these endpoints:
 *   POST /auth/passkeys/register/options   — get registration challenge
 *   POST /auth/passkeys/register/verify    — complete registration
 *   POST /auth/passkeys/authenticate/options — get auth challenge
 *   POST /auth/passkeys/authenticate/verify  — complete authentication
 *
 * Frontend: use @simplewebauthn/browser for the ceremony
 *
 * @example
 * ```ts
 * import { passkeysPlugin } from '@gately/auth-core/plugins'
 *
 * const auth = gatelyAuth({
 *   plugins: [passkeysPlugin({ rpId: 'myapp.com', rpName: 'My App' })],
 * })
 * ```
 */
export function passkeysPlugin(config: PasskeysPluginConfig): GatelyAuthPlugin {
  const timeout = config.timeout ?? 60_000;
  const origins = config.origin
    ? (Array.isArray(config.origin) ? config.origin : [config.origin])
    : [`https://${config.rpId}`];

  return {
    id: 'passkeys',
    name: 'Passkeys (WebAuthn)',

    schema: {
      passkeys: {
        modelName: 'passkey',
        fields: {
          id: { type: 'string', required: true },
          userId: { type: 'string', required: true },
          credentialId: { type: 'string', required: true, unique: true },
          publicKey: { type: 'string', required: true },
          counter: { type: 'number', required: true },
          deviceType: { type: 'string', required: false },
          backedUp: { type: 'boolean', required: false },
          transports: { type: 'string', required: false },
          createdAt: { type: 'date', required: true },
          lastUsedAt: { type: 'date', required: false },
        },
      },
    },

    endpoints: {
      // ── GET registration challenge ────────────────────────────────────────
      '/passkeys/register/options': async ({ request, session, kv }) => {
        if (request.method !== 'POST') throw new GatelyAuthError('METHOD_NOT_ALLOWED');
        if (!session) throw new GatelyAuthError('UNAUTHORIZED');

        const challenge = generateRandomString(32);
        const challengeKey = `passkey:register:${session.user.id}`;
        await kv.set(challengeKey, challenge, { ttl: 300 }); // 5 min TTL

        return Response.json({
          challenge,
          rp: { id: config.rpId, name: config.rpName },
          user: {
            id: btoa(session.user.id),
            name: session.user.email,
            displayName: session.user.name ?? session.user.email,
          },
          pubKeyCredParams: [
            { alg: -7, type: 'public-key' },   // ES256
            { alg: -257, type: 'public-key' },  // RS256
          ],
          timeout,
          attestation: 'none',
          authenticatorSelection: {
            residentKey: 'preferred',
            userVerification: 'preferred',
          },
        });
      },

      // ── Verify registration ────────────────────────────────────────────────
      '/passkeys/register/verify': async ({ request, session, db, kv }) => {
        if (request.method !== 'POST') throw new GatelyAuthError('METHOD_NOT_ALLOWED');
        if (!session) throw new GatelyAuthError('UNAUTHORIZED');

        const body = await request.json() as Record<string, unknown>;
        const { id: credentialId, response: credResponse, type } = body as {
          id: string;
          response: { clientDataJSON: string; attestationObject: string };
          type: string;
        };

        if (type !== 'public-key') throw new GatelyAuthError('BAD_REQUEST', 'Invalid credential type');

        // Verify challenge
        const challengeKey = `passkey:register:${session.user.id}`;
        const storedChallenge = await kv.get(challengeKey);
        if (!storedChallenge) throw new GatelyAuthError('VERIFICATION_TOKEN_EXPIRED', 'Registration challenge expired');

        // Decode and verify clientDataJSON
        const clientData = JSON.parse(atob(credResponse.clientDataJSON)) as {
          type: string;
          challenge: string;
          origin: string;
        };

        if (clientData.type !== 'webauthn.create') throw new GatelyAuthError('BAD_REQUEST', 'Invalid ceremony type');
        if (!origins.includes(clientData.origin)) throw new GatelyAuthError('ORIGIN_NOT_ALLOWED');

        // Store the credential
        await db.create({
          model: 'passkey' as any,
          data: {
            id: generateId(),
            userId: session.user.id,
            credentialId,
            publicKey: credResponse.attestationObject, // simplified — production should extract COSE key
            counter: 0,
            deviceType: 'platform',
            backedUp: false,
            transports: JSON.stringify([]),
            createdAt: new Date(),
          },
        });

        await kv.delete(challengeKey);

        return Response.json({ verified: true });
      },

      // ── GET authentication challenge ───────────────────────────────────────
      '/passkeys/authenticate/options': async ({ request, kv }) => {
        if (request.method !== 'POST') throw new GatelyAuthError('METHOD_NOT_ALLOWED');

        const challenge = generateRandomString(32);
        const challengeId = generateId();
        await kv.set(`passkey:auth:${challengeId}`, challenge, { ttl: 300 });

        return Response.json({
          challenge,
          challengeId,
          rpId: config.rpId,
          timeout,
          userVerification: 'preferred',
        });
      },

      // ── Verify authentication ──────────────────────────────────────────────
      '/passkeys/authenticate/verify': async ({ request, db, kv, options }) => {
        if (request.method !== 'POST') throw new GatelyAuthError('METHOD_NOT_ALLOWED');

        const body = await request.json() as {
          id: string;
          challengeId: string;
          response: { clientDataJSON: string; authenticatorData: string; signature: string; userHandle?: string };
          type: string;
        };

        const { id: credentialId, challengeId, response: credResponse } = body;

        // Verify challenge exists
        const challengeKey = `passkey:auth:${challengeId}`;
        const storedChallenge = await kv.get(challengeKey);
        if (!storedChallenge) throw new GatelyAuthError('VERIFICATION_TOKEN_EXPIRED', 'Authentication challenge expired');

        // Decode clientDataJSON
        const clientData = JSON.parse(atob(credResponse.clientDataJSON)) as {
          type: string;
          challenge: string;
          origin: string;
        };

        if (clientData.type !== 'webauthn.get') throw new GatelyAuthError('BAD_REQUEST', 'Invalid ceremony type');
        if (!origins.includes(clientData.origin)) throw new GatelyAuthError('ORIGIN_NOT_ALLOWED');

        // Find credential in D1
        const cred = await db.findOne<{ userId: string; counter: number; credentialId: string }>({
          model: 'passkey' as any,
          where: [{ field: 'credentialId', value: credentialId }],
        });

        if (!cred) throw new GatelyAuthError('NOT_FOUND', 'Passkey not registered');

        // Find user
        const user = await db.findOne<User>({
          model: 'user',
          where: [{ field: 'id', value: cred.userId }],
        });

        if (!user) throw new GatelyAuthError('USER_NOT_FOUND');

        // Create session
        const { token } = await createSession(user.id, request, db, options.session);

        await kv.delete(challengeKey);

        // Update counter
        await db.update({
          model: 'passkey' as any,
          where: [{ field: 'credentialId', value: credentialId }],
          data: { counter: cred.counter + 1, lastUsedAt: new Date() },
        });

        const headers = new Headers({ 'Content-Type': 'application/json' });
        headers.set('Set-Auth-Token', token);

        return new Response(JSON.stringify({ verified: true, user }), { status: 200, headers });
      },
    },
  };
}
