# MCP Integration Status

**Date:** 2024-05-16

**Objective:** Integrate Model Context Protocol (MCP) support into the Balaur framework to allow communication with MCP clients, specifically targeting the Claude Desktop App.

**Summary:**

Basic MCP support has been added to the framework. An MCP server (`framework/mcp_server.ts`) was created using the `@modelcontextprotocol/sdk`. This server exposes the framework's `ResourceStore` functionality (CRUD and list operations) as MCP tools.

The initial implementation aimed to use Deno KV for persistent storage via the `ResourceStore`, aligning with the project's tech stack documentation. However, a blocking issue related to Deno KV prevented this approach from working.

As a temporary workaround, the `ResourceStore` (`framework/store/resource-store.ts`) has been reverted to use a simple in-memory `Map`. This allows the MCP server to run but means **data is not persisted** between server restarts.

**Work Completed:**

1.  **Dependency Added:** MCP SDK (`npm:@modelcontextprotocol/sdk@1.8.0`) added to `deno.json`.
2.  **MCP Server Created:** `framework/mcp_server.ts` implemented, including:
    *   Server setup using `Server` from the SDK.
    *   Tool definitions (`getResource`, `listResources`, `createResource`, `updateResource`, `deleteResource`) mapping to `ResourceStore` methods.
    *   Input validation using Zod for create/update tools.
    *   Refactored handlers for testability (dependency injection).
    *   Graceful shutdown handling.
3.  **ResourceStore Implementation:**
    *   Initially refactored `framework/store/resource-store.ts` to use Deno KV.
    *   **Reverted** to an in-memory `Map` implementation due to runtime errors.
4.  **Testing:**
    *   Test file `framework/mcp_server_test.ts` created.
    *   Tests validate MCP handlers against an in-memory store.
    *   *Note: Tests currently pass using the Map-based store. They would need adjustment if switching back to KV.* 
5.  **Configuration:**
    *   `deno task mcp` added to `deno.json` for running the server.
    *   `nodeModulesDir: auto` added to `deno.json` to aid npm dependency resolution.
6.  **Architecture Diagram:** Created `ai_docs/architecture.md` illustrating the intended design and highlighting the Deno KV blocker.

**Current Status:**

*   The MCP server can be started using `deno task mcp`.
*   It exposes the resource operations as MCP tools.
*   **Persistence is non-functional**; uses an in-memory Map.

**Blocking Issue:**

*   **`TypeError: Deno.openKv is not a function`:** Attempts to use Deno KV consistently fail with this error, even in minimal test scripts, despite using Deno version 2.2.5 where KV is stable. This prevents the use of Deno KV for persistence.
    *   **Troubleshooting Attempted:** Removing deprecated `--unstable` flag, ensuring correct permissions, isolating the call in a separate script, `deno cache`, enabling `nodeModulesDir`. None resolved the issue.
    *   **Suspected Cause:** Potential issue with the Deno installation/environment itself, rather than the framework code.

**Next Steps / Problems to Fix:**

1.  **Resolve Deno KV Issue:** The fundamental problem (`TypeError: Deno.openKv is not a function`) must be addressed. Recommended actions:
    *   Try `deno upgrade`.
    *   If upgrade fails, attempt a full reinstall of Deno.
    *   Verify system environment variables or other potential conflicts.
2.  **Restore Deno KV in ResourceStore:** Once the Deno environment issue is fixed, revert `framework/store/resource-store.ts` back to the Deno KV implementation.
3.  **Verify Tests with KV:** Update/verify tests in `framework/mcp_server_test.ts` to work correctly with the asynchronous nature and potential setup/teardown needs of the Deno KV-backed `ResourceStore`.
4.  **Refine Error Handling:** Improve error reporting from MCP tool handlers for better client communication.
5.  **(Optional) Investigate MCP Resource Format:** Check if a specific MCP resource structure is preferred over the direct `Resource.toJSON()` output. 