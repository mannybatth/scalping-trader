import axios from 'axios';
import { ALPACA_BASE_URL, ALPACA_KEY, ALPACA_SECRET } from '../constants';

export interface OrderRequest {
    symbol: string;                  // The symbol identifier for the asset being traded
    qty?: string;                    // The number of shares to trade. Can be fractionable for only market and day order types.
    notional?: string;               // Dollar amount to trade. Cannot work with qty. Can only work for market order types and day for time in force.
    side: 'buy' | 'sell';            // Whether the order will buy or sell the asset.
    type: 'market' | 'limit' | 'stop' | 'stop_limit' | 'trailing_stop'; // The execution logic type of the order.
    time_in_force: 'day' | 'gtc' | 'opg' | 'cls' | 'ioc' | 'fok';       // The expiration logic of the order.
    extended_hours?: boolean;        // Whether the order can be executed during regular market hours.
    client_order_id?: string;        // A unique identifier for the order. Automatically generated if not sent.
    order_class?: 'simple' | 'bracket' | 'oco' | 'oto'; // The class of the order. Simple orders have no other legs.
    take_profit?: {                  // For orders with multiple legs, an order to exit a profitable trade.
        limit_price: string;
    };
    stop_loss?: {                    // For orders with multiple legs, an order to exit a losing trade.
        stop_price: string;
        limit_price?: string;
    };
    position_intent?: 'BTO' | 'BTC' | 'STO' | 'STC'; // An enum to indicate the desired position strategy.
    limit_price?: string;            // Required if type is limit or stop_limit
    stop_price?: string;             // Required if type is stop or stop_limit
    trail_price?: string;            // This or trail_percent is required if type is trailing_stop
    trail_percent?: string;          // This or trail_price is required if type is trailing_stop
}

export const createOrder = async (order: OrderRequest): Promise<any> => {
    try {
        const response = await axios.post(`${ALPACA_BASE_URL}/v2/orders`, order, {
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
