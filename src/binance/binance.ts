import keys from '../../binance-keys.json';
import Binance, { MarginType, OrderSide, OrderType } from 'binance-api-node';
import { Alert } from '../td/models';

const equity = 0.6;
const leverage = 20;
const takeProfitPercent = 0.10;
const stopLossPercent = 0.10;

const buyTakeProfit = 1 + (takeProfitPercent / leverage);
const buyStopLoss = 1 - (stopLossPercent / leverage);
const sellTakeProfit = 1 - (takeProfitPercent / leverage);
const sellStopLoss = 1 + (stopLossPercent / leverage);

const generateRandomId = () => Math.random().toString(36).substr(2, 10);

export class BinanceClient {

    private walletCrossBalance = 0;

    private client = Binance({
        apiKey: keys.api_key,
        apiSecret: keys.secret_key
    });

    constructor() {
        this.client.ws.futuresUser(async (msg: any) => {

            if (msg.eventType === 'ACCOUNT_UPDATE') {

                const walletCrossBalance = msg.balances.find((b: any) => b.asset === 'USDT')?.crossWalletBalance || '0';
                this.walletCrossBalance = parseFloat(walletCrossBalance);
                console.log('walletCrossBalance', this.walletCrossBalance);

                for (const position of msg.positions) {
                    if (position.positionAmount === '0') {
                        const orders = await this.client.futuresOpenOrders({
                            symbol: position.symbol
                        });
                        for (const order of orders) {
                            await this.client.futuresCancelOrder({
                                symbol: order.symbol,
                                orderId: order.orderId
                            });
                        }
                    }
                }

            } else if (msg.eventType === 'ORDER_TRADE_UPDATE' && msg.orderStatus === 'FILLED') {
                if (msg.clientOrderId.includes('new_oco_order_')) {

                    const tp = msg.side === 'BUY' ? buyTakeProfit : sellTakeProfit;
                    const sl = msg.side === 'BUY' ? buyStopLoss : sellStopLoss;

                    const takeProfitPrice = parseFloat((msg.averagePrice * tp).toFixed(2));
                    const stopLossPrice = parseFloat((msg.averagePrice * sl).toFixed(2));

                    console.log({
                        'averagePrice': msg.averagePrice,
                        takeProfitPrice,
                        stopLossPrice
                    });
                    await this.client.futuresOrder({
                        symbol: msg.symbol,
                        side: msg.side === 'BUY' ? 'SELL' as OrderSide : 'BUY' as OrderSide,
                        type: 'TAKE_PROFIT_MARKET' as OrderType,
                        stopPrice: takeProfitPrice,
                        closePosition: 'true'
                    });
                    await this.client.futuresOrder({
                        symbol: msg.symbol,
                        side: msg.side === 'BUY' ? 'SELL' as OrderSide : 'BUY' as OrderSide,
                        type: 'STOP_MARKET' as OrderType,
                        quantity: `${msg.quantity}`,
                        stopPrice: stopLossPrice,
                        closePosition: 'true'
                    });
                }
            }
        });

        (async () => {
            const result = await this.client.futuresAccountBalance();
            const walletCrossBalance = result.find(b => b.asset === 'USDT')?.crossWalletBalance || '0';
            this.walletCrossBalance = parseFloat(walletCrossBalance);
            console.log('walletCrossBalance', this.walletCrossBalance);
        })();
    }

    public async processAlert(alert: Alert): Promise<any> {
        try {
            await this.client.futuresMarginType({
                symbol: alert.symbol,
                marginType: 'ISOLATED' as MarginType
            });
        } catch (e) {
            if (e.message !== 'No need to change margin type.') {
                throw e;
            }
        }

        await this.client.futuresLeverage({
            symbol: alert.symbol,
            leverage: leverage
        });

        const prices = await this.client.futuresPrices({ symbol: alert.symbol });
        const symbolPriceStr = prices[alert.symbol] || '0';
        const symbolPrice = parseFloat(symbolPriceStr);
        const qty = ((this.walletCrossBalance * equity) / symbolPrice).toFixed(3);

        const side = alert.side === 'long' ? 'BUY' as OrderSide : 'SELL' as OrderSide;

        await this.client.futuresOrder({
            symbol: alert.symbol,
            side: side,
            type: 'MARKET' as OrderType,
            quantity: qty,
            newClientOrderId: 'new_oco_order_' + generateRandomId()
        });
    }
}
