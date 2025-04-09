const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

async function createUser(email, plainPassword) {
  const password = await bcrypt.hash(plainPassword, 10);
  return await prisma.user.create({
    data: { email, password }
  });
}

async function main() {
  const user1 = await createUser('baishnab1708@gmail.com', 'baishnab');
  const user2 = await createUser('abcd@example.com', 'abcd');
  const user3 = await createUser('bob@example.com', 'bob');

  await prisma.book.createMany({
    data: [
      {
        title: 'The Alchemist',
        author: 'Paulo Coelho',
        category: 'Fiction',
        price: 299,
        rating: 4.5,
        publishedDate: new Date('1988-01-01'),
        userId: user1.id,
      },
      {
        title: 'Rich Dad Poor Dad',
        author: 'Robert Kiyosaki',
        category: 'Finance',
        price: 399,
        rating: 4.3,
        publishedDate: new Date('1997-04-01'),
        userId: user1.id,
      },
      {
        title: 'Atomic Habits',
        author: 'James Clear',
        category: 'Self-Help',
        price: 449,
        rating: 4.8,
        publishedDate: new Date('2018-10-16'),
        userId: user2.id,
      },
      {
        title: 'Clean Code',
        author: 'Robert C. Martin',
        category: 'Programming',
        price: 599,
        rating: 4.7,
        publishedDate: new Date('2008-08-01'),
        userId: user3.id,
      }
    ],
  });

  console.log('✅ Seed data inserted with multiple users!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
