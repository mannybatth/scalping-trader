import axios from 'axios';
import { ALPACA_DOMAIN, ALPACA_KEY, ALPACA_SECRET } from '../constants';

export interface Trade {
    t: string;           // Timestamp
    x: string;           // Exchange
    p: number;           // Price
    s: number;           // Size
    c: string[];         // Trade conditions
    i: number;           // Trade ID
    z: string;           // Tape
}

export interface LastTradeResponse {
    symbol: string;
    trade: Trade;
}

export const getLastTradeBySymbol = async (symbol: string): Promise<LastTradeResponse> => {
    try {
        const response = await axios.get<LastTradeResponse>(`${ALPACA_DOMAIN}/v2/stocks/${symbol}/trades/latest`, {
            headers: {
                'APCA-API-KEY-ID': ALPACA_KEY,
                'APCA-API-SECRET-KEY': ALPACA_SECRET
            }
        });
        console.log('last trade response', response.data);
        return response.data;
    } catch (err: any) {
        const e = err?.response?.data || err;
        console.log('last trade error', e);
        throw e;
    }
}
