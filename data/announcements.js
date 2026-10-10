(function (global) {
    global.APP_ANNOUNCEMENTS = [
        {
            id: "2026-10-04-my-wordbooks",
            date: "2026-10-04",
            version: "無料機能",
            title: "自分だけの「マイ単語帳」を作れます",
            summary: "テスト範囲や苦手な語を一冊に。無料で使えます。",
            body: [
                "収録語を検索・まとめ入力で追加できます。未収録の語は、自分で意味を登録できます。",
                "復習キュー・苦手・得意・完璧から選んだり、自分用の訳・メモを残したりできます。"
            ],
            usage: [
                "「単語帳から選ぶ」→「マイ単語帳」から作成できます。",
                "作成した単語帳を開き、「この単語帳を学習」で、その中の語だけを出題します。",
                "名前変更や削除は、単語帳内の「名前の変更・単語帳の削除」から。"
            ],
            impact: [
                "収録語の学習履歴は元の単語と共通です。単語帳を削除しても、学習履歴・復習予定は消えません。"
            ]
        },
        {
            id: "2026-10-04-noun-illustrations-complete",
            date: "2026-10-04",
            version: "イラスト完成",
            title: "すべての収録名詞にイラストがつきました！",
            summary: "アプリ収録の名詞すべてに対応。絵と一緒に覚えられます。",
            images: [
                { src: "assets/word-illustrations/apple-pictogram-v1.webp", alt: "りんごのイラスト" },
                { src: "assets/word-illustrations/bicycle-pictogram-v1.webp", alt: "自転車のイラスト" },
                { src: "assets/word-illustrations/cat-pictogram-v1.webp", alt: "猫のイラスト" }
            ],
            featuredBody: [
                "アプリに収録されている名詞すべてに、イラストがつきました。",
                "「イラスト単語帳」で、絵と単語をまとめて学習できます。",
                "無料版は固定100語、プレミアムでは単語帳の全収録語を学習できます。"
            ],
            body: [
                "アプリ収録の名詞すべてにイラストを追加しました。",
                "イラスト単語帳には4,155語を収録。無料版は固定100語、プレミアムでは全収録語を学習できます。"
            ],
            usage: [
                "「単語帳から選ぶ」→「イラスト単語帳」で開けます。",
                "絵は回答後に表示されます。回答前に見たいときは「イラスト」ボタンを押してください。"
            ],
            impact: [
                "学習記録は元の単語と共通です。これまでの履歴や復習ポイントはリセットされません。"
            ],
            featured: true,
            autoOpenOnce: true,
            action: "illustrated-wordbook",
            actionLabel: "イラスト単語帳を開く"
        },
        {
            id: "2026-10-04-illustration-always-visible",
            date: "2026-10-04",
            version: "表示設定",
            title: "イラストを常時表示できます",
            summary: "回答前からイラストを表示したまま学習できます。",
            body: [
                "回答前からイラストを表示したまま学習できます。初期設定はオフです。"
            ],
            usage: [
                "「その他」→「出題・復習・表示設定」→「表示」で「イラストを常時表示」をオンにしてください。",
                "オンの間はカードに「常時表示中」と表示されます。押すと表示設定を開けます。"
            ]
        },
        {
            id: "2026-07-17-review-ranking",
            date: "2026-07-17",
            version: "大型アップデート",
            title: "新ランキングシステム、導入！",
            summary: "復習でポイントを獲得し、週間ランキングに参加できます。",
            image: "assets/review-ranking-update.png",
            imageAlt: "6種類のアバターで参加できる週間復習ランキングが始まったことを伝える画像",
            featuredBody: [
                "・苦手単語を復習して、ポイントを稼ごう",
                "・今週の復習ポイントで、ランキングを競おう",
                "・6種類のアバターから、自分のプロフィールを設定可能"
            ],
            body: [
                "苦手単語を復習してポイントを獲得し、週間ランキングを競えるようになりました。",
                "6種類のアバターから、自分のプロフィールを設定できます。"
            ],
            actionLabel: "ランキングを見る"
        },
        {
            id: "2026-06-22-word-list",
            date: "2026-06-22",
            version: "v3.22",
            title: "英単語一覧を追加しました",
            summary: "単語を検索し、和訳や学習状態を一覧で確認できます。",
            body: [
                "レベル別に英単語を一覧で確認できるようになりました。",
                "検索、和訳表示の切替、並び替え、学習状態の確認に対応しています。"
            ]
        },
        {
            id: "2026-05-04-ipa",
            date: "2026-05-04",
            version: "v3.00",
            title: "発音表記を追加しました",
            summary: "単語カードで発音表記を確認できます。",
            body: [
                "各英単語に発音表記を追加しました。",
                "発音表記はDuolingo標準に合わせています。"
            ]
        }
    ];
    // Keep only identity/date for old read-state migration, not visible articles.
    global.APP_RETIRED_ANNOUNCEMENTS = [
        { id: "2026-09-11-illustrated-wordbook", date: "2026-09-11" },
        { id: "2026-09-09-word-card-update", date: "2026-09-09" },
        { id: "2026-09-09-feedback-notifications", date: "2026-09-09" },
        { id: "2026-09-08-review-only-guide", date: "2026-09-08" }
    ];
})(window);
