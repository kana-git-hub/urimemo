import { useCallback, useState } from 'react';

/**
 * 入力欄のフォーカス状態を管理するフック。
 *
 * React Native には CSS のようなフォーカスリングが無いため、`onFocus`/`onBlur` で
 * フォーカス状態を持ち、フォーカス中だけ枠線色をアクセントに変える（= フォーカスリング）。
 * 枠線の太さは固定し色だけ変えることでレイアウトのズレを防ぐ。
 *
 * フォーカス/ブラーは離散的なイベントなので、ここでの再レンダリングは
 * IME の変換中には発生せず、変換の下線には影響しない。
 */
export function useFocusRing() {
  const [focused, setFocused] = useState(false);
  const onFocus = useCallback(() => setFocused(true), []);
  const onBlur = useCallback(() => setFocused(false), []);
  return { focused, onFocus, onBlur };
}
