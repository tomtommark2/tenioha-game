/* Optional noun imagery: no learning-state or persistence changes. */
(function () {
    let requestId = 0;

    function find(word, level, database) {
        if (!word) return null;
        if (word.senses) {
            return word.senses.map(sense => find(sense, sense.__sourceLevel || level, database)).find(Boolean) || null;
        }
        const identity = window.GameUtils.resolveWordIdentity(word, level, database);
        return (window.WORD_ILLUSTRATIONS || []).find(entry =>
            entry.level === identity.level && entry.word === identity.word && entry.pos === identity.pos
        ) || null;
    }

    function clear() {
        requestId++;
        const slot = document.getElementById('wordIllustrationSlot');
        if (!slot) return;
        slot.hidden = true;
        slot.replaceChildren();
        slot.parentElement.classList.remove('has-word-illustration');
    }

    function show(word, level, database) {
        clear();
        const entry = find(word, level, database);
        const slot = document.getElementById('wordIllustrationSlot');
        if (!entry || !slot) return;
        const activeRequest = requestId;
        const image = new Image();
        image.id = 'wordIllustration';
        image.alt = entry.alt;
        image.width = 100;
        image.height = 100;
        image.decoding = 'async';
        image.onload = () => {
            // A slow previous image must never replace the next question's hero.
            if (activeRequest !== requestId || !image.naturalWidth) return;
            slot.replaceChildren(image);
            slot.hidden = false;
            slot.parentElement.classList.add('has-word-illustration');
        };
        // Until loaded (or on error), retain the original character.
        image.onerror = () => {};
        image.src = entry.src;
    }

    window.WordIllustrations = Object.freeze({ find, show, clear });
})();
