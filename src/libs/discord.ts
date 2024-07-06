import Discord, { TextChannel, Events, ShardEvents, GatewayIntentBits, Partials, GatewayDispatchEvents } from 'discord.js';
import { buyOption, BuyOptionAction } from '../actions/buy_option';

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
                const alert: BuyOptionAction = JSON.parse(message.content);
                console.log('discord msg', alert);
                const response = await buyOption(alert);
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
