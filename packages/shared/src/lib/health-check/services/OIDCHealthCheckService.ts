import { createLogger } from "$shared/utils/logger";
import { HealthCheckService, type HealthCheckOptions } from "./HealthCheckService";

const logger = createLogger('OIDCHealthCheckService');

export interface OIDCHealthCheckOptions extends Omit<HealthCheckOptions, 'url' | 'method' | 'body' | 'expectedStatus'> {
    wellKnownUrl: string;
    clientId?: string;
    clientSecret?: string;
    /**
     * When true, a failed client_credentials test flips the service unhealthy.
     * When false (default), the test result is surfaced in details but does
     * not affect the overall status — useful when the client may be
     * authorization_code-only and would otherwise trip a permanent alarm.
     */
    strictClientCredentials?: boolean;
    /** Optional scope for the client_credentials test. */
    clientCredentialsScope?: string;
    /**
     * How often to actually run the client_credentials probe. The discovery +
     * JWKS checks still run at the base interval; the token test runs at most
     * this often. Default: 1 hour.
     */
    clientCredentialsIntervalMs?: number;
}

interface DiscoveryDoc {
    issuer?: string;
    authorization_endpoint?: string;
    token_endpoint?: string;
    jwks_uri?: string;
    grant_types_supported?: string[];
}

interface Jwk {
    kty?: string;
    kid?: string;
    use?: string;
    alg?: string;
}

interface Jwks {
    keys?: Jwk[];
}

interface TokenTestOutcome {
    ok: boolean;
    message: string;
    responseTimeMs: number;
    ranAt: number;
}

export class OIDCHealthCheckService extends HealthCheckService {
    private readonly wellKnownUrl: string;
    private readonly clientId?: string;
    private readonly clientSecret?: string;
    private readonly strictClientCredentials: boolean;
    private readonly clientCredentialsScope?: string;
    private readonly clientCredentialsIntervalMs: number;
    private lastTokenTest: TokenTestOutcome | null = null;

    constructor(options: OIDCHealthCheckOptions) {
        super({
            serviceName: options.serviceName,
            url: options.wellKnownUrl,
            method: 'GET',
            headers: options.headers,
            timeout: options.timeout ?? 5000,
            interval: options.interval ?? 60000,
            expectedStatus: [200]
        });
        this.wellKnownUrl = options.wellKnownUrl;
        this.clientId = options.clientId;
        this.clientSecret = options.clientSecret;
        this.strictClientCredentials = options.strictClientCredentials ?? false;
        this.clientCredentialsScope = options.clientCredentialsScope;
        this.clientCredentialsIntervalMs = options.clientCredentialsIntervalMs ?? 60 * 60 * 1000;
    }

    async performCheck(): Promise<void> {
        const startTime = performance.now();
        const timeoutMs = 5000;

        try {
            const discovery = await this.fetchJson<DiscoveryDoc>(this.wellKnownUrl, timeoutMs);

            const missing: string[] = [];
            if (!discovery.authorization_endpoint) missing.push('authorization_endpoint');
            if (!discovery.token_endpoint) missing.push('token_endpoint');
            if (!discovery.jwks_uri) missing.push('jwks_uri');

            if (missing.length > 0) {
                const elapsed = performance.now() - startTime;
                this.setUnhealthy(
                    `Discovery doc missing required fields: ${missing.join(', ')}`,
                    elapsed,
                    { wellKnownUrl: this.wellKnownUrl }
                );
                return;
            }

            const jwks = await this.fetchJson<Jwks>(discovery.jwks_uri!, timeoutMs);
            const keys = Array.isArray(jwks.keys) ? jwks.keys : [];
            const signingKeys = keys.filter(k => k.kty && (k.use === 'sig' || k.use === undefined));

            const details: Record<string, string | number> = {
                issuer: discovery.issuer ?? '(not advertised)',
                jwks_uri: discovery.jwks_uri!,
                keys: keys.length,
                signing_keys: signingKeys.length
            };

            if (signingKeys.length === 0) {
                const elapsed = performance.now() - startTime;
                this.setUnhealthy(
                    `JWKS at ${discovery.jwks_uri} has no usable signing keys`,
                    elapsed,
                    details
                );
                return;
            }

            let tokenTestFailed = false;
            if (this.clientId && this.clientSecret) {
                const now = Date.now();
                const due = this.lastTokenTest === null
                    || (now - this.lastTokenTest.ranAt) >= this.clientCredentialsIntervalMs;

                if (due) {
                    this.lastTokenTest = await this.performClientCredentialsTest(
                        discovery.token_endpoint!,
                        timeoutMs
                    );
                }

                const outcome = this.lastTokenTest!;
                details.token_test = outcome.ok ? 'ok' : 'failed';
                details.token_test_ms = outcome.responseTimeMs;
                details.token_test_age = formatAge(Date.now() - outcome.ranAt);
                if (!outcome.ok) {
                    details.token_test_error = outcome.message;
                    tokenTestFailed = true;
                }
            } else {
                details.token_test = 'skipped (no credentials configured)';
            }

            const elapsed = performance.now() - startTime;

            if (tokenTestFailed && this.strictClientCredentials) {
                this.setUnhealthy(
                    `client_credentials test failed: ${details.token_test_error}`,
                    elapsed,
                    details
                );
                return;
            }

            logger.debug(`OIDC check healthy for ${this.getName()} in ${elapsed.toFixed(0)}ms (${signingKeys.length} signing keys${tokenTestFailed ? ', token_test failed (non-strict)' : ''})`);
            this.state.setSnapshot({
                service: this.getName(),
                status: 'healthy',
                responseTimeMs: Math.round(elapsed),
                details
            });
        } catch (err) {
            const elapsed = performance.now() - startTime;
            const message = err instanceof Error ? err.message : String(err);
            logger.warn(`OIDC check failed for ${this.getName()}: ${message}`);
            this.setUnhealthy(message, elapsed, { wellKnownUrl: this.wellKnownUrl });
        }
    }

    private async performClientCredentialsTest(
        tokenEndpoint: string,
        timeoutMs: number
    ): Promise<TokenTestOutcome> {
        const start = performance.now();
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort('timeout'), timeoutMs);

        const body = new URLSearchParams();
        body.set('grant_type', 'client_credentials');
        if (this.clientCredentialsScope) {
            body.set('scope', this.clientCredentialsScope);
        }

        const credentials = Buffer.from(`${this.clientId}:${this.clientSecret}`).toString('base64');

        try {
            const response = await fetch(tokenEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Accept': 'application/json',
                    'Authorization': `Basic ${credentials}`
                },
                body: body.toString(),
                signal: controller.signal
            });
            const elapsed = performance.now() - start;
            const ranAt = Date.now();

            if (response.ok) {
                return { ok: true, message: 'token issued', responseTimeMs: Math.round(elapsed), ranAt };
            }

            let errDesc = `${response.status} ${response.statusText}`;
            try {
                const data = await response.json() as { error?: string; error_description?: string };
                if (data?.error) {
                    errDesc = data.error_description ? `${data.error}: ${data.error_description}` : data.error;
                }
            } catch {
                // Response body wasn't JSON, keep status line
            }
            return { ok: false, message: errDesc, responseTimeMs: Math.round(elapsed), ranAt };
        } catch (err) {
            const elapsed = performance.now() - start;
            const message = err instanceof Error ? (err.name === 'AbortError' ? 'timeout' : err.message) : String(err);
            return { ok: false, message, responseTimeMs: Math.round(elapsed), ranAt: Date.now() };
        } finally {
            clearTimeout(timeoutId);
        }
    }

    private async fetchJson<T>(url: string, timeoutMs: number): Promise<T> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort('timeout'), timeoutMs);
        try {
            const response = await fetch(url, {
                method: 'GET',
                headers: { Accept: 'application/json' },
                signal: controller.signal
            });
            if (!response.ok) {
                throw new Error(`${url} returned ${response.status} ${response.statusText}`);
            }
            return (await response.json()) as T;
        } finally {
            clearTimeout(timeoutId);
        }
    }

    private setUnhealthy(error: string, elapsedMs: number, details: Record<string, string | number>): void {
        this.state.setSnapshot({
            service: this.getName(),
            status: 'unhealthy',
            responseTimeMs: Math.round(elapsedMs),
            error,
            details
        });
    }
}

function formatAge(ageMs: number): string {
    if (ageMs < 60_000) return 'just now';
    const minutes = Math.floor(ageMs / 60_000);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    const remMinutes = minutes % 60;
    return remMinutes > 0 ? `${hours}h ${remMinutes}m ago` : `${hours}h ago`;
}
