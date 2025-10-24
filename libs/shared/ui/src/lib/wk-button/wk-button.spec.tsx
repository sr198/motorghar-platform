import { render } from '@testing-library/react';
import WkButton from './wk-button';

describe('WkButton', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<WkButton label="Click Me" />);
    expect(baseElement).toBeTruthy();
  });

  it('should display the correct label', () => {
    const { getByText } = render(<WkButton label="Test Button" />);
    expect(getByText('Test Button')).toBeTruthy();
  });
});