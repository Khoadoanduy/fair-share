

import { PrismaClient } from './src/generated/prisma'

const prisma = new PrismaClient()

// Example usage
async function main() {
  // id        String  @id @default(auto()) @map("_id") @db.ObjectId
  // clerkId   String  @unique
  // email     String  @unique
  // firstName String?
  // lastName  String?
  await prisma.user.create({ //prisma replace mongoose
    data: {
      clerkId: 'clerk_fake_123',
      email: 'jane.doe@example.com',
      firstName: 'Jane',
      lastName: 'Doe',
      phoneNumber: '123-456-7890', // optional
      dateOfBirth: new Date('2000-01-01'),
      address: {
        country: 'USA',
        street: '1234 Main St',
        apartment: 'Unit 2B',
        city: 'Tallahassee',
        state: 'FL',
        zipCode: '32304'
      },
    },
  })
  const allUsers = await prisma.user.findMany();
  console.log(allUsers);
}
main();

