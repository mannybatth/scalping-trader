import { getContracts } from '../alpaca/contracts';
import { createOrder, OrderRequest } from '../alpaca/orders';
import { roundToCents } from '../libs/helpers';

export interface BuyOptionAction {
    symbol: string;
    type: 'call' | 'put';
}

export const buyOption = async ({ symbol, type }: BuyOptionAction): Promise<any> => {
    try {
        console.log('buyOption', symbol, type);

        // Fetch the option chain for the symbol
        const contracts = await getContracts(symbol, type);

        if (!contracts?.length) {
            throw new Error('No options contracts found for the given symbol.');
        }

        // Find the first out-of-the-money (OTM) option
        const underlyingPrice = contracts[0]?.underlying_price;
        const otmOption = contracts.find(option =>
            option.type === type &&
            ((type === 'call' && option.strike_price > underlyingPrice) ||
             (type === 'put' && option.strike_price < underlyingPrice))
        );

        if (!otmOption) {
            throw new Error('No out-of-the-money option found');
        }

        // Calculate take profit and stop loss prices
        const takeProfitPrice = roundToCents(otmOption.last_price * 1.15);
        const stopLossPrice = roundToCents(otmOption.last_price * 0.1);

        // Place a market order for one contract
        const orderRequest: OrderRequest = {
            symbol: otmOption.symbol,
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
            }
        };

        const orderResponse = await createOrder(orderRequest);
        return orderResponse;
    } catch (err: any) {
        const e = err?.response?.data || err;
        console.log(e);
        throw e;
    }
};
