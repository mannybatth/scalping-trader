import { getContracts } from '../alpaca/contracts';
import { createOrder, OrderRequest } from '../alpaca/orders';
import { getLastQuoteBySymbol, LastQuoteResponse } from '../alpaca/quote';
import { roundToCents } from '../libs/helpers';
import { DateTime } from 'luxon';

export interface BuyOptionAction {
    symbol: string;
    type: 'call' | 'put';
}

export const buyBestOption = async ({ symbol, type }: BuyOptionAction): Promise<any> => {
    try {
        console.log('buyOption', symbol, type);

        // Check if the current time is 15 minutes before 4 PM in Eastern Time Zone
        const now = DateTime.now().setZone('America/New_York');
        const marketClose = now.set({ hour: 16, minute: 0, second: 0, millisecond: 0 }); // Set market close time to 4 PM
        const fifteenMinutesBeforeClose = marketClose.minus({ minutes: 15 });

        if (now >= fifteenMinutesBeforeClose) {
            console.log('Exiting: It is 15 minutes before market close.');
            return;
        }

        // Fetch the option chain for the symbol
        const { contracts } = await getContracts(symbol, type);

        if (!contracts?.length) {
            throw new Error('No options contracts found for the given symbol.');
        }

        // Find the contract with the highest open interest
        const bestHighInterestContract = contracts.reduce((prev, current) =>
            (Number(current.open_interest) > Number(prev.open_interest)) ? current : prev
        );

        if (!bestHighInterestContract) {
            throw new Error('No high interest contract found');
        }

        // Get the last quote for the selected contract
        const lastQuoteResponse: LastQuoteResponse = await getLastQuoteBySymbol(bestHighInterestContract.symbol);
        const askPrice = lastQuoteResponse.quote.ap;
        const bidPrice = lastQuoteResponse.quote.bp;

        // Calculate take profit and stop loss prices
        const takeProfitPrice = roundToCents(askPrice * 1.10);
        const stopLossPrice = roundToCents(bidPrice * 0.10);

        // Place a market order for one contract
        const orderRequest: OrderRequest = {
            symbol: bestHighInterestContract.symbol,
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
