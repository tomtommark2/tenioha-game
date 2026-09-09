const { defineSecret } = require('firebase-functions/params');
const logger = require('firebase-functions/logger');

const feedbackDiscordWebhook = defineSecret('FEEDBACK_DISCORD_WEBHOOK');

function createDiscordNotifier({ getWebhook = () => feedbackDiscordWebhook.value(), fetchImpl = fetch } = {}) {
    return async ({ action, postId, nickname, text }) => {
        const url = new URL(getWebhook());
        if (url.protocol !== 'https:' || url.hostname !== 'discord.com' || url.username || url.password || url.port ||
            !/^\/api\/webhooks\/\d+\/[A-Za-z0-9_-]+$/.test(url.pathname)) {
            throw new Error('Invalid notification configuration');
        }
        url.search = '?wait=true';
        url.hash = '';
        const response = await fetchImpl(url, {
            method: 'POST', redirect: 'error', signal: AbortSignal.timeout(5000),
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                content: action === 'create' ? 'てにをは英単語：新しいひとこと' : 'てにをは英単語：投稿者の追加コメント',
                allowed_mentions: { parse: [] },
                embeds: [{ title: 'ひとこと・改善案', description: text,
                    fields: [{ name: '投稿者', value: nickname || '学習者' }, { name: '投稿ID', value: postId }],
                    url: 'https://tomtommark2.github.io/tenioha-game/' }],
            }),
        });
        if (!response.ok) throw new Error('Notification delivery failed');
        // Do not log Discord's response body, request URL, or user content.
        await response.body?.cancel();
    };
}

function logNotificationFailure() {
    logger.warn('Feedback Discord notification failed; feedback remains saved.');
}

module.exports = { feedbackDiscordWebhook, createDiscordNotifier, logNotificationFailure };
