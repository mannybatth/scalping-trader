export interface BuyAlert {
    symbol: string;
    side: 'long' | 'short';
}

export interface Account {
    securitiesAccount: {
        type: 'CASH' | 'MARGIN';
        accountId: string;
        roundTrips: number;
        isDayTrader: boolean;
        isClosingOnlyRestricted: boolean;
        initialBalances: {
            accruedInterest: number;
            availableFundsNonMarginableTrade: number;
            bondValue: number;
            buyingPower: number;
            cashBalance: number;
            cashAvailableForTrading: number;
            cashReceipts: number;
            dayTradingBuyingPower: number;
            dayTradingBuyingPowerCall: number;
            dayTradingEquityCall: number;
            equity: number;
            equityPercentage: number;
            liquidationValue: number;
            longMarginValue: number;
            longOptionMarketValue: number;
            longStockValue: number;
            maintenanceCall: number;
            maintenanceRequirement: number;
            margin: number;
            marginEquity: number;
            moneyMarketFund: number;
            mutualFundValue: number;
            regTCall: number;
            shortMarginValue: number;
            shortOptionMarketValue: number;
            shortStockValue: number;
            totalCash: number;
            isInCall: boolean;
            pendingDeposits: number;
            marginBalance: number;
            shortBalance: number;
            accountValue: number;
        };
        currentBalances: {
            accruedInterest: number;
            cashBalance: number;
            cashReceipts: number;
            longOptionMarketValue: number;
            liquidationValue: number;
            longMarketValue: number;
            moneyMarketFund: number;
            savings: number;
            shortMarketValue: number;
            pendingDeposits: number;
            availableFunds: number;
            availableFundsNonMarginableTrade: number;
            buyingPower: number;
            buyingPowerNonMarginableTrade: number;
            dayTradingBuyingPower: number;
            equity: number;
            equityPercentage: number;
            longMarginValue: number;
            maintenanceCall: number;
            maintenanceRequirement: number;
            marginBalance: number;
            regTCall: number;
            shortBalance: number;
            shortMarginValue: number;
            shortOptionMarketValue: number;
            sma: number;
            mutualFundValue: number;
            bondValue: number;
        };
        projectedBalances: {
            availableFunds: number;
            availableFundsNonMarginableTrade: number;
            buyingPower: number;
            dayTradingBuyingPower: number;
            dayTradingBuyingPowerCall: number;
            maintenanceCall: number;
            regTCall: number;
            isInCall: boolean;
            stockBuyingPower: number;
        };
    };
}

export interface Option {
    putCall: 'PUT' | 'CALL';
    symbol: string;
    description: string;
    exchangeName: string;
    bid: number;
    ask: number;
    last: number;
    mark: number;
    bidSize: number;
    askSize: number;
    bidAskSize: string;
    lastSize: number;
    highPrice: number;
    lowPrice: number;
    openPrice: number;
    closePrice: number;
    totalVolume: number;
    tradeTimeInLong: number;
    quoteTimeInLong: number;
    netChange: number;
    volatility: number;
    delta: number;
    gamma: number;
    theta: number;
    vega: number;
    rho: number;
    openInterest: number;
    timeValue: number;
    theoreticalOptionValue: number;
    theoreticalVolatility: number;
    optionDeliverablesList: Array<{
        symbol: string;
        assetType: string;
        deliverableUnits: string;
        currencyType: string;
    }>;
    strikePrice: number;
    expirationDate: number;
    daysToExpiration: number;
    expirationType: string;
    lastTradingDay: number;
    multiplier: number;
    settlementType: string;
    deliverableNote: string;
    isIndexOption: boolean;
    percentChange: number;
    markChange: number;
    markPercentChange: number;
    nonStandard: boolean;
    inTheMoney: boolean;
    mini: boolean;
}

export interface OptionsChainResponse {
    symbol: string;
    status: string;
    underlying:string;
    strategy: string;
    interval: number;
    isDelayed: boolean;
    isIndex: boolean;
    interestRate: number;
    underlyingPrice: number;
    volatility: number;
    daysToExpiration: number;
    numberOfContracts: number;
    callExpDateMap: {
        [key: string]: {
            [key: string]:  Option[];
        };
    };
    putExpDateMap: {
        [key: string]: {
            [key: string]:  Option[];
        };
    };
}

export interface SubscriptionKeysResponse {
    keys: Array<{
        key: string;
    }>;
}
