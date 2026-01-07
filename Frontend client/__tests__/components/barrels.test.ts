describe('barrel exports load', () => {
  it('components index loads', () => {
    const mod = require('@/components');
    expect(mod).toBeTruthy();
    expect(mod.Button).toBeTruthy();
  });
  it('atoms index loads', () => {
    const mod = require('@/components/atoms');
    expect(mod).toBeTruthy();
  });
  it('ui index loads', () => {
    const mod = require('@/components/ui');
    expect(mod).toBeTruthy();
  });
  it('molecules index loads', () => {
    const mod = require('@/components/molecules');
    expect(mod).toBeTruthy();
  });
  it('organisms index loads', () => {
    const mod = require('@/components/organisms');
    expect(mod).toBeTruthy();
  });
  it('templates index loads', () => {
    const mod = require('@/components/templates');
    expect(mod).toBeTruthy();
  });
  it('organisms/modals index loads', () => {
    const mod = require('@/components/organisms/modals');
    expect(mod).toBeTruthy();
  });
});
