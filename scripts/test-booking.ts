import { PrismaClient } from '@prisma/client';
import { getAvailableSlots } from '../src/lib/calendar';

const prisma = new PrismaClient();

async function runTests() {
  console.log('\n==================================================');
  console.log('🧪 Running Automated Booking Tests...');
  console.log('==================================================');

  // 1. Get service
  const service = await prisma.service.findFirst();
  if (!service) {
    console.error('❌ FAIL: No service found. Seed the database first.');
    process.exit(1);
  }
  console.log(`Service: ${service.name} (${service.duration} mins)`);

  const testDate = '2026-08-10'; // Monday (Business open)

  // 2. Fetch slots before booking
  const slotsBefore = await getAvailableSlots(testDate, service.id);
  console.log(`Slots before booking: ${slotsBefore.length} slots available.`);
  if (slotsBefore.length === 0) {
    console.error('❌ FAIL: No available slots on a normal working Monday.');
    process.exit(1);
  }

  const testSlot = slotsBefore[0];
  console.log(`Selected slot: ${testSlot.startTime} - ${testSlot.endTime}`);

  // Clear any existing test appointments on this date
  await prisma.appointment.deleteMany({
    where: { date: testDate },
  });

  // 3. Create appointment
  console.log('Booking the slot...');
  const app = await prisma.appointment.create({
    data: {
      clientName: 'Automation Tester',
      clientEmail: 'tester@example.com',
      clientPhone: '054-0000000',
      serviceId: service.id,
      date: testDate,
      startTime: testSlot.startTime,
      endTime: testSlot.endTime,
      status: 'pending',
    },
  });
  console.log(`Appointment created with ID: ${app.id}`);

  // 4. Verify slot is now unavailable
  const slotsAfter = await getAvailableSlots(testDate, service.id);
  const isAvailable = slotsAfter.some((s) => s.startTime === testSlot.startTime);

  if (isAvailable) {
    console.error('❌ FAIL: Booked slot is still available!');
    // Cleanup
    await prisma.appointment.delete({ where: { id: app.id } });
    process.exit(1);
  }
  console.log('✅ SUCCESS: Booked slot correctly removed from availability list.');

  // 5. Cleanup
  await prisma.appointment.delete({
    where: { id: app.id },
  });
  console.log('Test appointment cleaned up.');
  console.log('==================================================');
  console.log('🎉 ALL AUTOMATED TESTS PASSED SUCCESSFULLY!');
  console.log('==================================================\n');
}

runTests()
  .catch((err) => {
    console.error('❌ Test script failed with error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
