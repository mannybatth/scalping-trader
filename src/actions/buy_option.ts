import { DateTime } from 'luxon';
import { createOrder, getAllOrders, OrderRequest } from '../alpaca/orders';
import { getAccount } from '../alpaca/account';
import { getLastOptionQuotesBySymbols } from '../alpaca/option-quote';
import { getAllOpenPositions } from '../alpaca/positions';

export interface BuyOptionAction {
    contractSymbol: string;
    currentPrice?: number;
    forceBuy?: boolean;
}

export const createOrderByContractSymbol = async ({ contractSymbol, currentPrice, forceBuy }: BuyOptionAction): Promise<any> => {
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

        if (!currentPrice) {
            const response = await getLastOptionQuotesBySymbols(contractSymbol);
            const quote = response.quotes[contractSymbol];

            if (!quote) {
                throw new Error('No option quote found for the given symbol.');
            }

            // currentPrice = (quote.bp + (quote.ap - quote.bp) * 0.80);
            currentPrice = quote.ap;
            currentPrice = Math.ceil(currentPrice * 100) / 100;
        }

        // Fetch the account information
        const [account, positions, orders] = await Promise.all([getAccount(), getAllOpenPositions(), getAllOrders({
            status: 'open',
            side: 'buy'
        })]);

        // Check if the account has any open positions for the symbol on the same side
        const openPosition = positions.find(position => position.symbol === contractSymbol);
        if (openPosition && !forceBuy) {
            console.log('Exiting: Open position already exists for the symbol.');
            return;
        }

        // Check if there are any pending orders for the symbol on the same side
        const openOrder = orders.find(order => order.symbol === contractSymbol);
        if (openOrder && !forceBuy) {
            console.log('Exiting: Open order already exists for the symbol.');
            return;
        }

        const accountDayProfit = Number(account.equity) - Number(account.last_equity);
        const goal = Number(account.last_equity) * 0.02;
        const isGoalReached = accountDayProfit >= goal;

        const buyingPower = parseFloat(account.options_buying_power);
        const budget = isGoalReached ? buyingPower * 0.1 : buyingPower * 0.2;
        const costPerContract = currentPrice ? currentPrice * 100 : 0;

        // Calculate the quantity to buy, min 1, max 500
        let qty = Math.floor(budget / costPerContract);
        qty = Math.min(qty, 500);
        qty = Math.max(qty, 1);

        console.log('isGoalReached', isGoalReached);
        console.log('buyingPower', buyingPower);
        console.log('budget', budget);
        console.log('costPerContract', costPerContract);
        console.log('qty', qty);

        // Place a market order for the calculated quantity
        const orderRequest: OrderRequest = {
            symbol: contractSymbol,
            qty: qty.toString(),
            side: 'buy',
            type: 'limit',
            limit_price: currentPrice.toString(),
            time_in_force: 'day',
            client_order_id: `auto-trade-${contractSymbol}-${now.toISO()}`
        };

        const orderResponse = await createOrder(orderRequest);
        return orderResponse;
    } catch (err: any) {
        const e = err?.response?.data || err;
        console.log(e);
        throw e;
    }
};
