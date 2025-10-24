import { render } from '@testing-library/react';

import WkInput from './wk-input';

describe('WkInput', () => {
  it('should render successfully', () => {
    const { baseElement } = render(<WkInput />);
    expect(baseElement).toBeTruthy();
  });
});
