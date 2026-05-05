// Universal Global Scope (Browser & Service Worker)
(function (global) {
    global.GAME_VERSION = "v3.08";
})(typeof window !== 'undefined' ? window : self);
