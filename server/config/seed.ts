// server/config/seed.ts
import { UserModel } from '../models/schemas.ts';
import { DEMO_USERS } from './demoData.ts';

export async function seedIfEmpty(): Promise<void> {
    const count = await UserModel.countDocuments();
    if (count === 0) {
        await UserModel.insertMany(DEMO_USERS);
        console.log(`🌱 Seeded ${DEMO_USERS.length} demo users`);
    } else {
        console.log(`ℹ️  Users collection already has ${count} docs, skipping seed`);
    }
}