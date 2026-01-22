import { themes } from '../../styles/theme';

describe('theme config', () => {
  it('contains the expected color properties', () => {
    const theme = themes.default;

    expect(theme).toEqual({
      primary: '#9AA793',
      secondary: '#E6D29C',
      primaryDark: '#6D7E68',
      text: '#ffffff',
      white: '#ffffff',
      black: '#000000',
      placeholderText: '#999',
      settings: '#D9D9D9',
      error: '#E44438',
    });
  });
});
