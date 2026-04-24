import { createLogger } from '@obp/shared/utils';
const logger = createLogger('LogoutServer');
import { SessionOAuthHelper } from "$lib/oauth/sessionHelper";
import type { RequestEvent } from "@sveltejs/kit";
import { env } from "$env/dynamic/private";
// Response is a global type, no need to import it

/**
 * Tell Opey to delete the user's session server-side.
 * The browser sends Opey's 'session' cookie to manager/ on same-origin requests
 * (because the /backend/opey/auth proxy forwarded the Set-Cookie from Opey),
 * so we can just relay the incoming Cookie header to Opey's /delete-session.
 *
 * Time-bounded: never block logout on Opey availability.
 */
async function deleteOpeySession(event: RequestEvent, userId: string) {
    const opeyBaseUrl = env.OPEY_BASE_URL;
    const incomingCookie = event.request.headers.get('cookie');
    if (!opeyBaseUrl || !incomingCookie) return;

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3_000);
    try {
        const res = await fetch(`${opeyBaseUrl}/delete-session`, {
            method: 'POST',
            headers: { 'Cookie': incomingCookie },
            signal: controller.signal
        });
        if (res.ok) {
            logger.info(`Opey session invalidated for user: ${userId}`);
        } else {
            logger.warn(`Opey /delete-session returned ${res.status} for user: ${userId}`);
        }
    } catch (err) {
        logger.warn(`Opey /delete-session failed for user ${userId} (non-fatal):`, err);
    } finally {
        clearTimeout(timeout);
    }
}

export async function GET(event: RequestEvent): Promise<Response> {
    
    const session = event.locals.session;
    if (!session || !session.data.user) {
        logger.warn("No user session found, nothing to revoke.");
        return new Response(null, {
            status: 302,
            headers: {
                Location: `/`
            }
        });
    }

    const sessionOAuth = SessionOAuthHelper.getSessionOAuth(session)
    if (!sessionOAuth) {
        logger.warn("No OAuth session found, nothing to revoke.");
        return new Response(null, {
            status: 302,
            headers: {
                Location: `/`
            }
        });
    }

    // Get the access token before destroying session
    const accessToken = session.data.oauth?.access_token;
    const userId = session.data.user.user_id;

    // Invalidate the Opey session server-side (before destroying our own session,
    // while we still have the incoming Cookie header to forward to Opey).
    await deleteOpeySession(event, userId);

    // Clear the session cookie and destroy the session. Note: 'session' is
    // also Opey's cookie name, so this deletion covers both.
    event.cookies.delete("session", {
        path: "/",
    });
    await session.destroy();

    // Try to revoke the access token if it exists and revocation endpoint is available
    const tokenRevokationUrl = sessionOAuth.client.OIDCConfig?.revocation_endpoint;
    if (accessToken && tokenRevokationUrl) {
        try {
            logger.info("Revoking access token for user:", userId);
            
            const response = await fetch(tokenRevokationUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Authorization': `Bearer ${accessToken}`
                },
                body: new URLSearchParams({
                    token: accessToken,
                    token_type_hint: 'access_token'
                })
            });

            if (response.ok) {
                logger.info("Successfully revoked access token for user:", userId);
            } else {
                logger.warn(`Token revocation failed with status ${response.status} for user:`, userId);
            }
        } catch (error) {
            logger.error("Error during token revocation:", error);
            // Continue with logout even if revocation fails
        }
    } else {
        if (!accessToken) {
            logger.warn("No access token found in session, skipping revocation.");
        }
        if (!tokenRevokationUrl) {
            logger.warn("No revocation endpoint configured, skipping token revocation.");
        }
    }

    // Redirect to the home page after logout
    return new Response(null, {
        status: 302,
        headers: {
            Location: `/`
        }
    });


}
