import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { getArchethicUcoPrice, ARCHETHIC_API_URL, UCO_PRICE_QUERY } from './index.js';
// Define the mock implementation with the correct async signature
const fetchMock = jest.fn();
global.fetch = fetchMock;
const mockedFetch = fetchMock; // Use this alias in tests
describe('getArchethicUcoPrice', () => {
    beforeEach(() => {
        mockedFetch.mockClear();
        jest.restoreAllMocks();
    });
    it('should return UCO prices when the API call is successful', async () => {
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
        // Simplify mock: provide only used properties and cast
        mockedFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockApiResponse,
        }); // Cast via unknown
        const result = await getArchethicUcoPrice();
        expect(fetch).toHaveBeenCalledTimes(1);
        expect(fetch).toHaveBeenCalledWith(ARCHETHIC_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
            },
            body: JSON.stringify({ query: UCO_PRICE_QUERY }),
        });
        expect(result).toEqual(mockApiResponse);
    });
    it('should return null if the API response is not ok', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        // Simplify mock: provide only 'ok' and cast
        mockedFetch.mockResolvedValueOnce({
            ok: false,
            status: 500, // Keep status for the error message check in original code
        });
        await expect(getArchethicUcoPrice()).resolves.toBeNull();
        expect(consoleErrorSpy).toHaveBeenCalledWith(expect.stringContaining('Error fetching Archethic UCO price:'), expect.any(Error));
        consoleErrorSpy.mockRestore();
    });
    it('should return null if the API response JSON parsing fails', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        const jsonError = new Error('Invalid JSON');
        // Simplify mock: provide ok and failing json() method
        mockedFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => { throw jsonError; },
        });
        await expect(getArchethicUcoPrice()).resolves.toBeNull();
        expect(consoleErrorSpy).toHaveBeenCalledWith("Error fetching Archethic UCO price:", jsonError);
        consoleErrorSpy.mockRestore();
    });
    it('should return the invalid structure if the response structure is invalid but fetch/json are ok', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        const mockInvalidResponse = {
            someOtherKey: 'value'
        };
        // Simplify mock: provide ok and json returning the invalid structure
        mockedFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockInvalidResponse,
        });
        await expect(getArchethicUcoPrice()).resolves.toEqual(mockInvalidResponse);
        expect(consoleErrorSpy).not.toHaveBeenCalled();
        consoleErrorSpy.mockRestore();
    });
    it('should return null if fetch itself fails (network error)', async () => {
        const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => { });
        const networkError = new Error('Network failure');
        mockedFetch.mockRejectedValueOnce(networkError);
        await expect(getArchethicUcoPrice()).resolves.toBeNull();
        expect(consoleErrorSpy).toHaveBeenCalledWith("Error fetching Archethic UCO price:", networkError);
        consoleErrorSpy.mockRestore();
    });
});
