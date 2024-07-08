import axios from 'axios';
import { ALPACA_BASE_URL, ALPACA_KEY, ALPACA_SECRET } from '../constants';

export interface ClosePositionRequest {
    symbol_or_asset_id: string; // The symbol or assetId of the position to close
    qty?: number;               // The number of shares to liquidate. Cannot work with percentage
    percentage?: number;        // Percentage of position to liquidate. Cannot work with qty
}

export interface Position {
    asset_id: string;
    symbol: string;
    exchange: string;
    asset_class: string;
    avg_entry_price: string;
    qty: string;
    side: 'long' | 'short';
    market_value: string;
    cost_basis: string;
    unrealized_pl: string;
    unrealized_plpc: string;
    unrealized_intraday_pl: string;
    unrealized_intraday_plpc: string;
    current_price: string;
    lastday_price: string;
    change_today: string;
}

export const closePosition = async (request: ClosePositionRequest): Promise<any> => {
    try {
        const params: any = {};
        if (request.qty) {
            params.qty = request.qty;
        }
        if (request.percentage) {
            params.percentage = request.percentage;
        }

        const response = await axios.delete(`${ALPACA_BASE_URL}/v2/positions/${request.symbol_or_asset_id}`, {
            params,
            headers: {
                'APCA-API-KEY-ID': ALPACA_KEY,
                'APCA-API-SECRET-KEY': ALPACA_SECRET
            }
        });
        console.log('close position response', response.data);
        return response.data;
    } catch (err: any) {
        const e = err?.response?.data || err;
        console.log('close position error', e);
        throw e;
    }
};
