import { getContracts } from '../alpaca/contracts';
import { DateTime } from 'luxon';
import { createOrderByContractSymbol } from './buy_option';

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
        const orderResponse = await createOrderByContractSymbol({ contractSymbol: bestHighInterestContract.symbol });
        return orderResponse;
    } catch (err: any) {
        const e = err?.response?.data || err;
        console.log(e);
        throw e;
    }
};
