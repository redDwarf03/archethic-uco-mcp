const { getArchethicUcoPrice, ARCHETHIC_API_URL, UCO_PRICE_QUERY } = require('./index');

// Mock the global fetch function
global.fetch = jest.fn();

describe('getArchethicUcoPrice', () => {
    beforeEach(() => {
        // Clear mock calls and implementations before each test
        fetch.mockClear();
        // Ensure console.error is restored if a test fails mid-way
        jest.restoreAllMocks();
    });

    it('should return UCO prices when the API call is successful', async () => {
        // Mock a successful response from the Archethic API
        const mockApiResponse = {
            data: {
                oracleData: {
                    timestamp: 1700000000,
                    services: {
                        uco: {
                            eur: 0.11,
                            usd: 0.12,
                        },
                    },
                },
            },
        };

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockApiResponse,
        });

        const result = await getArchethicUcoPrice();

        // Check if fetch was called correctly
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(ARCHETHIC_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ query: UCO_PRICE_QUERY }),
        });

        // Check the result
        expect(result).toEqual({
            timestamp: 1700000000,
            usd: 0.12,
            eur: 0.11,
        });
    });

    it('should throw an error if the API response is not ok', async () => {
        // Suppress console.error for this specific test
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        // Mock a failed HTTP response
        fetch.mockResolvedValueOnce({
            ok: false,
            status: 500,
        });

        // Expect the function to throw an error
        await expect(getArchethicUcoPrice()).rejects.toThrow('HTTP error! status: 500');

        // Restore console.error
        consoleErrorSpy.mockRestore();
    });

    it('should throw an error if the API returns GraphQL errors', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        // Mock a response containing GraphQL errors
        const mockErrorResponse = {
            errors: [{ message: 'Invalid query' }],
        };

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockErrorResponse,
        });

        await expect(getArchethicUcoPrice()).rejects.toThrow('GraphQL error: Invalid query');

        consoleErrorSpy.mockRestore();
    });

    it('should throw an error if the response structure is invalid', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        // Mock a response with missing data
        const mockInvalidResponse = {
            data: {
                // Missing oracleData or services.uco
            },
        };

        fetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockInvalidResponse,
        });

        await expect(getArchethicUcoPrice()).rejects.toThrow('Invalid response structure from Archethic API');

        consoleErrorSpy.mockRestore();
    });

    it('should throw an error if fetch itself fails (network error)', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });

        // Mock fetch to reject
        const networkError = new Error('Network failure');
        fetch.mockRejectedValueOnce(networkError);

        await expect(getArchethicUcoPrice()).rejects.toThrow('Network failure');

        consoleErrorSpy.mockRestore();
    });

});

// TODO: Add tests for the MCP server tool handler if needed,
// potentially by extracting the handler logic into a separate, testable function. 