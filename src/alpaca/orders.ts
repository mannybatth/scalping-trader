import axios from 'axios';
import { ALPACA_BASE_URL, ALPACA_KEY, ALPACA_SECRET } from '../constants';

export interface OrderRequest {
    symbol: string;                  // The symbol identifier for the asset being traded
    qty?: number;                    // The number of shares to trade. Fractional qty for stocks only with market orders.
    notional?: number;               // The base currency value of the shares to trade. For stocks, only works with Market Orders. **Does not work with qty**.
    side: 'buy' | 'sell';            // Whether the order will buy or sell the asset.
    type: 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop'; // The execution logic type of the order.
    time_in_force: 'day' | 'gtc' | 'opg' | 'cls' | 'ioc' | 'fok';       // The expiration logic of the order.
    extended_hours?: boolean;        // Whether the order can be executed during regular market hours.
    client_order_id?: string;        // A string to identify which client submitted the order.
    order_class?: 'simple' | 'bracket' | 'oco' | 'oto'; // The class of the order. Simple orders have no other legs.
    take_profit?: {                  // For orders with multiple legs, an order to exit a profitable trade.
        limit_price: number;
    };
    stop_loss?: {                    // For orders with multiple legs, an order to exit a losing trade.
        stop_price: number;
        limit_price?: number;
    };
    position_intent?: 'BTO' | 'BTC' | 'STO' | 'STC'; // An enum to indicate the desired position strategy.
}

export const createOrder = async (order: OrderRequest): Promise<any> => {
    try {
        const response = await axios.post(`${ALPACA_BASE_URL}/orders`, order, {
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
