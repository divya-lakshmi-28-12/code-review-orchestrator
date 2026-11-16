/**
 * MCP Server Configuration
 *
 * Configures Model Context Protocol servers for the code review orchestrator.
 *
 * Transport Type: stdio - The client launches the server as a subprocess and
 * communicates via stdin/stdout.
 *
 * Command: npx - Runs npm packages without installing them globally.
 *
 * Resources:
 * - https://github.com/modelcontextprotocol/servers
 * - https://modelcontextprotocol.io/docs
 */

export interface MCPServerConfig {
  command: string;
  args: string[];
  env?: Record<string, string>;
}

export interface MCPConfig {
  mcpServers: Record<string, MCPServerConfig>;
}

export const mcpConfig: MCPConfig = {
  mcpServers: {
    // Filesystem server - provides file operations with access controls
    // Used for reading and analyzing code files in the repository
    filesystem: {
      command: 'npx',
      args: [
        '-y',
        '@modelcontextprotocol/server-filesystem',
        process.cwd() // Allow access to current working directory
      ],
      env: {
        // Optional: Set to "true" to enable read-only mode
        // FS_READ_ONLY: process.env.MCP_FILESYSTEM_READ_ONLY || 'false'
      }
    },

    // GitHub server - provides GitHub repository integration
    // Used for fetching PR diffs, commit history, and repository metadata
    github: {
      command: 'npx',
      args: [
        '-y',
        '@modelcontextprotocol/server-github'
      ],
      env: {
        // Required: GitHub Personal Access Token
        // Token should have repo permissions for private repositories
        GITHUB_PERSONAL_ACCESS_TOKEN: process.env.MCP_GITHUB_TOKEN || ''
      }
    },

    // Git server - provides local git repository operations
    // Used for analyzing commit history and repository structure
    git: {
      command: 'npx',
      args: [
        '-y',
        '@modelcontextprotocol/server-git',
        '--repository',
        process.cwd()
      ],
      env: {}
    }
  }
};

/**
 * Get enabled MCP servers based on environment configuration
 */
export function getEnabledServers(): MCPConfig {
  const enabledServers: Record<string, MCPServerConfig> = {};

  // Always enable filesystem server
  if (process.env.MCP_FILESYSTEM_ENABLED !== 'false') {
    enabledServers.filesystem = mcpConfig.mcpServers.filesystem;
  }

  // Enable GitHub server only if token is provided
  if (process.env.MCP_GITHUB_ENABLED === 'true' && process.env.MCP_GITHUB_TOKEN) {
    enabledServers.github = mcpConfig.mcpServers.github;
  }

  // Always enable git server for local repository operations
  enabledServers.git = mcpConfig.mcpServers.git;

  return { mcpServers: enabledServers };
}
