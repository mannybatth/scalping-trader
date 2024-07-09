import { DateTime } from 'luxon';
import { createOrder, OrderRequest } from '../alpaca/orders';
import { AlpacaAccount, getAccount } from '../alpaca/account';
import { getOptionContractBySymbolOrId } from '../alpaca/contracts';
// import { getLastOptionQuotesBySymbols } from '../alpaca/option-quote';

export interface BuyOptionAction {
    contractSymbol: string;
    closePrice?: string;
}

export const createOrderByContractSymbol = async ({ contractSymbol, closePrice }: BuyOptionAction): Promise<any> => {
    try {
        console.log('createOrderByContractSymbol', contractSymbol);

        // Check if the current time is 15 minutes before 4 PM in Eastern Time Zone
        const now = DateTime.now().setZone('America/New_York');
        // const marketClose = now.set({ hour: 16, minute: 0, second: 0, millisecond: 0 }); // Set market close time to 4 PM
        // const fifteenMinutesBeforeClose = marketClose.minus({ minutes: 15 });

        // if (now >= fifteenMinutesBeforeClose) {
        //     console.log('Exiting: It is 15 minutes before market close or market is closed.');
        //     return;
        // }

        if (!closePrice) {
            const contract = await getOptionContractBySymbolOrId(contractSymbol);
            closePrice = contract.close_price;
        }
        // const response = await getLastOptionQuotesBySymbols(contractSymbol);
        // console.log('getLastOptionQuotesBySymbols response', response)
        // const quote = response.quotes[0];
        // closePrice = String(quote.ap);

        // Fetch the account information
        const account: AlpacaAccount = await getAccount();
        const buyingPower = parseFloat(account.options_buying_power);
        const budget = buyingPower * 0.07;
        const costPerContract = closePrice ? parseFloat(closePrice) * 100 : 0;

        // Calculate the quantity to buy, min 1, max 500
        let qty = Math.floor(budget / costPerContract);
        qty = Math.min(qty, 500);
        qty = Math.max(qty, 1);

        console.log('buyingPower', buyingPower);
        console.log('budget', budget);
        console.log('costPerContract', costPerContract);
        console.log('qty', qty);

        // Place a market order for the calculated quantity
        const orderRequest: OrderRequest = {
            symbol: contractSymbol,
            qty: qty.toString(),
            side: 'buy',
            type: 'market',
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
