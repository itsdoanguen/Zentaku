/* eslint-disable no-console */
import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { AppDataSource } from '../config/database';
import { User } from '../entities/User.entity';
import { UserAuthentication } from '../entities/UserAuthentication.entity';
import { SystemRole } from '../entities/types/enums';
import { PasswordUtil } from '../modules/auth/utils/password.util';

async function seedAdmin() {
  await AppDataSource.initialize();
  console.log('Database connected.');

  const userRepository = AppDataSource.getRepository(User);
  const userAuthRepository = AppDataSource.getRepository(UserAuthentication);

  const email = 'admin@zentaku.com';
  const username = 'SuperAdmin';
  const password = 'adminPassword123!';

  let user = await userRepository.findOne({ where: { email } });

  if (!user) {
    user = userRepository.create({
      email,
      username,
      displayName: 'System Administrator',
      systemRole: SystemRole.SUPER_ADMIN,
    });
    await userRepository.save(user);

    const passwordHash = await PasswordUtil.hash(password);
    const auth = userAuthRepository.create({
      user,
      passwordHash,
      emailVerified: true,
      isActive: true,
    });
    await userAuthRepository.save(auth);

    console.log(`✅ Super Admin created! Email: ${email}, Password: ${password}`);
  } else {
    user.systemRole = SystemRole.SUPER_ADMIN;
    await userRepository.save(user);
    console.log(`✅ Existing user ${email} upgraded to Super Admin.`);
  }

  await AppDataSource.destroy();
}

seedAdmin().catch((err) => {
  console.error('Error seeding admin:', err);
  process.exit(1);
});
