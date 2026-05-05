/**
 * Config.js
 * Central configuration for Tenioha Game.
 * Stores constants, magic numbers, and shared settings.
 */

window.GameConfig = {
    // --- GRAPH & STATS SCALES ---
    GRAPH_SCALES: {
        total: { max: 8018, label: '総合' },
        A1: { max: 1221, label: 'Junior (A1)' },
        A2: { max: 1448, label: 'Basic (A2)' },
        B1: { max: 2480, label: 'Daily (B1)' },
        B2: { max: 2869, label: 'Exam1 (B2)', stepSize: 500 }
    },

    // --- CEFR MAPPING ---
    CEFR_MAP: {
        'junior': 'A1',
        'basic': 'A2',
        'daily': 'B1',
        'exam1': 'B2',
        'exam1_2': 'B2',
        'exam2': 'B2'
    },

    CEFR_MAX: {
        'A1': 1100, // Junior
        'A2': 1100, // Basic
        'B1': 1500, // Daily
        'B2': 2500, // Exam
        'total': 6200
    },

    // --- GAMEPLAY CONSTANTS ---
    CATEGORIES: ['junior', 'basic', 'daily', 'exam1'],

    // --- SYSTEM ---
    VERSION: window.GAME_VERSION || "v2.58", // Fallback
    CACHE_DURATION: 5 * 60 * 1000, // 5 Minutes
};
