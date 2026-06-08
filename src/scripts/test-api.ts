import axios from 'axios';
import { TokenUtil } from '../modules/auth/utils/token.util';
import { SystemRole } from '../entities/types/enums';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env') });

async function testApi() {
  const token = TokenUtil.generateAccessToken({
    userId: 1,
    email: 'admin@zentaku.com',
    username: 'admin',
    roles: [],
    systemRole: SystemRole.SUPER_ADMIN,
  });

  try {
    const res = await axios.get('http://localhost:3500/api/support/admin/tickets', {
      headers: { Authorization: `Bearer ${token}` },
    });
    console.log('Response status:', res.status);
    console.log('Response data:', JSON.stringify(res.data, null, 2));
  } catch (err: any) {
    console.error('Error status:', err.response?.status);
    console.error('Error data:', err.response?.data);
  }
}

testApi();
