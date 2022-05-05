import axios from 'axios';
import { stopLossPercentage, takeProfitOnePercentage, takeProfitTwoPercentage } from '../constants';
import { searchParams } from '../libs/helpers';
import { Account, OptionsChainResponse, SubscriptionKeysResponse } from './models';

const tdApiUrl = 'https://api.tdameritrade.com/v1';

export const getAccounts = async (accessToken: string): Promise<Account[]> => {
    try {
        const response = await axios.get(`${tdApiUrl}/accounts`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        return response.data;
    } catch (err: any) {
        const e = err?.response?.data || err;
        console.log(e);
        throw e;
    }
};

export const getAccount = async ( accessToken: string, accountId: string): Promise<Account> => {
    try {
        const response = await axios.get(`${tdApiUrl}/accounts/${accountId}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        return response.data;
    } catch (err: any) {
        const e = err?.response?.data || err;
        console.log(e);
        throw e;
    }
};

export const getOptionsChain = async (symbol: string, accessToken: string): Promise<OptionsChainResponse> => {
    try {
        const query = searchParams({
            symbol: symbol,
            strikeCount: 5
        });
        const response = await axios.get(`${tdApiUrl}/marketdata/chains?${query}`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        return response.data;
    } catch (err: any) {
        const e = err?.response?.data || err;
        console.log(e);
        throw e;
    }
};

export const getSubscriptionKeys = async (accessToken: string): Promise<SubscriptionKeysResponse> => {
    try {
        const response = await axios.get(`${tdApiUrl}/userprincipals/streamersubscriptionkeys`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        return response.data;
    } catch (err: any) {
        const e = err?.response?.data || err;
        console.log(e);
        throw e;
    }
};

export const buySingleOption = async (accessToken: string, accountId: string, symbol: string, quantity: number, limitPrice: number): Promise<any> => {
    try {
        if (quantity < 1) {
            throw new Error('Quantity must be greater than 0');
        }

        const takeProfitOne = parseFloat((limitPrice * takeProfitOnePercentage).toFixed(2));
        const takeProfitTwo = parseFloat((limitPrice * takeProfitTwoPercentage).toFixed(2));
        const stopLoss = parseFloat((limitPrice * stopLossPercentage).toFixed(2));
        const takeProfitOneQuantity = quantity === 1 ? 1 : Math.ceil(quantity * 0.5);
        const takeProfitTwoQuantity = Math.max(0, quantity - takeProfitOneQuantity);

        console.log('----', new Date().toLocaleString());
        console.log(`Buying ${quantity} ${symbol} at ${limitPrice}`);
        console.log(`Take profit One: ${takeProfitOne}`);
        console.log(`Take profit Two: ${takeProfitTwo}`);
        console.log(`Stop loss: ${stopLoss}`);
        console.log('----');

        const response = await axios.post(`${tdApiUrl}/accounts/${accountId}/orders`, {
            orderStrategyType: 'TRIGGER',
            session: 'NORMAL',
            duration: 'DAY',
            orderType: 'LIMIT',
            price: limitPrice,
            orderLegCollection: [
                {
                    instruction: 'BUY_TO_OPEN',
                    quantity: quantity,
                    instrument: {
                        symbol: symbol,
                        assetType: 'OPTION'
                    }
                }
            ],
            childOrderStrategies: [
                {
                    orderStrategyType: 'OCO',
                    childOrderStrategies: [
                        {
                            orderStrategyType: 'SINGLE',
                            session: 'NORMAL',
                            duration: 'GOOD_TILL_CANCEL',
                            orderType: 'LIMIT',
                            price: takeProfitOne,
                            orderLegCollection: [
                                {
                                    instruction: 'SELL_TO_CLOSE',
                                    quantity: takeProfitOneQuantity,
                                    instrument: {
                                        symbol: symbol,
                                        assetType: 'OPTION'
                                    }
                                }
                            ]
                        },
                        ...(takeProfitTwoQuantity > 0 ? [{
                            orderStrategyType: 'SINGLE',
                            session: 'NORMAL',
                            duration: 'GOOD_TILL_CANCEL',
                            orderType: 'LIMIT',
                            price: takeProfitTwo,
                            orderLegCollection: [
                                {
                                    instruction: 'SELL_TO_CLOSE',
                                    quantity: takeProfitTwoQuantity,
                                    instrument: {
                                        symbol: symbol,
                                        assetType: 'OPTION'
                                    }
                                }
                            ]
                        }] : []),
                        {
                            orderStrategyType: 'SINGLE',
                            session: 'NORMAL',
                            duration: 'GOOD_TILL_CANCEL',
                            orderType: 'STOP',
                            stopPrice: stopLoss,
                            orderLegCollection: [
                                {
                                    instruction: 'SELL_TO_CLOSE',
                                    quantity: quantity,
                                    instrument: {
                                        symbol: symbol,
                                        assetType: 'OPTION'
                                    }
                                }
                            ]
                        }
                    ]
                }
            ]
        }, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });
        return response.data;
    } catch (err: any) {
        const e = err?.response?.data || err;
        console.log(e);
        throw e;
    }
}
