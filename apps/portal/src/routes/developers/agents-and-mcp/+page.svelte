<script lang="ts">
    import { getContext } from 'svelte';
    import CodeBlock from '$lib/components/CodeBlock.svelte';

    const ctx: any = getContext('developerContext');
</script>

<svelte:head>
    <title>Agents and MCP - OBP Developers</title>
</svelte:head>

<div class="prose prose-lg max-w-none dark:prose-invert">
    <h2>AI Agents and the Model Context Protocol</h2>

    <p>
        The Open Bank Project supports integration with AI agents through the
        <strong>Model Context Protocol (MCP)</strong>. MCP is an open standard that allows AI
        assistants and agents to discover and call APIs in a structured way.
    </p>

    <h3>What is MCP?</h3>

    <p>
        The Model Context Protocol provides a standardised way for AI models to interact with
        external tools and data sources. Instead of hard-coding API knowledge into an AI model, MCP
        lets the model discover available tools at runtime and call them with the correct parameters.
    </p>

    <p>
        Think of it as a universal adapter between AI agents and APIs. The agent asks "what can I
        do?" and the MCP server responds with a list of available tools, their parameters, and
        descriptions.
    </p>

    <h3>OBP MCP Server</h3>

    <p>
        The OBP MCP server exposes the OBP API as a set of tools that any MCP-compatible AI agent
        can use. It provides:
    </p>

    <ul>
        <li><strong>Endpoint discovery</strong> &mdash; list all available API endpoints, filtered by tag</li>
        <li><strong>Schema inspection</strong> &mdash; get the full request/response schema for any endpoint</li>
        <li><strong>API calls</strong> &mdash; make authenticated calls to the OBP API</li>
        <li><strong>Glossary access</strong> &mdash; look up OBP terminology and concepts</li>
    </ul>

    <h3>Available MCP Tools</h3>

    <table>
        <thead>
            <tr>
                <th>Tool</th>
                <th>Description</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td><code>list_all_endpoint_tags</code></td>
                <td>List all API tags (categories) to discover available endpoint groups</td>
            </tr>
            <tr>
                <td><code>list_endpoints_by_tag</code></td>
                <td>List endpoints within a specific tag/category</td>
            </tr>
            <tr>
                <td><code>get_endpoint_schema</code></td>
                <td>Get the full schema (parameters, request body, response) for an endpoint</td>
            </tr>
            <tr>
                <td><code>call_obp_api</code></td>
                <td>Make an authenticated API call to any OBP endpoint</td>
            </tr>
            <tr>
                <td><code>list_glossary_terms</code></td>
                <td>List all glossary terms and their definitions</td>
            </tr>
            <tr>
                <td><code>get_glossary_term</code></td>
                <td>Get the full definition of a specific glossary term</td>
            </tr>
        </tbody>
    </table>

    <h3>Using with Claude</h3>

    <p>
        To connect Claude (or Claude Code) to the OBP API via MCP, add the OBP MCP server to your
        configuration:
    </p>

    <CodeBlock
        code={`{
  "mcpServers": {
    "obp-mcp": {
      "command": "npx",
      "args": ["-y", "obp-mcp-server"],
      "env": {
        "OBP_API_HOST": "https://YOUR_OBP_HOST",
        "OBP_TOKEN": "YOUR_DIRECT_LOGIN_TOKEN"
      }
    }
  }
}`}
        apiHost={ctx.apiHost}
        showHost={true}
    />

    <p>
        Once configured, the AI agent can discover and call OBP API endpoints autonomously. For
        example, you could ask Claude: "List the banks available on this OBP instance" and it will
        use the MCP tools to make the API call and return the results.
    </p>

    <h3>Using with Other AI Agents</h3>

    <p>
        Any AI agent or framework that supports MCP can connect to the OBP MCP server. This includes:
    </p>

    <ul>
        <li><strong>Claude Desktop</strong> &mdash; add the MCP server in settings</li>
        <li><strong>Claude Code</strong> &mdash; configure via <code>.mcp.json</code> in your project</li>
        <li><strong>Custom agents</strong> &mdash; use the MCP SDK to connect programmatically</li>
    </ul>

    <h3>Building Your Own Agent</h3>

    <p>
        You can build custom AI agents that interact with the OBP API by:
    </p>

    <ol>
        <li>Setting up the OBP MCP server with your credentials</li>
        <li>Using an MCP client library to connect your agent to the server</li>
        <li>Letting your agent discover available tools and make API calls</li>
    </ol>

    <p>
        This enables powerful use cases like automated compliance checking, transaction monitoring,
        customer onboarding workflows, and natural language banking interfaces.
    </p>

    <h3>Resources</h3>

    <ul>
        <li><a href="https://modelcontextprotocol.io" target="_blank" rel="noopener noreferrer">Model Context Protocol specification</a></li>
        <li><a href="https://github.com/OpenBankProject" target="_blank" rel="noopener noreferrer">OBP GitHub organisation</a></li>
        <li><a href="/developers/opey">Opey</a> &mdash; the built-in OBP AI assistant</li>
        <li><a href="/developers/direct-login">Direct Login</a> &mdash; get a token for your MCP server</li>
        {#if ctx.apiExplorerUrl}
            <li><a href={ctx.apiExplorerUrl} target="_blank" rel="noopener noreferrer">API Explorer</a> &mdash; browse all available endpoints</li>
        {/if}
    </ul>
</div>
