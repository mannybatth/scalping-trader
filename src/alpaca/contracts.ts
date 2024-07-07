import axios from 'axios';
import { ALPACA_DOMAIN, ALPACA_KEY, ALPACA_SECRET } from '../constants';
import { getLastTradeBySymbol, LastTradeResponse } from './last-trade';

export interface OptionContract {
    id: string;
    symbol: string;
    name: string;
    status: 'active' | 'inactive';
    tradable: boolean;
    expiration_date: string;
    root_symbol?: string;
    underlying_symbol: string;
    underlying_asset_id: string;
    type: 'call' | 'put';
    style: 'american' | 'european';
    strike_price: string;
    multiplier: string;
    size: string;
    open_interest?: string;
    open_interest_date?: string;
    close_price?: string;
    close_price_date?: string;
    deliverables?: Deliverable[];
}

export interface Deliverable {
    type: 'cash' | 'equity';
    symbol: string;
    asset_id?: string;
    amount: string;
    allocation_percentage: string;
    settlement_type: 'T+0' | 'T+1' | 'T+2' | 'T+3' | 'T+4' | 'T+5';
    settlement_method: 'BTOB' | 'CADF' | 'CAFX' | 'CCC';
    delayed_settlement: boolean;
}

export interface OptionContractResponse {
    option_contracts: OptionContract[];
    next_page_token: string | null;
}

const formatDate = (date: Date): string => {
    return date.toISOString().split('T')[0];
}

export const getContracts = async (symbol: string, type: 'call' | 'put'): Promise<{
    contracts: OptionContract[];
    last_symbol_trade: LastTradeResponse;
}> => {
    try {
        const lastTradeResponse = await getLastTradeBySymbol(symbol);
        const lastPrice = lastTradeResponse.trade.p;
        const priceAdjustment = lastPrice * 0.04;
        const today = new Date();
        const threeDaysFromNow = new Date(today);
        threeDaysFromNow.setDate(today.getDate() + 3);
        const thirtyDaysFromNow = new Date(today);
        thirtyDaysFromNow.setDate(today.getDate() + 30);

        const contractsResponse = await axios.get<OptionContractResponse>(`${ALPACA_DOMAIN}/options/contracts`, {
            params: {
                underlying_symbols: symbol,
                type: type,
                limit: 50,
                strike_price_gte: type === 'call' ? lastPrice : lastPrice - priceAdjustment,
                strike_price_lte: type === 'call' ? lastPrice + priceAdjustment : lastPrice,
                style: 'american',
                expiration_date_gte: formatDate(threeDaysFromNow),
                expiration_date_lte: formatDate(thirtyDaysFromNow)
            },
            headers: {
                'APCA-API-KEY-ID': ALPACA_KEY,
                'APCA-API-SECRET-KEY': ALPACA_SECRET
            }
        });

        console.log('contracts response', contractsResponse.data.option_contracts);
        console.log('last trade response', lastTradeResponse);

        return {
            contracts: contractsResponse.data.option_contracts,
            last_symbol_trade: lastTradeResponse
        };
    } catch (err: any) {
        const e = err?.response?.data || err;
        console.log('contracts error', e);
        throw e;
    }
};