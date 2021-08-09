import Discord, { TextChannel } from 'discord.js';
import { BinanceClient } from './binance/binance';
import { Alert } from './td/models';
import type { TDAmeritrade } from './td/td';

const client = new Discord.Client();

export const loginToDiscord = (td: TDAmeritrade, binance: BinanceClient, onLogin: () => void): void => {
    client.once('ready', () => {
        console.log('Discord client ready');
        onLogin();
    });

    client.on('message', (message) => {
        if ((message.channel as TextChannel)?.name === 'scalping-bot') {
            const alert: Alert = JSON.parse(message.content);
            console.log('discord msg', alert);

            (async() => {
                try {
                    if (alert.crypto) {
                        await binance.processAlert(alert);
                    } else {
                        await td.processAlert(alert);
                    }
                }
                catch (e) {
                    console.log({
                        error: e.message || e
                    });
                }
            })();
        } else if ((message.channel as TextChannel)?.name === 'harmonic-pattern-alerts') {
            //
        }
    });

    client.login('NzY2MTQwNjYyNzA1MjkxMjk0.X4fCGA.VkfFH6VAC8lGj0K91NUyc2QKZbw');
};


/*

-- New pattern found --
Long: {{ticker}}, {{timeframe}}, {{time}}, {{pattern}}, New Pattern, Long, Close: {{close}}, Recommended: Entry: {{entry}}, T1: {{target1}}, T2: {{target2}}, SL: {{stoploss}}
Short: {{ticker}}, {{timeframe}}, {{time}}, {{pattern}}, New Pattern, Short, Close: {{close}}, Recommended: Entry: {{entry}}, T1: {{target1}}, T2: {{target2}}, SL: {{stoploss}}

-- Entered position --
Long: {{ticker}}, {{timeframe}}, {{time}}, {{pattern}}, Entered Position, Long, Close: {{close}}, Entry: {{entry}}, T1: {{target1}}, T2: {{target2}}, SL: {{stoploss}}
Short: {{ticker}}, {{timeframe}}, {{time}}, {{pattern}}, Entered Position, Short, Close: {{close}}, Entry: {{entry}}, T1: {{target1}}, T2: {{target2}}, SL: {{stoploss}}

-- Reached target 1 --
Long: {{ticker}}, {{timeframe}}, {{time}}, {{pattern}}, Reached Target 1, Long, Close: {{close}}, T1: {{target1}}
Short: {{ticker}}, {{timeframe}}, {{time}}, {{pattern}}, Reached Target 1, Short, Close: {{close}}, T1: {{target1}}

-- Reached target 2 --
Long: {{ticker}}, {{timeframe}}, {{time}}, {{pattern}}, Reached Target 2, Long, Close: {{close}}, T2: {{target2}}
Short: {{ticker}}, {{timeframe}}, {{time}}, {{pattern}}, Reached Target 2, Short, Close: {{close}}, T2: {{target2}}

-- Stop-loss --
Long: {{ticker}}, {{timeframe}}, {{time}}, {{pattern}}, Stop-loss, Long, Close: {{close}}, Stop-loss: {{stoploss}}
Short: {{ticker}}, {{timeframe}}, {{time}}, {{pattern}}, Stop-loss, Short, Close: {{close}}, Stop-loss: {{stoploss}}

-- Invalidated pattern --
Long: {{ticker}}, {{timeframe}}, {{time}}, {{pattern}}, Invalidated, Long, Close: {{close}}
Short: {{ticker}}, {{timeframe}}, {{time}}, {{pattern}}, Invalidated, Short, Close: {{close}}

*/
