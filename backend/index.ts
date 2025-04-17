

import { PrismaClient } from './src/generated/prisma'

const prisma = new PrismaClient()

// Example usage
async function main() {
  // id        String  @id @default(auto()) @map("_id") @db.ObjectId
  // clerkId   String  @unique
  // email     String  @unique
  // firstName String?
  // lastName  String?
  await prisma.user.create({
    data: {
      clerkId: 'test1234567890',
      email: 'hello@prisma.com',
      firstName: 'John',
      lastName: 'Doe',
    },
  })
  const allUsers = await prisma.user.findMany();
  console.log(allUsers);
}
main();

