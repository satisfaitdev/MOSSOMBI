import { Animated } from 'react-native';
import animations, { fadeIn, fadeOut, scaleIn, slideUp, bounce, shake, pulse } from '@/components/ui/animations';

describe('ui/animations', () => {
  it('exports object', () => {
    expect(animations).toBeTruthy();
  });

  it('creates animation instances', () => {
    const v = new Animated.Value(0);
    expect(fadeIn(v)).toBeTruthy();
    expect(fadeOut(v)).toBeTruthy();
    expect(scaleIn(v)).toBeTruthy();
    expect(slideUp(v)).toBeTruthy();
    expect(bounce(v)).toBeTruthy();
    expect(shake(v)).toBeTruthy();
    expect(pulse(v)).toBeTruthy();
  });
});
