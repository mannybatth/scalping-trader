import axios from 'axios';
import { ALPACA_DOMAIN, ALPACA_KEY, ALPACA_SECRET } from '../constants';

export interface OptionContract {
    id: string;
    symbol: string;
    expiration_date: string;
    strike_price: number;
    type: 'call' | 'put';
    underlying_symbol: string;
    underlying_price: number;
    ask_price: number;
    bid_price: number;
    last_price: number;
}

export interface OptionChainResponse {
    contracts: OptionContract[];
}

export const getContracts = async (symbols: string, type: 'call' | 'put'): Promise<OptionContract[]> => {
    try {
        const response = await axios.get<OptionChainResponse>(`${ALPACA_DOMAIN}/options/contracts`, {
            params: {
                underlying_symbols: symbols,
                type: type
            },
            headers: {
                'APCA-API-KEY-ID': ALPACA_KEY,
                'APCA-API-SECRET-KEY': ALPACA_SECRET
            }
        });
        console.log('contracts response', response.data?.contracts);
        return response.data?.contracts;
    } catch (err: any) {
        const e = err?.response?.data || err;
        console.log('contracts error', e);
        throw e;
    }
}
