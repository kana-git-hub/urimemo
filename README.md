# ウリメモ (urimemo)

同人即売会（コミケ等）の頒布物の売上をその場で記録するためのモバイルアプリです。商品ごとの頒布数をワンタップでカウントし、合計売上・合計頒布数をリアルタイムに集計します。

白基調・余白を活かしたミニマルなUI（コードネーム「白磁」）に、`#667EEA` のブルーパープルをアクセントとして採用しています。

- **アプリ名**: ウリメモ
- **slug**: `urimemo`
- **bundle identifier (iOS)**: `com.kana.urimemo`
- **データ保存**: 端末内 `AsyncStorage`（サーバー・アカウント不要、完全オフライン動作）

---

## 技術スタック

| 種別 | 採用技術 |
| --- | --- |
| フレームワーク | [Expo](https://expo.dev/) ~53 / React Native 0.79 |
| 言語 | TypeScript（画面）/ JavaScript（エントリ） |
| UI | React Native 標準コンポーネント + `StyleSheet` による独自デザイン、アイコンは [`@expo/vector-icons`](https://icons.expo.fyi/)（MaterialCommunityIcons） |
| 画面遷移 | React Navigation 7（native-stack）+ 画面内の独自下タブ（レジ / 集計） |
| 永続化 | `@react-native-async-storage/async-storage` |
| ビルド/配信 | EAS Build / EAS Submit |
| ランタイム | React 19、New Architecture 有効（`newArchEnabled: true`） |

---

## 必要環境

- Node.js（LTS 推奨）
- npm
- Expo CLI（`npx expo` 経由で利用するため個別インストール不要）
- EAS でビルドする場合: [EAS CLI](https://docs.expo.dev/eas/) `>= 16.12.0` と Expo アカウント
- 実機確認: iOS / Android の [Expo Go](https://expo.dev/go) アプリ

---

## セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバー起動（QRコードを Expo Go で読み取り）
npm start
```

### プラットフォーム別起動

```bash
npm run ios       # iOS シミュレータ
npm run android   # Android エミュレータ
npm run web       # Web ブラウザ
```

---

## プロジェクト構成

```
urimemo/
├── App.jsx                  # ルートコンポーネント。Navigator と初期化（LoadingScreen）を定義
├── index.js                 # registerRootComponent エントリポイント
├── app.json                 # Expo アプリ設定（名前/アイコン/iOS/Android）
├── eas.json                 # EAS Build / Submit プロファイル
├── tsconfig.json            # expo/tsconfig.base を継承
├── assets/                  # アイコン・スプラッシュ画像
├── screens/
│   ├── LoadingScreen.tsx    # 起動時スプラッシュ
│   ├── MainScreen.tsx       # メイン画面。下タブで「レジ」「集計」を切替（初期画面）
│   ├── AddItemScreen.tsx    # 商品登録（名前・価格）
│   ├── ItemDetailScreen.tsx # 商品詳細・編集・削除（現在の実績表示）
│   └── ItemListScreen.tsx   # 旧・商品一覧画面（MainScreen に統合済みの未使用ファイル）
└── docs/
    ├── privacy_policy/      # プライバシーポリシー（GitHub Pages 等で公開）
    └── app_support/         # サポートページ
```

---

## 画面と機能

### Main（メイン）— 初期画面
画面下部の独自タブバーで「レジ」「集計」を切替え、中央のフローティングボタンから商品登録へ遷移します。

**レジタブ**
- 本日の売上を主役として大きく表示（合計売上・頒布点数・商品種数）
- 商品行の `＋ / −` ワンタップ増減
- 商品名の横にペンアイコンを表示し、タップで詳細・編集画面へ遷移
- 名前での検索
- 並び替え: 名前 / 価格 / 売上（`price × count`）
- 数量のクイック編集（モーダル）
- 全商品のカウントを 0 に戻す「リセット」機能（確認モーダルあり）

**集計タブ**
- 総売上・販売点数のサマリーカード
- 最も売れている商品のハイライト
- 商品別売上のランキングとバー表示

### AddItem（商品登録）
- 商品名・価格を入力して登録（価格プリセット・入力プレビューあり）
- 中央のフローティング「登録」ボタンから遷移

### ItemDetail（商品詳細）
- 現在の実績（頒布数・売上）の表示
- 商品名・価格の編集、変更後プレビュー
- 商品の個別削除（確認モーダルあり）

---

## データモデル

`AsyncStorage` のキー `items` に、以下の配列を JSON 文字列で保存します。

```ts
interface Item {
  id: string;     // 一意なID
  name: string;   // 商品名
  price: number;  // 単価（円）
  count: number;  // 頒布数
}
```

- 売上 = `price × count`
- すべて端末ローカルに保存され、外部送信は行いません。

---

## ビルド・配信（EAS）

`eas.json` に定義されたプロファイル:

| プロファイル | 用途 |
| --- | --- |
| `development` | development client・内部配信 |
| `preview` | 内部配信（動作確認用） |
| `production` | 本番（`autoIncrement` でビルド番号自動採番） |

```bash
# 例: プレビュービルド
eas build --profile preview --platform ios

# 本番ビルド
eas build --profile production --platform all

# ストア提出
eas submit --profile production
```

> バージョン管理は `appVersionSource: "remote"`（EAS 側で管理）です。

---

## ドキュメントページ

`docs/` 配下に審査・公開用の静的ページを同梱しています。

- `docs/privacy_policy/index.html` — プライバシーポリシー
- `docs/app_support/index.html` — サポートページ

---

## ライセンス

`package.json` は `"private": true` のため、現時点では非公開プロジェクトです。
