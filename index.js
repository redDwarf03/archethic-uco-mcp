const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const { z } = require('zod');

// Archethic API details
const ARCHETHIC_API_URL = 'https://mainnet.archethic.net/api';
const UCO_PRICE_QUERY = `
  query {
    oracleData {
      timestamp
      services {
        uco {
          eur
          usd
        }
      }
    }
  }
`;

/**
 * Fetches the latest UCO price data from the Archethic GraphQL API.
 * @returns {Promise<object>} A promise that resolves to an object containing the timestamp, usd price, and eur price.
 * @throws {Error} Throws an error if the fetch fails, the API returns an error, or the response structure is invalid.
 */
async function getArchethicUcoPrice() {
  try {
    const response = await fetch(ARCHETHIC_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({ query: UCO_PRICE_QUERY }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();

    if (result.errors) {
      throw new Error(`GraphQL error: ${result.errors.map(e => e.message).join(', ')}`);
    }

    const oracleData = result?.data?.oracleData;
    if (!oracleData || !oracleData.services?.uco) {
      throw new Error('Invalid response structure from Archethic API');
    }

    return {
      timestamp: oracleData.timestamp, // Unix timestamp (likely seconds since epoch)
      usd: oracleData.services.uco.usd,
      eur: oracleData.services.uco.eur,
    };
  } catch (error) {
    console.error("Error fetching Archethic UCO price:", error);
    throw error; // Re-throw error to be caught by the tool handler
  }
}


// Create MCP server
const server = new McpServer({
  name: 'Archethic UCO Price Oracle',
  version: '1.0.0',
  capabilities: {
    tools: {}
  }
});

// Tool schema for getting UCO price
const getUcoPriceSchema = z.object({
  // No parameters needed for now, it always fetches UCO price
}).describe('Fetches the latest UCO price (USD and EUR) from the Archethic oracle.');

// Tool: Get UCO Price
server.tool(
  'getUcoPrice',
  'Fetches the latest UCO price (USD and EUR) from the Archethic network oracle',
  getUcoPriceSchema,
  /**
   * MCP tool handler for fetching UCO price.
   * Calls getArchethicUcoPrice and formats the result for the MCP client.
   * Handles errors during the fetch process.
   * @returns {Promise<object>} A promise resolving to the MCP response object.
   */
  async () => { // No parameters needed from input schema
    try {
      const priceData = await getArchethicUcoPrice();

      // Convert Unix timestamp (assumed seconds) to ISO 8601 string for better readability
      const isoTimestamp = new Date(priceData.timestamp * 1000).toISOString();

      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            source: 'Archethic Oracle',
            asset: 'UCO',
            price_usd: priceData.usd,
            price_eur: priceData.eur,
            timestamp: isoTimestamp, // ISO 8601 format
            raw_timestamp: priceData.timestamp // Original Unix timestamp
          }, null, 2)
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: 'text',
          text: `Error fetching UCO price: ${error.message}`
        }],
        isError: true
      };
    }
  }
);

// Start the server only when the script is executed directly
if (require.main === module) {
  async function startServer() {
    const transport = new StdioServerTransport();
    try {
      await server.connect(transport); // Corrected from server.listen
      console.log('Archethic UCO Price MCP Server started');
    } catch (error) {
      console.error('Failed to start server connection:', error);
      process.exit(1);
    }
  }

  startServer(); // Call startServer only when run directly
}

// Export functions and constants for testing purposes
module.exports = {
  getArchethicUcoPrice,
  ARCHETHIC_API_URL,
  UCO_PRICE_QUERY,
  // Note: server instance is not exported as it's harder to test directly
  // We'll test the handler function separately if needed
};