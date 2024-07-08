import { createOrder, OrderRequest } from '../alpaca/orders';
import { DateTime } from 'luxon';

export interface BuyOptionAction {
    contractSymbol: string;
}

export const createOrderByContractSymbol = async ({ contractSymbol }: BuyOptionAction): Promise<any> => {
    try {
        console.log('createOrderByContractSymbol', contractSymbol);

        // Check if the current time is 15 minutes before 4 PM in Eastern Time Zone
        const now = DateTime.now().setZone('America/New_York');
        const marketClose = now.set({ hour: 16, minute: 0, second: 0, millisecond: 0 }); // Set market close time to 4 PM
        const fifteenMinutesBeforeClose = marketClose.minus({ minutes: 15 });

        if (now >= fifteenMinutesBeforeClose) {
            console.log('Exiting: It is 15 minutes before market close or market is closed.');
            return;
        }

        // Place a market order for one contract
        const orderRequest: OrderRequest = {
            symbol: contractSymbol,
            qty: 1,
            side: 'buy',
            type: 'market',
            time_in_force: 'day',
            order_class: 'bracket',
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
