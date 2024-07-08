import axios from 'axios';
import { ALPACA_DATA_URL, ALPACA_KEY, ALPACA_SECRET } from '../constants';

export interface OptionQuote {
    T: string;           // Message type, always "q"
    S: string;           // Symbol
    bx: string;          // Bid exchange code
    bp: number;          // Bid price
    bs: number;          // Bid size
    ax: string;          // Ask exchange code
    ap: number;          // Ask price
    as: number;          // Ask size
    c: string[];         // Quote conditions
    t: string;           // Timestamp with nanosecond precision
    z: string;           // Tape
}

export interface LastOptionQuotesResponse {
    quotes: { [symbol: string]: OptionQuote };
}

export const getLastOptionQuotesBySymbols = async (symbols: string, feed: string = 'opra'): Promise<LastOptionQuotesResponse> => {
    try {
        const response = await axios.get<LastOptionQuotesResponse>(`${ALPACA_DATA_URL}/v1beta1/options/quotes/latest`, {
            params: {
                symbols: symbols,
                feed: feed
            },
            headers: {
                'APCA-API-KEY-ID': ALPACA_KEY,
                'APCA-API-SECRET-KEY': ALPACA_SECRET
            }
        });
        console.log('last option quotes response', response.data);
        return response.data;
    } catch (err: any) {
        const e = err?.response?.data || err;
        console.log('last option quotes error', e);
        throw e;
    }
};
