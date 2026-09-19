/* Optional noun imagery. Collection cards retain their canonical learning keys. */
(function () {
    let requestId = 0;
    let previous = null;
    let current = null;
    let displayed = null;
    // Fixed trial set: expanding the catalogue never rotates free access.
    const freeWords = new Set([
        'action', 'activity', 'actor', 'address', 'aeroplane', 'afternoon', 'age', 'airplane', 'airport', 'album',
        'animal', 'answer', 'apple', 'apron', 'arm', 'art', 'article', 'aunt', 'autumn', 'baby',
        'back', 'bag', 'ball', 'banana', 'band', 'bank', 'bar', 'baseball', 'basketball', 'bat',
        'bath', 'bathroom', 'beach', 'bean', 'bear', 'bed', 'bedroom', 'bee', 'beef', 'bell',
        'bicycle', 'bike', 'bird', 'birth', 'birthday', 'biscuit', 'black', 'block', 'blue', 'board',
        'boat', 'body', 'bone', 'book', 'bookstore', 'bottle', 'bottom', 'bowl', 'box', 'boy',
        'boyfriend', 'brain', 'bread', 'breakfast', 'bridge', 'brother', 'brush', 'bucket', 'building', 'burger',
        'bus', 'business', 'butter', 'butterfly', 'button', 'bye', 'cafe', 'cake', 'call', 'camera',
        'camp', 'candy', 'cap', 'car', 'card', 'care', 'cartoon', 'case', 'cat', 'catch',
        'celebration', 'chair', 'change', 'character', 'check', 'cheese', 'chicken', 'child', 'chocolate', 'clock'
    ]);
    const premium = () => !!window.GameUtils.checkPremiumStatus();
    const canUseBookEntry = entry => !!entry && (premium() || (entry.level === 'junior' && freeWords.has(entry.word)));
    // Images are free in the main levels; only the dedicated book is a trial.
    const canUseEntry = entry => !!entry && (window.gameState?.currentLevel !== 'illustrated' || canUseBookEntry(entry));
    function canUseWord(word, level, database) {
        return level !== 'illustrated' || canUseBookEntry(find(word, level, database));
    }
    function accessibleWords(level, database) {
        return (database[level] || []).filter(word => canUseWord(word, level, database));
    }
    function explainUpgrade() {
        // The existing purchase flow handles login and remains dismissible.
        window.openPurchaseModal();
    }
    function refreshAccessUI() {
        const trial = document.getElementById('illustrationTrialLabel');
        if (trial) trial.textContent = premium() ? 'すべての収録語を学習可能' : '固定100語を無料で学習';
        const upgrade = document.getElementById('illustrationUpgrade');
        if (upgrade) upgrade.hidden = premium();
    }

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
        if (currentButton) currentButton.hidden = !canUseEntry(current);
        const button = document.getElementById('previousIllustrationBtn');
        const currentKey = word && window.GameUtils.getWordKey(word, level, database);
        if (button) button.hidden = !previous || !canUseEntry(previous.entry) || previous.key === currentKey;
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
        if (!canUseEntry(displayed)) return;
        document.getElementById('wordIllustrationSlot').focus({ preventScroll: true });
        document.getElementById('previousIllustrationWord').textContent = displayed.word;
        document.getElementById('previousIllustrationMeaning').textContent = displayed.meaning;
        document.getElementById('previousIllustrationImage').replaceChildren(createImage(displayed));
        document.getElementById('previousIllustrationModal').style.display = 'flex';
    }

    function openWordbook() {
        const database = window.vocabularyDatabase;
        const words = accessibleWords('illustrated', database);
        refreshAccessUI();
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
        document.getElementById('illustratedWordbookCount').textContent = premium() ? `${words.length}語` : `無料体験 ${words.length}語 / 全${database.illustrated.length}語`;
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
        if (!canUseEntry(entry)) { clear(); return; }
        // Keep an already displayed illustration mounted when revealing its meaning.
        if (entry && displayed === entry) return;
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
            if (activeRequest !== requestId || !image.naturalWidth || !canUseEntry(entry)) return;
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
        premium, canUseEntry, canUseWord, accessibleWords, explainUpgrade, refreshAccessUI,
        rememberAnswer, refreshPrevious, resetPrevious, openPrevious, openCurrent, enlarge, openWordbook, startWordbook, close });
})();
