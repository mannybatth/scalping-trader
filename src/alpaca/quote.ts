import axios from 'axios';
import { ALPACA_DOMAIN, ALPACA_KEY, ALPACA_SECRET } from '../constants';

export interface Quote {
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

export interface LastQuoteResponse {
    symbol: string;
    quote: Quote;
}

export const getLastQuoteBySymbol = async (symbol: string): Promise<LastQuoteResponse> => {
    try {
        const response = await axios.get<LastQuoteResponse>(`${ALPACA_DOMAIN}/v2/stocks/${symbol}/quotes/latest`, {
            headers: {
                'APCA-API-KEY-ID': ALPACA_KEY,
                'APCA-API-SECRET-KEY': ALPACA_SECRET
            }
        });
        console.log('last quote response', response.data);
        return response.data;
    } catch (err: any) {
        const e = err?.response?.data || err;
        console.log('last quote error', e);
        throw e;
    }
};
