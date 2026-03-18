import AdminRoute from './AdminRoute';
import testController from '../../controllers/authController';
import { beforeEach } from 'node:test';


describe('AdminRoute Tests', () => {
  beforeEach(() => {
    jest.clearallMocks();
  });

  it('should not allow access without admin login', async () => {
    const mockReq = jest.fn();

    await testController(mockReq, AdminRoute);

  });

  it('should allow access with admin login', () => {

  });
});