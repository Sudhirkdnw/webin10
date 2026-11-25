import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial operational module data for 6 tenants...');

  const today = new Date().toISOString().split('T')[0];

  // 1. Gym Tenant
  const gymTenant = await prisma.tenant.findFirst({
    where: { category: { slug: 'gym' } },
  });

  if (gymTenant) {
    console.log(`Found Gym Tenant: ${gymTenant.name} (${gymTenant.id})`);
    // Seed Attendance
    await prisma.attendanceLog.createMany({
      data: [
        {
          tenantId: gymTenant.id,
          name: 'Rahul Sharma',
          role: 'Member',
          phone: '+91 98765 43210',
          checkInTime: '06:15 AM',
          date: today,
          method: 'QR_KIOSK',
          status: 'PRESENT',
          whatsappSent: true,
        },
        {
          tenantId: gymTenant.id,
          name: 'Priya Verma',
          role: 'Member',
          phone: '+91 98111 22334',
          checkInTime: '06:45 AM',
          date: today,
          method: 'QR_KIOSK',
          status: 'PRESENT',
          whatsappSent: true,
        },
        {
          tenantId: gymTenant.id,
          name: 'Vikram Singh',
          role: 'Trainer',
          phone: '+91 97334 45566',
          checkInTime: '06:00 AM',
          date: today,
          method: 'QR_KIOSK',
          status: 'PRESENT',
          whatsappSent: true,
        },
        {
          tenantId: gymTenant.id,
          name: 'Amit Patel',
          role: 'Member',
          phone: '+91 99223 34455',
          checkInTime: '07:30 AM',
          date: today,
          method: 'MOBILE_APP',
          status: 'LATE',
          whatsappSent: true,
        },
      ],
    });
    console.log('Seeded Attendance for Gym!');
  }

  // 2. Salon Tenant
  const salonTenant = await prisma.tenant.findFirst({
    where: { category: { slug: 'salon' } },
  });

  if (salonTenant) {
    console.log(`Found Salon Tenant: ${salonTenant.name} (${salonTenant.id})`);
    // Seed Appointments
    await prisma.appointment.createMany({
      data: [
        {
          tenantId: salonTenant.id,
          clientName: 'Sunita Mehra',
          phone: '+91 98200 11223',
          service: 'Keratin Hair Spa & Styling',
          stylist: 'Kavita Roy',
          timeSlot: '11:00 AM - 12:30 PM',
          slotDate: today,
          status: 'CONFIRMED',
          amount: '₹2,499',
        },
        {
          tenantId: salonTenant.id,
          clientName: 'Rohan Mehra',
          phone: '+91 97111 88990',
          service: 'Beard Trim & Classic Haircut',
          stylist: 'Sameer Khan',
          timeSlot: '01:00 PM - 01:45 PM',
          slotDate: today,
          status: 'IN_PROGRESS',
          amount: '₹650',
        },
        {
          tenantId: salonTenant.id,
          clientName: 'Ananya Deshmukh',
          phone: '+91 99234 56789',
          service: 'Bridal Glow Facial & Manicure',
          stylist: 'Kavita Roy',
          timeSlot: '03:00 PM - 05:00 PM',
          slotDate: today,
          status: 'CONFIRMED',
          amount: '₹4,800',
        },
      ],
    });
    console.log('Seeded Appointments for Salon!');
  }

  // 3. Retail Tenant
  const retailTenant = await prisma.tenant.findFirst({
    where: { category: { slug: 'retail' } },
  });

  if (retailTenant) {
    console.log(`Found Retail Tenant: ${retailTenant.name} (${retailTenant.id})`);
    // Seed Khata
    await prisma.khataEntry.createMany({
      data: [
        {
          tenantId: retailTenant.id,
          customerName: 'Gupta Kirana & General Store',
          phone: '+91 98234 11223',
          amount: 4500,
          balanceDue: 4500,
          type: 'CREDIT',
          status: 'OVERDUE',
        },
        {
          tenantId: retailTenant.id,
          customerName: 'Sunil Kumar (Sharma Ji)',
          phone: '+91 99341 55667',
          amount: 1850,
          balanceDue: 1850,
          type: 'CREDIT',
          status: 'PENDING',
        },
        {
          tenantId: retailTenant.id,
          customerName: 'Manoj Dairy Parlour',
          phone: '+91 98990 00112',
          amount: 6200,
          balanceDue: 6200,
          type: 'CREDIT',
          status: 'OVERDUE',
        },
      ],
    });

    // Seed Retail Inventory
    await prisma.inventoryItem.createMany({
      data: [
        {
          tenantId: retailTenant.id,
          name: 'Organic Basmati Rice 5kg',
          category: 'Groceries',
          sku: 'GRC-RCE-05',
          stock: 65,
          minStock: 20,
          unitPrice: '₹480',
          status: 'IN_STOCK',
        },
        {
          tenantId: retailTenant.id,
          name: 'Fortune Sunlite Sunflower Oil 1L',
          category: 'Cooking Oils',
          sku: 'OIL-SUN-01',
          stock: 12,
          minStock: 25,
          unitPrice: '₹145',
          status: 'LOW_STOCK',
        },
      ],
    });
    console.log('Seeded Khata and Inventory for Retail!');
  }

  // 4. Pharmacy Tenant
  const pharmacyTenant = await prisma.tenant.findFirst({
    where: { category: { slug: 'pharmacy' } },
  });

  if (pharmacyTenant) {
    console.log(`Found Pharmacy Tenant: ${pharmacyTenant.name} (${pharmacyTenant.id})`);
    // Seed Pharmacy Inventory
    await prisma.inventoryItem.createMany({
      data: [
        {
          tenantId: pharmacyTenant.id,
          name: 'Amoxicillin 500mg Capsules',
          category: 'Antibiotics',
          sku: 'MED-AMX-500',
          stock: 45,
          minStock: 50,
          unitPrice: '₹140',
          status: 'LOW_STOCK',
        },
        {
          tenantId: pharmacyTenant.id,
          name: 'Paracetamol 650mg (Dolo)',
          category: 'Analgesics',
          sku: 'MED-PCM-650',
          stock: 240,
          minStock: 60,
          unitPrice: '₹32',
          status: 'IN_STOCK',
        },
        {
          tenantId: pharmacyTenant.id,
          name: 'Azithromycin 500mg (Azee)',
          category: 'Antibiotics',
          sku: 'MED-AZT-500',
          stock: 15,
          minStock: 30,
          unitPrice: '₹125',
          status: 'LOW_STOCK',
        },
      ],
    });
    console.log('Seeded Inventory for Pharmacy!');
  }

  console.log('Module persistence seeding completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
