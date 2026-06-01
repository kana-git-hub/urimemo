import React from 'react';
import { TextInput, TextInputProps } from 'react-native';

/**
 * 日本語IME対応の TextInput。
 *
 * iOS では、変換確定前の未確定文字（marked text）に下線が表示されるが、
 * 入力中に親が再レンダリングされて native の TextInput が更新されると、
 * その下線が消えたり変換が中断したりする。
 *
 * これを防ぐため:
 *  - `value` を使わず非制御（`defaultValue`）にする
 *  - `React.memo` で囲み、親の再レンダリングが伝播しないようにする
 *
 * 利用側は props を安定参照で渡すこと（`defaultValue` は初期値のみの固定値、
 * `onChangeText` は useState の setter など安定した関数）。そうすれば入力中に
 * この入力欄は再レンダリングされず、変換中の下線が保持される。
 */
const IMETextInput = React.memo((props: TextInputProps) => {
  return <TextInput {...props} />;
});

export default IMETextInput;
