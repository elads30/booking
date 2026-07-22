import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clean existing data
  await prisma.appointment.deleteMany({});
  await prisma.service.deleteMany({});
  await prisma.businessHours.deleteMany({});

  console.log('Cleaned old data.');

  // 2. Create services
  const consultation = await prisma.service.create({
    data: {
      name: 'Consultation Session',
      description: 'A 30-minute initial consultation to discuss your needs and set goals.',
      duration: 30,
      price: 50.0,
    },
  });

  const therapy = await prisma.service.create({
    data: {
      name: 'Standard Therapy Session',
      description: 'A 60-minute standard therapy and alignment session.',
      duration: 60,
      price: 100.0,
    },
  });

  const extended = await prisma.service.create({
    data: {
      name: 'Extended Deep Dive',
      description: 'A 90-minute extended deep-dive session for deep therapeutic work.',
      duration: 90,
      price: 150.0,
    },
  });

  console.log('Created services:', [consultation.name, therapy.name, extended.name]);

  // 3. Create default business hours (Sunday: 0, Monday: 1, ..., Saturday: 6)
  // Sunday: Open 10:00-15:00 (no breaks)
  // Monday-Thursday: Open 09:00-17:00 (break 13:00-14:00)
  // Friday: Open 09:00-15:00 (no breaks)
  // Saturday: Closed
  const hoursData = [
    { dayOfWeek: 0, isOpen: true, startTime: '10:00', endTime: '15:00', breaks: '[]' },
    { dayOfWeek: 1, isOpen: true, startTime: '09:00', endTime: '17:00', breaks: JSON.stringify([{ startTime: '13:00', endTime: '14:00' }]) },
    { dayOfWeek: 2, isOpen: true, startTime: '09:00', endTime: '17:00', breaks: JSON.stringify([{ startTime: '13:00', endTime: '14:00' }]) },
    { dayOfWeek: 3, isOpen: true, startTime: '09:00', endTime: '17:00', breaks: JSON.stringify([{ startTime: '13:00', endTime: '14:00' }]) },
    { dayOfWeek: 4, isOpen: true, startTime: '09:00', endTime: '17:00', breaks: JSON.stringify([{ startTime: '13:00', endTime: '14:00' }]) },
    { dayOfWeek: 5, isOpen: true, startTime: '09:00', endTime: '15:00', breaks: '[]' },
    { dayOfWeek: 6, isOpen: false, startTime: '09:00', endTime: '17:00', breaks: '[]' },
  ];

  for (const h of hoursData) {
    await prisma.businessHours.create({ data: h });
  }

  console.log('Created business hours for Sunday to Saturday.');
  console.log('Database seeded successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
