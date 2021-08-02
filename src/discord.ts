import Discord, { TextChannel } from 'discord.js';
import { BuyAlert } from './td/models';
import type { TDAmeritrade } from './td/td';

const client = new Discord.Client();

export const loginToDiscord = (td: TDAmeritrade, onLogin: () => void): void => {
    client.once('ready', () => {
        console.log('Discord client ready');
        onLogin();
    });

    client.on('message', (message) => {
        if ((message.channel as TextChannel)?.name === 'scalping-bot') {
            const alert: BuyAlert = JSON.parse(message.content);
            console.log('discord msg', alert);

            (async() => {
                try {
                    await td.processAlert(alert);
                }
                catch (e) {
                    console.log({
                        error: e.message || e
                    });
                }
            })();
        }
    });

    client.login('NzY2MTQwNjYyNzA1MjkxMjk0.X4fCGA.VkfFH6VAC8lGj0K91NUyc2QKZbw');
};
