import React from 'react';
import PublicServiceFormLayout from '@/components/templates/PublicServiceFormLayout';
import { renderWithThemeAsync } from '../test-utils';
import { Animated, Text } from 'react-native';
import { fireEvent } from '@testing-library/react-native';

function findPressableWithText(root: any, text: string): any | null {
  const stack: any[] = [root];
  let targetTextNode: any = null;
  while (stack.length) {
    const n = stack.pop();
    if (typeof n?.props?.children === 'string' && n.props.children === text) {
      targetTextNode = n; break;
    }
    if (n?.children) stack.push(...n.children);
  }
  if (!targetTextNode) return null;
  let cur = targetTextNode.parent;
  while (cur) {
    if (cur?.props && typeof cur.props.onPress === 'function') return cur;
    cur = cur.parent;
  }
  return null;
}

describe('PublicServiceFormLayout', () => {
  it('renders and triggers onSubmit when pressing button', async () => {
    const onSubmit = jest.fn();
    const successAnim = new Animated.Value(1);
    const checkAnim = new Animated.Value(1);

    const utils: any = await renderWithThemeAsync(
      <PublicServiceFormLayout
        title="Paiement"
        icon={<Text>Icon</Text>}
        iconColor="#00f"
        loading={false}
        successModalVisible={false}
        successAnim={successAnim}
        checkAnim={checkAnim}
        onSubmit={onSubmit}
      >
        <Text>Form</Text>
      </PublicServiceFormLayout>
    );

    const pressable = findPressableWithText(utils.root, 'Confirmer le paiement');
    expect(pressable).toBeTruthy();
    fireEvent.press(pressable);
    expect(onSubmit).toHaveBeenCalled();
  });
});
