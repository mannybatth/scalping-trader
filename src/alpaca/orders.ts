import axios from 'axios';
import { ALPACA_DOMAIN, ALPACA_KEY, ALPACA_SECRET } from '../constants';

export interface OrderRequest {
    symbol: string;
    qty: number;
    side: 'buy' | 'sell';
    type: 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop';
    time_in_force: 'day' | 'gtc' | 'opg' | 'cls' | 'ioc' | 'fok';
    limit_price?: number;
    stop_price?: number;
    trail_price?: number;
    trail_percent?: number;
    order_class?: 'simple' | 'bracket' | 'oco' | 'oto';
    take_profit?: {
        limit_price: number;
    };
    stop_loss?: {
        stop_price: number;
        limit_price?: number;
    };
}

export const createOrder = async (order: OrderRequest): Promise<any> => {
    try {
        const response = await axios.post(`${ALPACA_DOMAIN}/orders`, order, {
            headers: {
                'APCA-API-KEY-ID': ALPACA_KEY,
                'APCA-API-SECRET-KEY': ALPACA_SECRET
            }
        });
        console.log('order response', response.data);
        return response.data;
    } catch (err: any) {
        const e = err?.response?.data || err;
        console.log('order error', e);
        throw e;
    }
};
