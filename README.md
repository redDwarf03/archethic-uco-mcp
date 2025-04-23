# Archethic UCO Price MCP Server

An MCP server providing real-time UCO price (USD & EUR) from the Archethic network's OracleChain via its GraphQL API.

[![License](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
[![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)](https://nodejs.org/)
![Status](https://img.shields.io/badge/status-active-brightgreen.svg)

This server allows AI agents and other applications using the Model Context Protocol (MCP) to easily query the latest UCO token price.

## Features

- **Get Latest UCO Price**: Fetches the latest price of the UCO token in both USD and EUR, along with the last update timestamp, directly from the Archethic oracle (`https://mainnet.archethic.net/api`).

## Prerequisites

- **Node.js**: Version 18.x or higher.
- **npm**: For dependency installation.
- **MCP Inspector** (optional): For testing the server locally.
- **Claude Desktop** (optional): For integration with Anthropic's Claude interface.

## Installation

1.  **Clone the Repository**:
    ```bash
    # Clone into a directory named 'archethic-uco-mcp'
    git clone https://github.com/redDwarf03/archethic-uco-mcp.git archethic-uco-mcp
    cd archethic-uco-mcp
    ```

2.  **Install Dependencies**:
    ```bash
    npm install
    ```
    This will install the required dependencies:
    - `@modelcontextprotocol/sdk`: For MCP server functionality.
    - `zod`: For input validation schema definition (used even if the tool takes no parameters).
    - `https-proxy-agent`: (Dependency likely inherited or from previous version, may not be strictly required by the current code. Can potentially be removed after testing).

3.  **Configure MCP Client**:
    To use this server with an MCP client like Claude Desktop, add the following to your config file (or equivalent). Adjust the `path/to/archethic-uco-mcp/index.js` accordingly.

    ```json
    {
      "mcpServers": {
        "archethic-uco-mcp": {
          "command": "node",
          "args": ["path/to/archethic-uco-mcp/index.js"]
        }
      }
    }
    ```

4.  **Run the Server**:
    ```bash
    node index.js
    ```
    The server will start and listen for MCP requests via stdio.

## Usage

The server exposes one tool via the MCP protocol: `getUcoPrice`.

### Tool: `getUcoPrice`

- **Description**: Fetches the latest UCO price (USD and EUR) from the Archethic network oracle. Returns a JSON object like this:
  ```json
  {
    "source": "Archethic Oracle",
    "asset": "UCO",
    "price_usd": 0.12345,
    "price_eur": 0.11567,
    "timestamp": "2025-04-17T12:00:00.000Z",
    "raw_timestamp": 1713355200
  }
  ```

- **Parameters**: None.

- **Natural Language Example (Claude Desktop)**:

  > **Input**: "What is the current price of UCO from the Archethic oracle?"

  > **Output**: (Claude would process the JSON output)
  > "The current price of UCO, according to the Archethic Oracle, is $0.12345 USD and €0.11567 EUR, last updated at 2025-04-17 12:00:00 UTC."

## API Endpoint and Error Handling

- **API Endpoint**: The server queries the public Archethic GraphQL endpoint: `https://mainnet.archethic.net/api`.
- **Error Handling**: If the server encounters an error while fetching data (e.g., network issue, API error, unexpected response format), it will return an MCP error message to the client, indicating the problem.
  ```json
  {
    "content": [
      {
        "type": "text",
        "text": "Error fetching UCO price: [Specific error message here]"
      }
    ],
    "isError": true
  }
  ```

## License

This project is licensed under the [MIT License](LICENSE).

