(function () {
    'use strict';

    const apps = Object.freeze([
        Object.freeze({
            id: 'dictionary', title: '動く！図鑑', description: '単語・熟語のイメージを動きでつかむ',
            url: 'https://phrasalverbapp-d5fa7.web.app/', icon: 'assets/sister-apps/dictionary-icon.png',
            preview: 'assets/sister-apps/dictionary-promo-poster-v3.jpg', previewWidth: 720, previewHeight: 480,
            video: 'assets/sister-apps/dictionary-promo-v3.mp4',
            examples: Object.freeze([
                Object.freeze({ at: 0, word: 'UP', caption: '' }),
                Object.freeze({ at: 2.4, word: 'EVEN', caption: '驚き・予想外の強調' }),
                Object.freeze({ at: 6.9, word: 'THERE IS', caption: '話題に出す' }),
                Object.freeze({ at: 9.1, word: 'DARE', caption: 'あえて一歩踏み込む' })
            ]),
            previewAlt: '動く！図鑑の教材。UPの図が上がり、ゲージが変化する完成図。紹介動画はUP・EVEN・THERE IS・DAREの順に再生'
        }),
        Object.freeze({
            id: 'sentence', title: '英文図解', description: '文構造をアニメーションで見る',
            url: 'https://grammar-zukan.web.app/', icon: 'assets/sister-apps/sentence-icon.png',
            preview: 'assets/sister-apps/sentence-promo-poster-v1.jpg', previewWidth: 780, previewHeight: 384,
            video: 'assets/sister-apps/sentence-promo-v1.mp4',
            previewAlt: '英文図解の実画面。英文から主語・動詞・補語の構造図が組み上がるアニメーション'
        })
    ]);

    const mediaEntries = [];
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    function isOpen() {
        const modal = document.getElementById('sisterAppsModal');
        return modal && getComputedStyle(modal).display !== 'none';
    }
    function isInView(entry) {
        const body = document.querySelector('#sisterAppsModal .sister-apps-body');
        if (!body) return false;
        const frame = body.getBoundingClientRect();
        const media = entry.media.getBoundingClientRect();
        const visible = Math.min(frame.bottom, media.bottom) - Math.max(frame.top, media.top);
        return media.height > 0 && visible / media.height >= .25;
    }
    function shouldPlay(entry) {
        return isOpen() && !document.hidden && isInView(entry) && !entry.userPaused && !entry.failed
            && !entry.autoplayBlocked && (!reducedMotion.matches || entry.allowReducedMotion);
    }
    function updateToggle(entry) {
        if (entry.example) {
            // Authored diagrams use the lower edge for labels; keep the control in the header margin.
            entry.toggle.style.top = `${entry.media.offsetTop + 12}px`;
            entry.toggle.style.bottom = 'auto';
        }
        const playing = !entry.video.paused;
        entry.toggle.textContent = playing ? '停止' : '再生';
        entry.toggle.setAttribute('aria-label', `${entry.app.title}の紹介動画を${playing ? '停止' : '再生'}`);
        entry.toggle.disabled = entry.failed;
        if (entry.failed) entry.toggle.title = '動画を読み込めませんでした';
    }
    function updateExample(entry) {
        if (!entry.example) return;
        // The static fallback always matches the first example's completed poster.
        const time = entry.video.hidden ? 0 : entry.video.currentTime;
        let index = 0;
        entry.app.examples.forEach((example, i) => { if (example.at <= time) index = i; });
        if (entry.exampleIndex === index) return;
        const example = entry.app.examples[index];
        entry.exampleWord.textContent = example.word;
        entry.exampleCaption.textContent = example.caption;
        entry.exampleIndex = index;
    }
    function syncMedia() {
        mediaEntries.forEach(entry => {
            entry.video.hidden = entry.failed || (reducedMotion.matches && !entry.allowReducedMotion);
            updateExample(entry);
            if (!shouldPlay(entry)) {
                entry.video.pause();
                updateToggle(entry);
                return;
            }
            if (!entry.video.getAttribute('src')) entry.video.src = entry.app.video;
            if (entry.video.paused && !entry.playPending) {
                entry.playPending = true;
                // Restart explicitly if a player reports completion instead of looping.
                if (entry.video.ended) entry.video.currentTime = 0;
                entry.video.play().then(() => {
                    if (!shouldPlay(entry)) entry.video.pause();
                }).catch(error => {
                    // Closing/scrolling during loading legitimately interrupts play().
                    if (error.name !== 'AbortError' && shouldPlay(entry)) entry.autoplayBlocked = true;
                }).finally(() => {
                    entry.playPending = false;
                    updateToggle(entry);
                    if (shouldPlay(entry) && entry.video.paused) queueMicrotask(syncMedia);
                });
            }
        });
    }

    window.openSisterApps = function () {
        const modal = document.getElementById('sisterAppsModal');
        if (!modal) return;
        // Safari taps need an explicit opener for the shared focus-return behavior.
        focusWithoutScrolling(document.getElementById('sisterAppsBtn'));
        modal.style.display = 'flex';
        syncMedia();
    };

    window.closeSisterApps = function () {
        const modal = document.getElementById('sisterAppsModal');
        if (modal) modal.style.display = 'none';
        syncMedia();
    };

    window.SisterApps = Object.freeze({ apps });
    const links = document.getElementById('sisterAppsLinks');
    if (!links) return;
    apps.forEach(app => {
        const card = document.createElement('article');
        card.className = 'sister-apps-card';
        const link = document.createElement('a');
        link.className = 'sister-apps-link';
        link.dataset.app = app.id;
        link.href = app.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        link.setAttribute('aria-label', `${app.title}：${app.description}（別のタブで開く）`);
        const icon = document.createElement('img');
        icon.src = app.icon;
        icon.alt = '';
        icon.width = icon.height = 40;
        const copy = document.createElement('span');
        copy.className = 'sister-apps-copy';
        const title = document.createElement('strong');
        title.textContent = app.title;
        const description = document.createElement('span');
        description.textContent = app.description;
        copy.append(title, description);
        const head = document.createElement('span');
        head.className = 'sister-apps-card-heading';
        head.append(icon, copy);
        const media = document.createElement('span');
        media.className = 'sister-apps-media';
        const poster = document.createElement('img');
        poster.src = app.preview;
        poster.alt = app.previewAlt;
        poster.width = app.previewWidth;
        poster.height = app.previewHeight;
        poster.loading = 'lazy';
        const video = document.createElement('video');
        video.className = 'sister-apps-video';
        video.poster = app.preview;
        video.width = app.previewWidth;
        video.height = app.previewHeight;
        video.muted = video.defaultMuted = video.loop = video.playsInline = true;
        video.setAttribute('muted', '');
        video.setAttribute('playsinline', '');
        video.setAttribute('aria-hidden', 'true');
        video.preload = 'none';
        media.append(poster, video);
        let example, exampleWord, exampleCaption;
        if (app.examples) {
            example = document.createElement('span');
            example.className = 'sister-apps-example';
            exampleWord = document.createElement('strong');
            exampleCaption = document.createElement('span');
            example.append(exampleWord, exampleCaption);
            media.append(example);
        }
        const cta = document.createElement('span');
        cta.className = 'sister-apps-cta';
        const ctaLabel = document.createElement('span');
        ctaLabel.textContent = 'アプリを開く';
        const external = document.createElement('span');
        external.className = 'sister-apps-picto sister-apps-external';
        external.setAttribute('aria-hidden', 'true');
        cta.append(ctaLabel, external);
        link.append(head, media, cta);
        const toggle = document.createElement('button');
        toggle.type = 'button';
        toggle.className = 'sister-apps-motion-toggle';
        const entry = { app, media, video, toggle, example, exampleWord, exampleCaption, userPaused: false, allowReducedMotion: false,
            autoplayBlocked: false, failed: false, playPending: false };
        toggle.addEventListener('click', () => {
            entry.userPaused = !video.paused;
            if (!entry.userPaused) {
                entry.allowReducedMotion = true;
                entry.autoplayBlocked = false;
            }
            syncMedia();
        });
        video.addEventListener('play', () => updateToggle(entry));
        video.addEventListener('timeupdate', () => updateExample(entry));
        video.addEventListener('loadeddata', () => updateExample(entry));
        video.addEventListener('seeked', () => updateExample(entry));
        video.addEventListener('pause', () => {
            updateToggle(entry);
            // Native looping can pause on rewind without an ended event (WebKit).
            // Respect deliberate pauses, reduced motion, hidden pages and offscreen media.
            if (shouldPlay(entry)) queueMicrotask(syncMedia);
        });
        // Reuse the visibility/manual-pause guards; never restart a deliberately stopped clip.
        video.addEventListener('ended', syncMedia);
        video.addEventListener('error', () => {
            entry.failed = true;
            video.hidden = true;
            updateExample(entry);
            updateToggle(entry);
        });
        updateToggle(entry);
        updateExample(entry);
        card.append(link, toggle);
        links.append(card);
        mediaEntries.push(entry);
        if (entry.example) new ResizeObserver(() => updateToggle(entry)).observe(media);
    });
    const modal = document.getElementById('sisterAppsModal');
    new MutationObserver(syncMedia).observe(modal, { attributes: true, attributeFilter: ['style', 'class', 'hidden'] });
    const body = modal.querySelector('.sister-apps-body');
    body.addEventListener('scroll', syncMedia, { passive: true });
    window.addEventListener('resize', syncMedia);
    document.addEventListener('visibilitychange', syncMedia);
    const onMotionChange = () => {
        mediaEntries.forEach(entry => { entry.allowReducedMotion = false; });
        syncMedia();
    };
    if (reducedMotion.addEventListener) reducedMotion.addEventListener('change', onMotionChange);
    else reducedMotion.addListener(onMotionChange);
})();
