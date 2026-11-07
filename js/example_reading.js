// Optional, locally supplied reading help. Does not alter answers or saved learning data.
(() => {
    const scriptUrl = new URL(document.currentScript.src);
    const collections = new Map(['junior', 'basic', 'daily', 'exam1'].map(level => [level, {
        readings: new Map(), loading: null, loaded: false, failed: false, complete: level === 'junior'
    }]));
    const toggle = document.getElementById('exampleReadingToggle');
    const panel = document.getElementById('exampleReadingPanel');
    const area = document.getElementById('exampleArea');
    const readingKey = (word, sense) => JSON.stringify([word?.word, sense?.pos, sense?.example]);
    let activeSample = null;

    function load(retry = false, level = 'junior') {
        const collection = collections.get(level);
        if (!collection) return Promise.resolve([]);
        const dataUrl = new URL(`../data/example-readings-${level}.json`, scriptUrl);
        dataUrl.search = scriptUrl.search;
        // A retry is user initiated. Never add a request for every answer/failure.
        if (retry && collection.loaded) {
            collection.loading = null;
            collection.loaded = false;
        }
        if (!collection.loading) {
            collection.loading = fetch(dataUrl, { cache: 'no-cache' }).then(response => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.json();
            }).then(data => {
                if (data.version !== 1 || data.level !== level || !Array.isArray(data.entries)
                    || (data.complete !== undefined && typeof data.complete !== 'boolean')) {
                    throw new Error('Invalid reading data');
                }
                collection.readings = new Map(data.entries.map(sample => [readingKey(sample, sample), sample]));
                collection.complete = data.complete ?? (level === 'junior');
                collection.failed = false;
                return data.entries;
            }).catch(error => {
                collection.failed = true;
                console.warn('Example reading unavailable:', error.message);
                return [];
            }).then(entries => {
                collection.loaded = true;
                // The displayed word may have changed while the data was loading.
                render(gameState.currentWord);
                return entries;
            });
        }
        return collection.loading;
    }

    function render(word) {
        if (area.classList.contains('no-question')) word = null;
        const sense = word?.senses?.[currentExampleIndex] || word;
        const hasExample = Boolean(sense?.example?.trim());
        area.classList.toggle('has-example', hasExample);
        document.getElementById('exampleSentence').lang = hasExample ? 'en' : 'ja';
        const collection = collections.get(gameState.currentLevel);
        const eligible = hasExample && !!collection && !word?.__customWord;
        activeSample = eligible ? collection.readings.get(readingKey(word, sense)) : null;
        // A known partial collection hides unregistered examples; a failed load
        // or missing example in a complete collection can be retried explicitly.
        const canRetry = eligible && collection.loaded && !activeSample && (collection.failed || collection.complete);
        toggle.hidden = !activeSample && !canRetry;
        toggle.disabled = eligible && !collection.loaded;
        toggle.textContent = canRetry ? '読み方を再読込' : '読み方';
        toggle.setAttribute('aria-expanded', 'false');
        panel.hidden = true;
        panel.replaceChildren();
        panel.removeAttribute('role');
        if (eligible && !collection.loaded) load(false, gameState.currentLevel);
    }

    async function showReading() {
        if (!activeSample) {
            const level = gameState.currentLevel;
            if (!collections.get(level)?.loaded) return;
            const word = gameState.currentWord;
            const key = readingKey(word, word?.senses?.[currentExampleIndex] || word);
            toggle.disabled = true;
            await load(true, level);
            const currentWord = gameState.currentWord;
            if (level !== gameState.currentLevel
                || key !== readingKey(currentWord, currentWord?.senses?.[currentExampleIndex] || currentWord)
                || toggle.hidden) return;
            if (activeSample) return showReading();
            panel.textContent = '読み方を表示できませんでした。もう一度お試しください。';
            panel.setAttribute('role', 'status');
            panel.hidden = false;
            toggle.setAttribute('aria-expanded', 'true');
            return;
        }
        const open = toggle.getAttribute('aria-expanded') !== 'true';
        toggle.setAttribute('aria-expanded', String(open));
        panel.hidden = !open;
        if (!open) return;
        panel.replaceChildren();
        panel.removeAttribute('role');
        const chunks = document.createElement('div');
        chunks.className = 'example-reading-chunks';
        chunks.setAttribute('role', 'list');
        chunks.setAttribute('aria-label', '英文と意味の対応');
        for (const [english, japanese] of activeSample.chunks) {
            const chunk = document.createElement('div');
            chunk.className = 'example-reading-chunk';
            chunk.setAttribute('role', 'listitem');
            const en = document.createElement('span');
            en.lang = 'en';
            en.textContent = english;
            const ja = document.createElement('span');
            ja.lang = 'ja';
            ja.textContent = japanese;
            chunk.append(en, ja);
            chunks.append(chunk);
        }
        panel.append(chunks);
        if (activeSample.note) {
            const note = document.createElement('p');
            note.className = 'example-reading-note';
            note.textContent = activeSample.note;
            panel.append(note);
        }
        const fullMeaning = document.createElement('details');
        fullMeaning.className = 'example-reading-meaning';
        const summary = document.createElement('summary');
        summary.textContent = '全体の意味';
        const text = document.createElement('p');
        text.textContent = activeSample.translation;
        text.lang = 'ja';
        fullMeaning.append(summary, text);
        panel.append(fullMeaning);
    }

    toggle.addEventListener('click', showReading);
    window.ExampleReading = { render, load };
    render(gameState.currentWord);
})();
