import { DateTime } from 'luxon';
import { createOrderByContractSymbol } from './buy_option';
import { getOptionSnapshots, OptionSnapshot } from '../alpaca/contracts';

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
            console.log('Exiting: It is 15 minutes before market close or market is closed.');
            return;
        }

        // Fetch the option chain for the symbol
        const { snapshots } = await getOptionSnapshots(symbol, type);

        if (!snapshots?.length) {
            throw new Error('No options contracts found for the given symbol.');
        }

        // Sort the contracts by strike price and open interest
        const sortedContracts = snapshots.sort((a: OptionSnapshot, b: OptionSnapshot) => {
            const strikePriceA = Number(a.strikePrice);
            const strikePriceB = Number(b.strikePrice);
            const openInterestA = Number(a.openInterest);
            const openInterestB = Number(b.openInterest);

            if (type === 'call') {
                if (strikePriceA !== strikePriceB) {
                    return strikePriceA - strikePriceB; // Lowest strike price first
                }
            } else {
                if (strikePriceA !== strikePriceB) {
                    return strikePriceB - strikePriceA; // Highest strike price first
                }
            }

            return openInterestB - openInterestA; // Highest open interest first
        });

        // Find the best contract with close_price greater than 0.15
        const bestContract: OptionSnapshot | null = sortedContracts.find(contract => Number(contract.latestTrade.p) > 0.15) || null;

        if (!bestContract) {
            throw new Error('No suitable contract found');
        }

        // Get the last quote for the selected contract
        const orderResponse = await createOrderByContractSymbol({
            contractSymbol: bestContract.symbol,
            currentPrice: bestContract.latestTrade.p
        });
        return orderResponse;
    } catch (err: any) {
        const e = err?.response?.data || err;
        console.log(e);
        throw e;
    }
};
