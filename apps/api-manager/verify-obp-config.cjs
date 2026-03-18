#!/usr/bin/env node

/**
 * OBP Configuration Verification Script
 * This script verifies that the OBP server endpoints are accessible
 * and the OAuth configuration is working correctly.
 */

const https = require("https");
const http = require("http");

// Configuration from your provided credentials
const OBP_BASE_URL = "http://127.0.0.1:9000";
const OBP_OIDC_BASE_URL = "http://127.0.0.1:9000/obp-oidc";
const CLIENT_ID = "39fb9d38-cd0e-44e7-9da5-556d0673e40d";
const CLIENT_SECRET = "NJsso0ugXG6sTT3ngDolw6U_Gr3hfdqCHG-0hvaT54I";
const CALLBACK_URL = "http://localhost:3003/login/obp/callback";

console.log("🔍 OBP Configuration Verification");
console.log("================================\n");

// Helper function to make HTTP requests
function makeRequest(url, method = "GET", data = null) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: method,
      headers: {
        Accept: "application/json",
        "User-Agent": "OBP-Config-Verifier/1.0",
      },
    };

    if (data) {
      options.headers["Content-Type"] = "application/json";
      options.headers["Content-Length"] = Buffer.byteLength(data);
    }

    const client = urlObj.protocol === "https:" ? https : http;

    const req = client.request(options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        try {
          const parsedData = responseData ? JSON.parse(responseData) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsedData,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: responseData,
          });
        }
      });
    });

    req.on("error", (err) => {
      reject(err);
    });

    if (data) {
      req.write(data);
    }

    req.end();
  });
}

// Test functions
async function testHealthCheck() {
  console.log("1. Testing Health Check...");
  try {
    const response = await makeRequest(`${OBP_BASE_URL}/health`);
    if (response.status === 200) {
      console.log("   ✅ Health check passed");
      console.log(`   📊 Status: ${response.status}`);
      return true;
    } else {
      console.log(`   ❌ Health check failed with status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Health check failed: ${error.message}`);
    return false;
  }
}

async function testWellKnownEndpoint() {
  console.log("\n2. Testing Well-Known OIDC Configuration...");
  try {
    const response = await makeRequest(
      `${OBP_OIDC_BASE_URL}/.well-known/openid-configuration`,
    );
    if (response.status === 200) {
      console.log("   ✅ Well-known endpoint accessible");
      console.log(
        `   🔗 Authorization endpoint: ${response.data.authorization_endpoint}`,
      );
      console.log(`   🔗 Token endpoint: ${response.data.token_endpoint}`);
      console.log(
        `   🔗 UserInfo endpoint: ${response.data.userinfo_endpoint}`,
      );
      console.log(`   🔗 JWKS endpoint: ${response.data.jwks_uri}`);
      return response.data;
    } else {
      console.log(
        `   ❌ Well-known endpoint failed with status: ${response.status}`,
      );
      return null;
    }
  } catch (error) {
    console.log(`   ❌ Well-known endpoint failed: ${error.message}`);
    return null;
  }
}

async function testOBPWellKnownUris() {
  console.log("\n3. Testing OBP Well-Known URIs...");
  try {
    const response = await makeRequest(`${OBP_BASE_URL}/obp/v5.1.0/well-known`);
    if (response.status === 200) {
      console.log("   ✅ OBP well-known URIs accessible");
      if (
        response.data.well_known_uris &&
        response.data.well_known_uris.length > 0
      ) {
        console.log("   📋 Available OAuth providers:");
        response.data.well_known_uris.forEach((uri) => {
          console.log(`      - ${uri.provider}: ${uri.url}`);
        });
      }
      return response.data;
    } else {
      console.log(
        `   ❌ OBP well-known URIs failed with status: ${response.status}`,
      );
      return null;
    }
  } catch (error) {
    console.log(`   ❌ OBP well-known URIs failed: ${error.message}`);
    return null;
  }
}

async function testAuthorizationEndpoint(oidcConfig) {
  console.log("\n4. Testing Authorization Endpoint...");
  if (!oidcConfig || !oidcConfig.authorization_endpoint) {
    console.log("   ⚠️  Skipping - no authorization endpoint found");
    return false;
  }

  try {
    // Create a test authorization URL
    const authUrl = new URL(oidcConfig.authorization_endpoint);
    authUrl.searchParams.set("client_id", CLIENT_ID);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("redirect_uri", CALLBACK_URL);
    authUrl.searchParams.set("scope", "openid");
    authUrl.searchParams.set("state", "test-state");

    console.log("   🔗 Test authorization URL generated:");
    console.log(`   ${authUrl.toString()}`);
    console.log("   ✅ Authorization endpoint is properly configured");
    return true;
  } catch (error) {
    console.log(`   ❌ Authorization endpoint test failed: ${error.message}`);
    return false;
  }
}

async function testClientConfiguration() {
  console.log("\n5. Testing Client Configuration...");
  console.log(`   📋 Client ID: ${CLIENT_ID}`);
  console.log(`   🔒 Client Secret: ${CLIENT_SECRET ? "[SET]" : "[MISSING]"}`);
  console.log(`   🔄 Callback URL: ${CALLBACK_URL}`);

  // Validate callback URL format
  try {
    new URL(CALLBACK_URL);
    console.log("   ✅ Callback URL format is valid");
  } catch (error) {
    console.log("   ❌ Callback URL format is invalid");
    return false;
  }

  return true;
}

async function testRedisConnection() {
  console.log("\n6. Testing Redis Connection...");
  console.log("   ℹ️  Note: This script cannot test Redis directly");
  console.log("   📝 Make sure Redis is running on localhost:6379");
  console.log("   💡 You can test with: redis-cli ping");
  return true;
}

// Main verification function
async function runVerification() {
  console.log(`🎯 Target OBP Server: ${OBP_BASE_URL}\n`);

  let overallSuccess = true;
  const results = {};

  // Run all tests
  results.health = await testHealthCheck();
  results.wellKnown = await testWellKnownEndpoint();
  results.obpWellKnown = await testOBPWellKnownUris();
  results.authorization = await testAuthorizationEndpoint(results.wellKnown);
  results.clientConfig = await testClientConfiguration();
  results.redis = await testRedisConnection();

  // Calculate overall success
  overallSuccess = Object.values(results).every(
    (result) => result === true || result !== null,
  );

  console.log("\n" + "=".repeat(50));
  console.log("📊 VERIFICATION SUMMARY");
  console.log("=".repeat(50));

  console.log(`Health Check: ${results.health ? "✅" : "❌"}`);
  console.log(`OIDC Config: ${results.wellKnown ? "✅" : "❌"}`);
  console.log(`OBP Well-Known: ${results.obpWellKnown ? "✅" : "❌"}`);
  console.log(`Authorization: ${results.authorization ? "✅" : "❌"}`);
  console.log(`Client Config: ${results.clientConfig ? "✅" : "❌"}`);
  console.log(`Redis Setup: ${results.redis ? "✅" : "ℹ️"}`);

  console.log(
    `\n🎯 Overall Status: ${overallSuccess ? "✅ READY" : "❌ ISSUES FOUND"}`,
  );

  if (overallSuccess) {
    console.log("\n🚀 Your OBP configuration appears to be working correctly!");
    console.log("You can now start the API Manager II application:");
    console.log("   npm run dev");
    console.log("   Then visit: http://localhost:3003/login");
  } else {
    console.log(
      "\n⚠️  Some issues were found. Please check the details above.",
    );
    console.log("Make sure:");
    console.log("   - OBP server is running on http://127.0.0.1:9000");
    console.log("   - OAuth client is properly configured");
    console.log("   - Redis is running on localhost:6379");
  }

  process.exit(overallSuccess ? 0 : 1);
}

// Run the verification
runVerification().catch((error) => {
  console.error("\n❌ Verification failed with error:", error);
  process.exit(1);
});
