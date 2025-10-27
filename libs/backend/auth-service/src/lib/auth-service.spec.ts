import { authService } from './auth-service.js';

describe('authService', () => {
  it('should work', () => {
    expect(authService()).toEqual('auth-service');
  });
});
