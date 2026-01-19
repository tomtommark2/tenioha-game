/**
 * Utils.js
 * Common utility functions shared across the application.
 */

window.GameUtils = {
    // --- SECURITY / FORMATTING ---
    escapeHtml: function (str) {
        if (!str) return "";
        return str.replace(/[&<>"']/g, function (m) {
            return {
                '&': '&amp;',
                '<': '&lt;',
                '>': '&gt;',
                '"': '&quot;',
                "'": '&#039;'
            }[m];
        });
    },

    // --- PREMIUM STATUS ---
    // Centralized check for Premium status
    // Returns true if User is Unlocked AND Not Expired
    checkPremiumStatus: function () {
        const isUnlocked = localStorage.getItem('vocabGame_isUnlocked') === 'true';
        const expiryTime = parseInt(localStorage.getItem('vocabGame_expiry') || '0');
        const now = Date.now();

        // Permanent users have year > 3000
        return (isUnlocked && (expiryTime > now));
    },

    // --- DATE / TIME ---
    // Get JST Date string YYYY-MM-DD
    getJSTDateString: function () {
        try {
            const jstFormatter = new Intl.DateTimeFormat('en-CA', {
                timeZone: 'Asia/Tokyo',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            return jstFormatter.format(new Date());
        } catch (e) {
            const d = new Date();
            return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        }
    }
};

// Aliases for backward compatibility (Optional, or replace usage)
// window.escapeHtml = window.GameUtils.escapeHtml;
// Better to replace usage to be explicit.
