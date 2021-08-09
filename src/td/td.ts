import fs from 'fs';
import axios from 'axios';
import { compareTimeDifference, getClosestOTMStrike, searchParams } from '../libs/helpers';
import { buySingleOption, getAccount, getAccounts, getOptionsChain, getSubscriptionKeys } from './td-requests';
import { Account, Alert, OptionsChainResponse, Option, SubscriptionKeysResponse } from './models';

interface TDTokens {
    access_token: string;
    refresh_token: string;
    access_last_update: string;
    refresh_last_update: string;
}

const tokensFileName = 'td-tokens.json';
const rawTokensData = fs.readFileSync(tokensFileName, 'utf8');
const tokens: TDTokens = JSON.parse(rawTokensData);

const tdApiUrl = 'https://api.tdameritrade.com/v1';
const redirectUri = 'https://localhost:3000/td-callback';
const clientId = '2GYLNACFVP5FVOFFI1TYKL1X8MKP605Y';
const Days90 = 7776000; // 90 days in seconds
const Minutes30 = 1800 // 30 mins in seconds

const maxDayTradesAllowed = 3;

export class TDAmeritrade {
    public authUrl = `https://auth.tdameritrade.com/auth?response_type=code&redirect_uri=${encodeURI(redirectUri)}&client_id=${clientId}%40AMER.OAUTHAP`;

    constructor() {
        this.validateTokens();
        // (async() => {
        //     await this.validateTokens();
        //     const accounts = await this.getAccounts();
        //     const account = accounts.find(a => a.securitiesAccount.type === 'MARGIN');
        //     if (account) {
        //         this.accountId = account.securitiesAccount.accountId;
        //     }
        // })();
    }

    public async getAccounts(): Promise<Account[]> {
        if (!await this.validateTokens()) {
            throw new Error('Access token is expired');
        }
        return getAccounts(tokens.access_token);
    }

    public async getAccount(accountId: string): Promise<Account> {
        if (!await this.validateTokens()) {
            throw new Error('Access token is expired');
        }
        return getAccount(tokens.access_token, accountId);
    }

    public async getOptionsChain(symbol: string): Promise<OptionsChainResponse> {
        if (!await this.validateTokens()) {
            throw new Error('Access token is expired');
        }
        return getOptionsChain(symbol, tokens.access_token);
    }

    public async getSubscriptionKeys(): Promise<SubscriptionKeysResponse> {
        if (!await this.validateTokens()) {
            throw new Error('Access token is expired');
        }
        return getSubscriptionKeys(tokens.access_token);
    }

    public getBestOption(optionsChain: OptionsChainResponse, alert: Alert): Option {
        const underlyingPrice = optionsChain.underlyingPrice;
        const optionsMap = alert.side === 'long' ? optionsChain.callExpDateMap : optionsChain.putExpDateMap;
        const dates = Object.keys(optionsMap);
        const nextValidDate = dates.find(date => parseInt(date.split(':')[1]) > 2); // Find date with more than 2 days left

        if (!nextValidDate) {
            throw new Error(`No valid option chain found for ${alert.symbol}`);
        }

        const closestDateStrikes = optionsMap[nextValidDate];
        const strikes: number[] = Object.keys(closestDateStrikes).map(key => parseFloat(key));

        const { strike } = getClosestOTMStrike(strikes, underlyingPrice, alert.side);

        return closestDateStrikes[strike.toFixed(1)][0];
    }

    public async processAlert(alert: Alert): Promise<any> {
        if (!await this.validateTokens()) {
            throw new Error('Access token is expired');
        }

        const optionsChain = await this.getOptionsChain(alert.symbol);
        if (!optionsChain) {
            throw new Error(`No options chain found for ${alert.symbol}`);
        }
        if (optionsChain.status !== 'SUCCESS') {
            throw new Error(`Options chain status is: ${optionsChain.status}`);
        }

        const underlyingPrice = optionsChain.underlyingPrice;

        console.log('');
        console.log(alert.symbol, 'underlying price:', underlyingPrice);

        if (underlyingPrice <= 10) {
            throw new Error('Underlying price is too low');
        }

        const selectedOption = this.getBestOption(optionsChain, alert);
        console.log('selectedOption:', selectedOption.description, selectedOption.symbol);

        if (selectedOption.bid <= 0.25 || selectedOption.ask <= 0.25) {
            throw new Error(`Bid/ask is ${selectedOption.bid}:${selectedOption.ask}. Not placing order`);
        }

        const bp = (a: Account) => {
            if (a.securitiesAccount.type === 'MARGIN') {
                return a.securitiesAccount.currentBalances.buyingPower;
            } else {
                return a.securitiesAccount.currentBalances.cashAvailableForTrading - a.securitiesAccount.currentBalances.pendingDeposits;
            }
        };

        const accounts = await this.getAccounts();
        const account = accounts.find(a => {
            if (a.securitiesAccount.type === 'MARGIN' && a.securitiesAccount.roundTrips < maxDayTradesAllowed && bp(a) > selectedOption.ask * 100) {
                return true;
            } else if (a.securitiesAccount.type === 'CASH' && bp(a) > selectedOption.ask * 100) {
                return true;
            }
        });

        if (!account) {
            throw new Error('No available account found');
        }

        const quantity = Math.max(1, Math.floor((bp(account) * 0.8) / (selectedOption.ask * 100)));

        await buySingleOption(tokens.access_token, account.securitiesAccount.accountId, selectedOption.symbol, quantity, selectedOption.ask);
    }

    public async createAccessToken(code: string): Promise<any> {
        console.log('createAccessToken invoked');

        try {
            const response = await axios.post(`${tdApiUrl}/oauth2/token`, searchParams({
                grant_type: 'authorization_code',
                access_type: 'offline',
                code: code,
                client_id: clientId + '@AMER.OAUTHAP',
                redirect_uri: redirectUri
            }), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8', Accept: 'application/json' }
            });

            if (response.status == 200) {

                const data = response.data;

                // update the tokens file object
                tokens.access_token = data.access_token;
                tokens.refresh_token = data.refresh_token;
                const time = Date().toString();
                tokens.access_last_update = time;
                tokens.refresh_last_update = time;

                // write the updated object to the tokens.json file
                fs.writeFileSync(tokensFileName, JSON.stringify(tokens, null, 2));

                return data;
            } else {
                return null;
            }
        } catch (err) {
            const e = err?.response?.data || err;
            console.log(e);
            throw e;
        }
    }

    /**
     * checks if the access/refresh are valid and if not then
     * generate new tokens
    */
    private async validateTokens(): Promise<boolean> {
        const time = Date().toString();
        // if the refresh token is expired, then reset both tokens
        if (compareTimeDifference(tokens.refresh_last_update, time, Days90)) {
            console.log('Refresh token is expired');
            console.log('Navigate to:', this.authUrl);
            return false;
        // if the access token is expired, then reset it
        } else if (compareTimeDifference(tokens.access_last_update, time, Minutes30)) {
            console.log('Access token expired. Trying to refresh it');
            await this.refreshAccessToken();
        }
        return true;
    }

    private async refreshAccessToken() {
        try {
            const response = await axios.post(`${tdApiUrl}/oauth2/token`, searchParams({
                grant_type: 'refresh_token',
                refresh_token: tokens.refresh_token,
                client_id: clientId
            }), {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
                    'Accept': 'application/json'
                }
            });

            // get the TDA response
            const authReply = response.data;
            tokens.access_token = authReply.access_token;
            tokens.access_last_update = Date().toString();

            console.log('New access token created!');

            // write the updated object to the tokens.json file
            fs.writeFileSync(tokensFileName, JSON.stringify(tokens, null, 2));
        } catch (err) {
            const e = err?.response?.data || err;
            console.log(e);
            throw e;
        }
    }
}
