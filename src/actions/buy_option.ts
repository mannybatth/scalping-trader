import { createOrder, OrderRequest } from '../alpaca/orders';
import { getLastQuoteBySymbol, LastQuoteResponse } from '../alpaca/quote';
import { roundToCents } from '../libs/helpers';
import { DateTime } from 'luxon';

export interface BuyOptionAction {
    contractSymbol: string;
}

const extractUnderlyingSymbol = (contractSymbol: string): string => {
    // Assuming the underlying symbol is the initial part of the contract symbol before the date
    const match = contractSymbol.match(/^[A-Z]+/);
    if (!match) {
        throw new Error('Invalid contract symbol format');
    }
    return match[0];
};

export const createOrderByContractSymbol = async ({ contractSymbol }: BuyOptionAction): Promise<any> => {
    try {
        console.log('createOrderByContractSymbol', contractSymbol);

        // Check if the current time is 15 minutes before 4 PM in Eastern Time Zone
        const now = DateTime.now().setZone('America/New_York');
        const marketClose = now.set({ hour: 16, minute: 0, second: 0, millisecond: 0 }); // Set market close time to 4 PM
        const fifteenMinutesBeforeClose = marketClose.minus({ minutes: 15 });

        if (now >= fifteenMinutesBeforeClose) {
            console.log('Exiting: It is 15 minutes before market close.');
            return;
        }

        // Extract the underlying stock symbol from the contract symbol
        const underlyingSymbol = extractUnderlyingSymbol(contractSymbol);

        // Get the last quote for the underlying symbol
        const lastQuoteResponse: LastQuoteResponse = await getLastQuoteBySymbol(underlyingSymbol);
        const askPrice = lastQuoteResponse.quote.ap;
        const bidPrice = lastQuoteResponse.quote.bp;

        // Calculate take profit and stop loss prices
        const takeProfitPrice = roundToCents(askPrice * 1.10);
        const stopLossPrice = roundToCents(bidPrice * 0.10);

        // Place a market order for one contract
        const orderRequest: OrderRequest = {
            symbol: contractSymbol,
            qty: 1,
            side: 'buy',
            type: 'market',
            time_in_force: 'day',
            order_class: 'bracket',
            take_profit: {
                limit_price: takeProfitPrice
            },
            stop_loss: {
                stop_price: stopLossPrice
            },
            position_intent: 'BTO'
        };

        const orderResponse = await createOrder(orderRequest);
        return orderResponse;
    } catch (err: any) {
        const e = err?.response?.data || err;
        console.log(e);
        throw e;
    }
};
