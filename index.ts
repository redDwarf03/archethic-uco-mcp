import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

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

// Create MCP server
const server = new McpServer({
  name: 'Archethic UCO Price Oracle',
  version: '1.0.0',
  capabilities: {
    resources: {},
    tools: {},
  },
});

/**
 * Fetches the latest UCO price data from the Archethic GraphQL API.
 * @returns {Promise<object>} A promise that resolves to an object containing the timestamp, usd price, and eur price.
 * @throws {Error} Throws an error if the fetch fails, the API returns an error, or the response structure is invalid.
 */
async function getArchethicUcoPrice<T>(): Promise<T | null> {
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

    return (await response.json()) as T;

  } catch (error) {
    console.error("Error fetching Archethic UCO price:", error);
    return null;
  }
}

function formatUcoPrice(priceData: UcoPriceResponse): string {
  return JSON.stringify({
    source: 'Archethic Oracle',
    asset: 'UCO',
    price_usd: priceData.data.oracleData.services.uco.usd,
    price_eur: priceData.data.oracleData.services.uco.eur,
  });
}

// Define schema as a plain object instead of Zod
const getUcoPriceSchemaPlain = {
  type: 'object',
  properties: {},
  required: [],
  additionalProperties: false,
  description: 'Fetches the latest UCO price (USD and EUR) from the Archethic network oracle',
  name: 'getUcoPrice',
  parameters: {}
};

// Tool: Get UCO Price
server.tool(
  'getUcoPrice',
  'Fetches the latest UCO price (USD and EUR) from the Archethic network oracle',
  {
    state: z.object({
      priceData: z.object({
        timestamp: z.number(),
        usd: z.number(),
        eur: z.number(),
      }),
    }),
  },
  /**
   * MCP tool handler for fetching UCO price.
   * Calls getArchethicUcoPrice and formats the result for the MCP client.
   * Handles errors during the fetch process.
   * @returns {Promise<object>} A promise resolving to the MCP response object.
   */
  async ({ state }) => {
    try {
      // Specify the expected response type
      const priceData = await getArchethicUcoPrice<UcoPriceResponse>();

      if (!priceData || !priceData.data || !priceData.data.oracleData) {
        throw new Error('Invalid or no price data received from Archethic Oracle');
      }

      // Assign the correct structure to state.priceData
      state.priceData = {
        timestamp: priceData.data.oracleData.timestamp,
        usd: priceData.data.oracleData.services.uco.usd,
        eur: priceData.data.oracleData.services.uco.eur,
      };

      // Pass the correctly typed priceData
      const formattedPrice = formatUcoPrice(priceData);

      return {
        content: [{
          type: 'text',
          text: formattedPrice
        }]
      };
    } catch (error) {
      // Check if error is an instance of Error before accessing message
      const message = error instanceof Error ? error.message : String(error);
      return {
        content: [{
          type: 'text',
          text: `Error fetching UCO price: ${message}`
        }],
        isError: true
      };
    }
  }
);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Archethic UCO Price Oracle MCP Server running on stdio");
}

// Only run main() when the script is executed directly
if (import.meta.url.startsWith('file://') && process.argv[1] === import.meta.url.substring(7)) {
  main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
  });
}

// Export functions and constants for testing purposes
export {
  getArchethicUcoPrice,
  ARCHETHIC_API_URL,
  UCO_PRICE_QUERY,
};

// Export the interface for use in tests
export interface UcoPriceResponse {
  data: {
    oracleData: {
      timestamp: number;
      services: {
        uco: {
          eur: number;
          usd: number;
        };
      };
    };
  };
}