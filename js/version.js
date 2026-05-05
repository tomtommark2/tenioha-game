// Universal Global Scope (Browser & Service Worker)
(function (global) {
    global.GAME_VERSION = "v3.14";
})(typeof window !== 'undefined' ? window : self);
