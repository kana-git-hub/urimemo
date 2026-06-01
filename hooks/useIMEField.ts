import { useCallback, useRef, useState } from 'react';

/**
 * 日本語IME（かな漢字変換）対応のテキスト入力用フック。
 *
 * iOS では変換確定前の未確定文字に下線（marked text）が表示されるが、入力中に
 * `setState` で再レンダリングが起きると、その下線が消える（特に New Architecture /
 * Fabric の TextInput）。文字自体は非制御なら残るが、下線だけがクリアされてしまう。
 *
 * そこで **入力中（フォーカス中）は一切 setState せず** 値は `ref` にのみ保持し、
 * UI 反映用の `value` は「入力欄からフォーカスが外れた／確定した」タイミングでだけ
 * 更新する（= `commit`）。これにより変換中は再レンダリングが起きず、下線が保持される。
 *
 *  - `initial`      … TextInput の `defaultValue` 用（非制御入力にする）
 *  - `value`        … commit 済みの値（プレビュー・バリデーション・検索フィルタに使う）
 *  - `onChangeText` … TextInput に渡すハンドラ（ref を更新するだけ／再レンダリングしない）
 *  - `commit`       … onEndEditing / onSubmitEditing に渡し、value へ反映する
 *  - `getCurrent()` … 送信時など、最新の確定値が必要な箇所で使う
 */
export function useIMEField(initial = '') {
  const ref = useRef(initial);
  const [value, setValue] = useState(initial);

  const onChangeText = useCallback((t: string) => {
    ref.current = t;
  }, []);

  const commit = useCallback(() => {
    setValue(ref.current);
  }, []);

  const getCurrent = useCallback(() => ref.current, []);

  return { initial, value, onChangeText, commit, getCurrent };
}
