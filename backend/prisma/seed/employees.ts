import type { PrismaClient, Pod, Employee } from '@prisma/client';

export async function seedEmployees(prisma: PrismaClient) {
  const podData = [
    { name: 'Alpha Pod' },
    { name: 'Beta Pod' },
    { name: 'Gamma Pod' },
    { name: 'Delta Pod' },
  ];

  const pods = await Promise.all(
    podData.map((pod) => prisma.pod.create({ data: pod }))
  );

  const employeeData = [
    // Alpha Pod - 8 employees
    {
      code: 'EMP001',
      name: 'Priya Sharma',
      email: 'priya.sharma@smartroster.com',
      podId: pods[0].id,
      role: 'POD_LEAD' as const,
      maxConsecutiveWorkDays: 6,
    },
    {
      code: 'EMP002',
      name: 'Rajesh Kumar',
      email: 'rajesh.kumar@smartroster.com',
      podId: pods[0].id,
      role: 'EMPLOYEE' as const,
      maxConsecutiveWorkDays: 6,
    },
    {
      code: 'EMP003',
      name: 'Anjali Patel',
      email: 'anjali.patel@smartroster.com',
      podId: pods[0].id,
      role: 'EMPLOYEE' as const,
      maxConsecutiveWorkDays: 6,
    },
    {
      code: 'EMP004',
      name: 'Vikram Singh',
      email: 'vikram.singh@smartroster.com',
      podId: pods[0].id,
      role: 'EMPLOYEE' as const,
      maxConsecutiveWorkDays: 6,
    },
    {
      code: 'EMP005',
      name: 'Neha Gupta',
      email: 'neha.gupta@smartroster.com',
      podId: pods[0].id,
      role: 'EMPLOYEE' as const,
      maxConsecutiveWorkDays: 6,
    },
    {
      code: 'EMP006',
      name: 'Amit Joshi',
      email: 'amit.joshi@smartroster.com',
      podId: pods[0].id,
      role: 'EMPLOYEE' as const,
      maxConsecutiveWorkDays: 6,
    },
    {
      code: 'EMP007',
      name: 'Kavita Reddy',
      email: 'kavita.reddy@smartroster.com',
      podId: pods[0].id,
      role: 'EMPLOYEE' as const,
      maxConsecutiveWorkDays: 6,
    },
    {
      code: 'EMP008',
      name: 'Suresh Nair',
      email: 'suresh.nair@smartroster.com',
      podId: pods[0].id,
      role: 'EMPLOYEE' as const,
      maxConsecutiveWorkDays: 6,
    },
    // Beta Pod - 8 employees
    {
      code: 'EMP009',
      name: 'Deepa Iyer',
      email: 'deepa.iyer@smartroster.com',
      podId: pods[1].id,
      role: 'POD_LEAD' as const,
      maxConsecutiveWorkDays: 6,
    },
    {
      code: 'EMP010',
      name: 'Karan Mehta',
      email: 'karan.mehta@smartroster.com',
      podId: pods[1].id,
      role: 'EMPLOYEE' as const,
      maxConsecutiveWorkDays: 6,
    },
    {
      code: 'EMP011',
      name: 'Pooja Desai',
      email: 'pooja.desai@smartroster.com',
      podId: pods[1].id,
      role: 'EMPLOYEE' as const,
      maxConsecutiveWorkDays: 6,
    },
    {
      code: 'EMP012',
      name: 'Ravi Kapoor',
      email: 'ravi.kapoor@smartroster.com',
      podId: pods[1].id,
      role: 'EMPLOYEE' as const,
      maxConsecutiveWorkDays: 6,
    },
    {
      code: 'EMP013',
      name: 'Sneha Verma',
      email: 'sneha.verma@smartroster.com',
      podId: pods[1].id,
      role: 'EMPLOYEE' as const,
      maxConsecutiveWorkDays: 6,
    },
    {
      code: 'EMP014',
      name: 'Aditya Rao',
      email: 'aditya.rao@smartroster.com',
      podId: pods[1].id,
      role: 'EMPLOYEE' as const,
      maxConsecutiveWorkDays: 6,
    },
    {
      code: 'EMP015',
      name: 'Meera Pillai',
      email: 'meera.pillai@smartroster.com',
      podId: pods[1].id,
      role: 'EMPLOYEE' as const,
      maxConsecutiveWorkDays: 6,
    },
    {
      code: 'EMP016',
      name: 'Sanjay Bhatt',
      email: 'sanjay.bhatt@smartroster.com',
      podId: pods[1].id,
      role: 'EMPLOYEE' as const,
      maxConsecutiveWorkDays: 6,
    },
    // Gamma Pod - 8 employees
    {
      code: 'EMP017',
      name: 'Lakshmi Krishnan',
      email: 'lakshmi.krishnan@smartroster.com',
      podId: pods[2].id,
      role: 'POD_LEAD' as const,
      maxConsecutiveWorkDays: 6,
    },
    {
      code: 'EMP018',
      name: 'Arjun Malhotra',
      email: 'arjun.malhotra@smartroster.com',
      podId: pods[2].id,
      role: 'EMPLOYEE' as const,
      maxConsecutiveWorkDays: 6,
    },
    {
      code: 'EMP019',
      name: 'Divya Srinivas',
      email: 'divya.srinivas@smartroster.com',
      podId: pods[2].id,
      role: 'EMPLOYEE' as const,
      maxConsecutiveWorkDays: 6,
    },
    {
      code: 'EMP020',
      name: 'Manish Agarwal',
      email: 'manish.agarwal@smartroster.com',
      podId: pods[2].id,
      role: 'EMPLOYEE' as const,
      maxConsecutiveWorkDays: 6,
    },
    {
      code: 'EMP021',
      name: 'Ritu Saxena',
      email: 'ritu.saxena@smartroster.com',
      podId: pods[2].id,
      role: 'EMPLOYEE' as const,
      maxConsecutiveWorkDays: 6,
    },
    {
      code: 'EMP022',
      name: 'Nikhil Chopra',
      email: 'nikhil.chopra@smartroster.com',
      podId: pods[2].id,
      role: 'EMPLOYEE' as const,
      maxConsecutiveWorkDays: 6,
    },
    {
      code: 'EMP023',
      name: 'Tanvi Shah',
      email: 'tanvi.shah@smartroster.com',
      podId: pods[2].id,
      role: 'EMPLOYEE' as const,
      maxConsecutiveWorkDays: 6,
    },
    {
      code: 'EMP024',
      name: 'Rohit Pandey',
      email: 'rohit.pandey@smartroster.com',
      podId: pods[2].id,
      role: 'EMPLOYEE' as const,
      maxConsecutiveWorkDays: 6,
    },
    // Delta Pod - 8 employees
    {
      code: 'EMP025',
      name: 'Swati Menon',
      email: 'swati.menon@smartroster.com',
      podId: pods[3].id,
      role: 'POD_LEAD' as const,
      maxConsecutiveWorkDays: 6,
    },
    {
      code: 'EMP026',
      name: 'Gaurav Bhatia',
      email: 'gaurav.bhatia@smartroster.com',
      podId: pods[3].id,
      role: 'EMPLOYEE' as const,
      maxConsecutiveWorkDays: 6,
    },
    {
      code: 'EMP027',
      name: 'Nisha Kulkarni',
      email: 'nisha.kulkarni@smartroster.com',
      podId: pods[3].id,
      role: 'EMPLOYEE' as const,
      maxConsecutiveWorkDays: 6,
    },
    {
      code: 'EMP028',
      name: 'Abhishek Mishra',
      email: 'abhishek.mishra@smartroster.com',
      podId: pods[3].id,
      role: 'EMPLOYEE' as const,
      maxConsecutiveWorkDays: 6,
    },
    {
      code: 'EMP029',
      name: 'Preeti Ghosh',
      email: 'preeti.ghosh@smartroster.com',
      podId: pods[3].id,
      role: 'EMPLOYEE' as const,
      maxConsecutiveWorkDays: 6,
    },
    {
      code: 'EMP030',
      name: 'Varun Sinha',
      email: 'varun.sinha@smartroster.com',
      podId: pods[3].id,
      role: 'EMPLOYEE' as const,
      maxConsecutiveWorkDays: 6,
    },
    {
      code: 'EMP031',
      name: 'Radhika Jain',
      email: 'radhika.jain@smartroster.com',
      podId: pods[3].id,
      role: 'EMPLOYEE' as const,
      maxConsecutiveWorkDays: 6,
    },
    {
      code: 'EMP032',
      name: 'Sachin Tiwari',
      email: 'sachin.tiwari@smartroster.com',
      podId: pods[3].id,
      role: 'EMPLOYEE' as const,
      maxConsecutiveWorkDays: 6,
    },
  ];

  // Create employees sequentially to avoid connection pool limits
  const employees = [];
  for (const emp of employeeData) {
    const created = await prisma.employee.create({ data: emp });
    employees.push(created);
  }

  await prisma.pod.update({
    where: { id: pods[0].id },
    data: { leadEmployeeId: employees[0].id },
  });
  await prisma.pod.update({
    where: { id: pods[1].id },
    data: { leadEmployeeId: employees[8].id },
  });
  await prisma.pod.update({
    where: { id: pods[2].id },
    data: { leadEmployeeId: employees[16].id },
  });
  await prisma.pod.update({
    where: { id: pods[3].id },
    data: { leadEmployeeId: employees[24].id },
  });

  return { pods, employees };
}
