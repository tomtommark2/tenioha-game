// Optional, locally supplied reading help. Does not alter answers or saved learning data.
(() => {
    const scriptUrl = new URL(document.currentScript.src);
    const dataUrl = new URL('../data/example-readings-junior.json', scriptUrl);
    dataUrl.search = scriptUrl.search;
    const toggle = document.getElementById('exampleReadingToggle');
    const panel = document.getElementById('exampleReadingPanel');
    const area = document.getElementById('exampleArea');
    const readingKey = (word, sense) => JSON.stringify([word?.word, sense?.pos, sense?.example]);
    let readings = new Map();
    let loading;
    let loaded = false;
    let activeSample = null;

    function load(retry = false) {
        // A retry is user initiated. Never add a request for every answer/failure.
        if (retry && loaded) {
            loading = null;
            loaded = false;
        }
        if (!loading) {
            loading = fetch(dataUrl, { cache: 'no-cache' }).then(response => {
                if (!response.ok) throw new Error(`HTTP ${response.status}`);
                return response.json();
            }).then(data => {
                if (data.version !== 1 || data.level !== 'junior' || !Array.isArray(data.entries)) {
                    throw new Error('Invalid reading data');
                }
                readings = new Map(data.entries.map(sample => [readingKey(sample, sample), sample]));
                return data.entries;
            }).catch(error => {
                console.warn('Example reading unavailable:', error.message);
                return [];
            }).then(entries => {
                loaded = true;
                // The displayed word may have changed while the data was loading.
                render(gameState.currentWord);
                return entries;
            });
        }
        return loading;
    }

    function render(word) {
        if (area.classList.contains('no-question')) word = null;
        const sense = word?.senses?.[currentExampleIndex] || word;
        const hasExample = Boolean(sense?.example?.trim());
        area.classList.toggle('has-example', hasExample);
        document.getElementById('exampleSentence').lang = hasExample ? 'en' : 'ja';
        const eligible = hasExample && gameState.currentLevel === 'junior' && !word?.__customWord;
        activeSample = eligible ? readings.get(readingKey(word, sense)) : null;
        const canRetry = eligible && loaded && !activeSample;
        toggle.hidden = !activeSample && !canRetry;
        toggle.textContent = canRetry ? '読み方を再読込' : '読み方';
        toggle.setAttribute('aria-expanded', 'false');
        panel.hidden = true;
        panel.replaceChildren();
        panel.removeAttribute('role');
        if (eligible && !loaded) load();
    }

    async function showReading() {
        if (!activeSample) {
            if (!loaded) return;
            const word = gameState.currentWord;
            const key = readingKey(word, word?.senses?.[currentExampleIndex] || word);
            toggle.disabled = true;
            await load(true);
            toggle.disabled = false;
            const currentWord = gameState.currentWord;
            if (key !== readingKey(currentWord, currentWord?.senses?.[currentExampleIndex] || currentWord)
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
