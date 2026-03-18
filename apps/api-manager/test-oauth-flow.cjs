#!/usr/bin/env node

/**
 * OAuth Flow Test Script for API Manager II
 * This script tests the complete OAuth flow without a browser
 */

const http = require("http");
const https = require("https");
const { URLSearchParams } = require("url");

// Configuration
const CONFIG = {
  APP_BASE_URL: "http://localhost:3003",
  OBP_BASE_URL: "http://127.0.0.1:9000",
  CLIENT_ID: "39fb9d38-cd0e-44e7-9da5-556d0673e40d",
  CLIENT_SECRET: "NJsso0ugXG6sTT3ngDolw6U_Gr3hfdqCHG-0hvaT54I",
  CALLBACK_URL: "http://localhost:3003/login/obp/callback",
};

console.log("🧪 OAuth Flow Test for API Manager II");
console.log("=====================================\n");

// Helper function to make HTTP requests
function makeRequest(url, options = {}) {
  return new Promise((resolve, reject) => {
    const urlObj = new URL(url);
    const requestOptions = {
      hostname: urlObj.hostname,
      port: urlObj.port,
      path: urlObj.pathname + urlObj.search,
      method: options.method || "GET",
      headers: {
        Accept: "application/json",
        "User-Agent": "OAuth-Flow-Tester/1.0",
        ...options.headers,
      },
    };

    if (options.body) {
      if (typeof options.body === "string") {
        requestOptions.headers["Content-Length"] = Buffer.byteLength(
          options.body,
        );
      } else {
        const bodyString = JSON.stringify(options.body);
        requestOptions.headers["Content-Type"] = "application/json";
        requestOptions.headers["Content-Length"] =
          Buffer.byteLength(bodyString);
        options.body = bodyString;
      }
    }

    const client = urlObj.protocol === "https:" ? https : http;
    const req = client.request(requestOptions, (res) => {
      let data = "";
      res.on("data", (chunk) => (data += chunk));
      res.on("end", () => {
        try {
          const parsed = data ? JSON.parse(data) : {};
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: parsed,
            raw: data,
          });
        } catch (e) {
          resolve({
            status: res.statusCode,
            headers: res.headers,
            data: data,
            raw: data,
          });
        }
      });
    });

    req.on("error", reject);

    if (options.body) {
      req.write(options.body);
    }

    req.end();
  });
}

// Test 1: Check if API Manager II is running
async function testAppServer() {
  console.log("1. Testing API Manager II Server...");
  try {
    const response = await makeRequest(`${CONFIG.APP_BASE_URL}/`);
    if (response.status === 200) {
      console.log("   ✅ API Manager II is running");
      return true;
    } else {
      console.log(`   ❌ API Manager II returned status: ${response.status}`);
      return false;
    }
  } catch (error) {
    console.log(`   ❌ Cannot reach API Manager II: ${error.message}`);
    console.log("   💡 Make sure the server is running: npm run dev");
    return false;
  }
}

// Test 2: Test the login endpoint
async function testLoginEndpoint() {
  console.log("\n2. Testing Login Endpoint...");
  try {
    const response = await makeRequest(`${CONFIG.APP_BASE_URL}/login/obp`);

    if (response.status === 302) {
      const location = response.headers.location;
      console.log("   ✅ Login endpoint returns redirect");
      console.log(`   🔗 Redirect URL: ${location}`);

      // Parse the redirect URL to check parameters
      if (location) {
        const redirectUrl = new URL(location);
        const params = {
          client_id: redirectUrl.searchParams.get("client_id"),
          response_type: redirectUrl.searchParams.get("response_type"),
          redirect_uri: redirectUrl.searchParams.get("redirect_uri"),
          scope: redirectUrl.searchParams.get("scope"),
          state: redirectUrl.searchParams.get("state"),
        };

        console.log("   📋 OAuth Parameters:");
        console.log(`      Client ID: ${params.client_id}`);
        console.log(`      Response Type: ${params.response_type}`);
        console.log(`      Redirect URI: ${params.redirect_uri}`);
        console.log(`      Scope: ${params.scope}`);
        console.log(`      State: ${params.state ? "[SET]" : "[MISSING]"}`);

        // Validate parameters
        const valid =
          params.client_id === CONFIG.CLIENT_ID &&
          params.response_type === "code" &&
          params.redirect_uri === CONFIG.CALLBACK_URL &&
          params.scope === "openid" &&
          params.state;

        if (valid) {
          console.log("   ✅ OAuth parameters are correct");
          return { success: true, authUrl: location };
        } else {
          console.log("   ⚠️  Some OAuth parameters may be incorrect");
          return { success: false, authUrl: location };
        }
      }
    } else if (response.status === 500) {
      console.log(
        "   ❌ Login endpoint returned 500 - OAuth provider not configured",
      );
      console.log("   💡 Check server logs for OAuth initialization errors");
      return { success: false };
    } else {
      console.log(`   ❌ Login endpoint returned status: ${response.status}`);
      return { success: false };
    }
  } catch (error) {
    console.log(`   ❌ Login endpoint test failed: ${error.message}`);
    return { success: false };
  }
}

// Test 3: Check OBP OAuth endpoints
async function testOBPEndpoints() {
  console.log("\n3. Testing OBP OAuth Endpoints...");

  const endpoints = [
    { name: "Health", url: `${CONFIG.OBP_BASE_URL}/health` },
    { name: "Authorization", url: `${CONFIG.OBP_BASE_URL}/obp-oidc/auth` },
    { name: "Token", url: `${CONFIG.OBP_BASE_URL}/obp-oidc/token` },
    { name: "UserInfo", url: `${CONFIG.OBP_BASE_URL}/obp-oidc/userinfo` },
    { name: "JWKS", url: `${CONFIG.OBP_BASE_URL}/obp-oidc/jwks` },
  ];

  let allEndpointsOk = true;

  for (const endpoint of endpoints) {
    try {
      const response = await makeRequest(endpoint.url);
      if (response.status >= 200 && response.status < 500) {
        console.log(`   ✅ ${endpoint.name}: ${response.status}`);
      } else {
        console.log(`   ❌ ${endpoint.name}: ${response.status}`);
        allEndpointsOk = false;
      }
    } catch (error) {
      console.log(`   ❌ ${endpoint.name}: ${error.message}`);
      allEndpointsOk = false;
    }
  }

  return allEndpointsOk;
}

// Test 4: Simulate OAuth callback (without actual auth)
async function testCallbackEndpoint() {
  console.log("\n4. Testing Callback Endpoint...");

  // This will fail because we don't have a valid code, but it should not return 404
  const fakeCode = "fake_authorization_code";
  const fakeState = "fake_state";

  try {
    const response = await makeRequest(
      `${CONFIG.APP_CALLBACK_URL}?code=${fakeCode}&state=${fakeState}`,
    );

    if (response.status === 400) {
      console.log(
        "   ✅ Callback endpoint exists and handles invalid requests",
      );
      console.log("   📝 This is expected - we sent a fake authorization code");
      return true;
    } else if (response.status === 404) {
      console.log("   ❌ Callback endpoint not found (404)");
      return false;
    } else {
      console.log(`   ⚠️  Callback endpoint returned: ${response.status}`);
      console.log(`   📝 Response: ${response.raw}`);
      return true; // Endpoint exists
    }
  } catch (error) {
    console.log(`   ❌ Callback endpoint test failed: ${error.message}`);
    return false;
  }
}

// Test 5: Configuration validation
async function testConfiguration() {
  console.log("\n5. Validating Configuration...");

  console.log(`   📋 App Base URL: ${CONFIG.APP_BASE_URL}`);
  console.log(`   📋 OBP Base URL: ${CONFIG.OBP_BASE_URL}`);
  console.log(`   📋 Client ID: ${CONFIG.CLIENT_ID}`);
  console.log(
    `   🔒 Client Secret: ${CONFIG.CLIENT_SECRET ? "[SET]" : "[MISSING]"}`,
  );
  console.log(`   🔄 Callback URL: ${CONFIG.CALLBACK_URL}`);

  // Validate URLs
  try {
    new URL(CONFIG.APP_BASE_URL);
    new URL(CONFIG.OBP_BASE_URL);
    new URL(CONFIG.CALLBACK_URL);
    console.log("   ✅ All URLs are valid");
  } catch (error) {
    console.log("   ❌ Invalid URL format detected");
    return false;
  }

  // Check required values
  if (!CONFIG.CLIENT_ID || !CONFIG.CLIENT_SECRET) {
    console.log("   ❌ Missing required OAuth credentials");
    return false;
  }

  console.log("   ✅ Configuration is valid");
  return true;
}

// Main test runner
async function runTests() {
  const results = {
    appServer: false,
    loginEndpoint: false,
    obpEndpoints: false,
    callbackEndpoint: false,
    configuration: false,
  };

  // Run all tests
  results.appServer = await testAppServer();

  if (results.appServer) {
    const loginResult = await testLoginEndpoint();
    results.loginEndpoint = loginResult.success;

    // If login endpoint works, we can test the authorization URL
    if (loginResult.authUrl) {
      console.log("\n   🔗 You can test the full flow by visiting:");
      console.log(`   ${loginResult.authUrl}`);
    }
  }

  results.obpEndpoints = await testOBPEndpoints();
  results.callbackEndpoint = await testCallbackEndpoint();
  results.configuration = await testConfiguration();

  // Summary
  console.log("\n" + "=".repeat(50));
  console.log("📊 TEST SUMMARY");
  console.log("=".repeat(50));

  console.log(`API Manager II Server: ${results.appServer ? "✅" : "❌"}`);
  console.log(`Login Endpoint: ${results.loginEndpoint ? "✅" : "❌"}`);
  console.log(`OBP Endpoints: ${results.obpEndpoints ? "✅" : "❌"}`);
  console.log(`Callback Endpoint: ${results.callbackEndpoint ? "✅" : "❌"}`);
  console.log(`Configuration: ${results.configuration ? "✅" : "❌"}`);

  const overallSuccess = Object.values(results).every(Boolean);
  console.log(
    `\n🎯 Overall Status: ${overallSuccess ? "✅ READY" : "❌ ISSUES FOUND"}`,
  );

  if (overallSuccess) {
    console.log("\n🚀 OAuth flow appears to be properly configured!");
    console.log("📝 Next steps:");
    console.log("1. Visit: http://localhost:3003/login");
    console.log('2. Click "Login with Open Bank Project"');
    console.log("3. Authenticate with your OBP credentials");
    console.log("4. You should be redirected back to the dashboard");
  } else {
    console.log("\n⚠️  Issues found. Please check:");
    if (!results.appServer)
      console.log("   - Start API Manager II: npm run dev");
    if (!results.obpEndpoints)
      console.log("   - Ensure OBP server is running on http://127.0.0.1:9000");
    if (!results.configuration)
      console.log("   - Check .env file configuration");
    if (!results.callbackEndpoint)
      console.log("   - Verify callback route is properly configured");
  }

  console.log("\n💡 For detailed setup instructions, see: SETUP_GUIDE.md");

  process.exit(overallSuccess ? 0 : 1);
}

// Handle errors
process.on("unhandledRejection", (error) => {
  console.error("\n❌ Unhandled error:", error);
  process.exit(1);
});

// Run the tests
runTests().catch((error) => {
  console.error("\n❌ Test runner failed:", error);
  process.exit(1);
});
