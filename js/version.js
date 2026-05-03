// Universal Global Scope (Browser & Service Worker)
(function (global) {
    global.GAME_VERSION = "v2.99";
})(typeof window !== 'undefined' ? window : self);
