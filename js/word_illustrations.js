/* Optional noun imagery. Collection cards retain their canonical learning keys. */
(function () {
    let requestId = 0;
    let previous = null;
    let current = null;
    let displayed = null;

    function buildCollection(database) {
        const collection = new Map();
        ['junior', 'basic', 'daily', 'exam1'].forEach(level => {
            (database[level] || []).forEach(word => {
                const sense = (word.senses || [word]).find(item => item.pos === '名' && find(item, level, database));
                if (!sense) return;
                const key = window.GameUtils.getWordKey(word, level, database);
                const source = { ...sense, __sourceLevel: sense.__sourceLevel || level };
                collection.set(key, { ...source, senses: [source], set: 'illustrated', __groupKey: key });
            });
        });
        return [...collection.values()].sort((a, b) => a.word.localeCompare(b.word, 'en'));
    }

    function refreshPrevious(word, level, database) {
        current = find(word, level, database);
        const currentButton = document.getElementById('currentIllustrationBtn');
        if (currentButton) currentButton.hidden = !current;
        const button = document.getElementById('previousIllustrationBtn');
        const currentKey = word && window.GameUtils.getWordKey(word, level, database);
        if (button) button.hidden = !previous || previous.key === currentKey;
    }

    function rememberAnswer(word, level, database) {
        const entry = find(word, level, database);
        previous = entry ? { entry, key: window.GameUtils.getWordKey(word, level, database) } : null;
        refreshPrevious(word, level, database);
    }

    function resetPrevious() {
        previous = null;
        refreshPrevious(null);
        close('previousIllustrationModal');
    }

    function close(id) {
        document.getElementById(id).style.display = 'none';
    }

    function createImage(entry) {
        const image = new Image(100, 100);
        image.alt = entry.alt;
        image.loading = 'lazy';
        image.src = entry.src;
        image.onerror = () => { image.alt = '画像を読み込めませんでした'; };
        return image;
    }

    function openPrevious() {
        const button = document.getElementById('previousIllustrationBtn');
        if (!previous || button.hidden) return;
        showEntry(previous.entry);
    }

    function openCurrent() {
        if (current) showEntry(current);
    }

    function enlarge() {
        if (!displayed) return;
        document.getElementById('wordIllustrationSlot').focus({ preventScroll: true });
        document.getElementById('previousIllustrationWord').textContent = displayed.word;
        document.getElementById('previousIllustrationMeaning').textContent = displayed.meaning;
        document.getElementById('previousIllustrationImage').replaceChildren(createImage(displayed));
        document.getElementById('previousIllustrationModal').style.display = 'flex';
    }

    function openWordbook() {
        const database = window.vocabularyDatabase;
        const words = database.illustrated || [];
        const gallery = document.getElementById('illustratedWordbookGallery');
        gallery.replaceChildren();
        words.forEach(word => {
            const entry = find(word, 'illustrated', database);
            const button = document.createElement('button');
            button.type = 'button';
            button.className = 'illustrated-word-tile';
            button.appendChild(createImage(entry));
            const title = document.createElement('strong');
            title.textContent = word.word;
            const meaning = document.createElement('span');
            meaning.textContent = entry.meaning;
            button.append(title, meaning);
            button.setAttribute('aria-label', `${word.word}：${entry.meaning}を学習`);
            button.onclick = () => {
                if (!window.ensureTrialAccess()) return;
                close('illustratedWordbookModal');
                window.openWordFromList('illustrated', encodeURIComponent(word.__groupKey));
            };
            gallery.appendChild(button);
        });
        document.getElementById('illustratedWordbookCount').textContent = `${words.length}語`;
        document.getElementById('wordbookBtn').focus({ preventScroll: true });
        window.closeWordbookModal();
        document.getElementById('illustratedWordbookModal').style.display = 'flex';
    }

    function startWordbook() {
        if (!window.ensureTrialAccess()) return;
        close('illustratedWordbookModal');
        window.activateLearningSessionUI();
        window.selectWordbook('illustrated');
    }

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
        displayed = null;
        const slot = document.getElementById('wordIllustrationSlot');
        if (!slot) return;
        slot.hidden = true;
        slot.replaceChildren();
        slot.parentElement.classList.remove('has-word-illustration');
    }

    function show(word, level, database) {
        showEntry(find(word, level, database));
    }

    function showEntry(entry) {
        clear();
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
            displayed = entry;
            slot.replaceChildren(image);
            slot.hidden = false;
            slot.parentElement.classList.add('has-word-illustration');
        };
        // Until loaded (or on error), retain the original character.
        image.onerror = () => {};
        image.src = entry.src;
    }

    window.WordIllustrations = Object.freeze({ find, show, clear, buildCollection,
        rememberAnswer, refreshPrevious, resetPrevious, openPrevious, openCurrent, enlarge, openWordbook, startWordbook, close });
})();
