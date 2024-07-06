import Discord, { Events, GatewayIntentBits, Partials, GatewayDispatchEvents } from 'discord.js';
import { buyBestOption, BuyOptionAction } from '../actions/buy_best_option';

const client = new Discord.Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent
    ],
    partials: [Partials.Message, Partials.Channel, Partials.Reaction]
});

export const loginToDiscord = (onLogin: () => void): void => {
    client.once(Events.ClientReady, () => {
        console.log('Discord client ready');
        onLogin();
    });

    client.ws.on(GatewayDispatchEvents.MessageCreate, async (message) => {
        if (message.author.bot && message.author.username === 'Alert Bot') {
            try {
                const action: BuyOptionAction = JSON.parse(message.content);
                console.log('discord msg', action);
                const response = await buyBestOption(action);
                console.log('action response', response);
            } catch (e: any) {
                console.log({
                    error: e?.message || e
                });
            }
        }
    });

    client.on('error', (error) => {
        console.error('Discord client error:', error);
    });

    client.login(process.env.DISCORD_TOKEN);
};
