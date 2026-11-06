// Local-only sample catalog; the normal app uses example_reading.js.
(async () => {
    const params = new URLSearchParams(location.search);
    if (!['localhost', '127.0.0.1'].includes(location.hostname) || params.get('exampleReadingPreview') !== '1') return;
    const scriptUrl = new URL(document.currentScript.src);
    const samples = await window.ExampleReading.load();
    if (!samples.length) return;
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = new URL('../example-reading-preview.css', scriptUrl).href;
    document.head.append(stylesheet);
    let sampleSelect;

    function showSample(index) {
        const sample = samples[index];
        const word = vocabularyDatabase.junior.find(word => word.word === sample.word);
        if (!word) return;
        gameState.currentLevel = 'junior';
        gameState.currentMode = 'unlearned';
        gameState.isReviewWord = false;
        gameState.currentQuestionReason = '';
        updateLevelCurrentButton();
        loadVocabularyForLevel();
        initializeWordStates();
        activateLearningSessionUI();
        showWord(word);
        const senseIndex = word.senses?.findIndex(sense => sense.pos === sample.pos && sense.example === sample.example);
        if (senseIndex >= 0) selectWordExample(senseIndex);
        updateDisplay();
    }

    function mount() {
        if (params.get('examplePanelLayout') === 'header') {
            const area = document.getElementById('exampleArea');
            area.classList.replace('example-panel-titleless', 'example-panel-header');
            const heading = document.createElement('div');
            heading.className = 'example-reading-heading';
            const label = document.createElement('div');
            label.className = 'example-label';
            label.textContent = '例文';
            heading.append(label, area.querySelector('.example-actions'));
            area.prepend(heading);
        }
        const preview = document.createElement('aside');
        preview.className = 'example-reading-preview';
        preview.setAttribute('aria-label', '読み方の試作');
        const previewLabel = document.createElement('label');
        previewLabel.htmlFor = 'exampleReadingSample';
        previewLabel.textContent = '読み方の試作';
        sampleSelect = document.createElement('select');
        sampleSelect.id = 'exampleReadingSample';
        const placeholder = document.createElement('option');
        placeholder.value = '';
        placeholder.textContent = '例文を選択';
        placeholder.disabled = true;
        sampleSelect.append(placeholder);
        samples.forEach((sample, index) => {
            const option = document.createElement('option');
            option.value = String(index);
            option.textContent = `${index + 1} / ${samples.length} · ${sample.word}（${sample.pos}）`;
            sampleSelect.append(option);
        });
        sampleSelect.addEventListener('change', () => showSample(Number(sampleSelect.value)));
        preview.append(previewLabel, sampleSelect);
        document.querySelector('.container').before(preview);
        document.body.classList.add('example-reading-preview-active');
        showSample(0);
    }
    if (document.readyState === 'complete') mount();
    else window.addEventListener('load', mount, { once: true });
})();
