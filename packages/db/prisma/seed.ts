import { PrismaClient, SemesterEnum, DayOfWeek, ScheduleType } from '@prisma/client';

const prisma = new PrismaClient();

const bsAccountancySubjects = [
  {
    title: 'Intermediate Accounting 2 & 3',
    description: 'Detailed study of liabilities and equity.',
    sem: SemesterEnum.SECOND,
  },
  {
    title: 'Income Taxation',
    description: 'Detailed study of income tax for individuals and corporations.',
    sem: SemesterEnum.SECOND,
  },
  {
    title: 'Operations Management',
    description: 'Management of business operations and production.',
    sem: SemesterEnum.SECOND,
  },
  {
    title: 'Physical Education 4',
    description: 'Team sports and recreational activities.',
    sem: SemesterEnum.SECOND,
  },
  {
    title: 'Financial Management',
    description: 'Principles of managing financial resources.',
    sem: SemesterEnum.SECOND,
  },
  {
    title: 'Economic Development',
    description: 'Theories and policies of economic growth.',
    sem: SemesterEnum.SECOND,
  },
  {
    title: 'Business Laws & Regulations',
    description: 'Laws governing business organizations and transactions.',
    sem: SemesterEnum.SECOND,
  },
  {
    title: 'Human Behavior in Organization',
    description: 'Study of individual and group behavior in organizational settings.',
    sem: SemesterEnum.SECOND,
  },
  {
    title: 'IT Application Tools in Business',
    description: 'Use of IT tools for business efficiency.',
    sem: SemesterEnum.SECOND,
  },
];

const cpaleSubjects = [
  {
    title: 'Financial Accounting and Reporting',
    description: 'Fundamentals of accounting, conceptual framework, and standards.',
    code: 'FAR',
    sem: SemesterEnum.FIRST,
  },
  {
    title: 'Advanced Financial Accounting and Reporting',
    description: 'Specialized accounting problems, partnerships, corporations, etc.',
    code: 'AFAR',
    sem: SemesterEnum.FIRST,
  },
  {
    title: 'Management Advisory Services',
    description: 'Management accounting, financial management, and consultancy.',
    code: 'MAS',
    sem: SemesterEnum.FIRST,
  },
  {
    title: 'Auditing',
    description: 'Auditing theory and problems.',
    code: 'AUD',
    sem: SemesterEnum.SECOND,
  },
  {
    title: 'Regulatory Framework for Business Transactions',
    description: 'Business laws including obligations, contracts, and corporation code.',
    code: 'RFBT',
    sem: SemesterEnum.SECOND,
  },
  {
    title: 'Taxation',
    description: 'Income taxation, business taxes, and tax remedies.',
    code: 'TAX',
    sem: SemesterEnum.SECOND,
  },
];

const farTopics = [
  {
    title: 'Conceptual Framework',
    order: 1,
    children: [
      { title: 'Objectives of Financial Reporting', order: 1 },
      { title: 'Qualitative Characteristics', order: 2 },
      { title: 'Elements of Financial Statements', order: 3 },
    ],
  },
  {
    title: 'Presentation of Financial Statements',
    order: 2,
    children: [
      { title: 'Statement of Financial Position', order: 1 },
      { title: 'Statement of Comprehensive Income', order: 2 },
      { title: 'Statement of Changes in Equity', order: 3 },
      { title: 'Statement of Cash Flows', order: 4 },
    ],
  },
  {
    title: 'Assets',
    order: 3,
    children: [
      { title: 'Cash and Cash Equivalents', order: 1 },
      { title: 'Receivables', order: 2 },
      { title: 'Inventories', order: 3 },
      { title: 'Property, Plant and Equipment', order: 4 },
      { title: 'Intangible Assets', order: 5 },
    ],
  },
  {
    title: 'Liabilities',
    order: 4,
    children: [
      { title: 'Accounts Payable', order: 1 },
      { title: 'Provisions and Contingencies', order: 2 },
      { title: 'Bonds Payable', order: 3 },
    ],
  },
];

const afarTopics = [
  {
    title: 'Partnership Accounting',
    order: 1,
    children: [
      { title: 'Formation', order: 1 },
      { title: 'Operations', order: 2 },
      { title: 'Dissolution', order: 3 },
      { title: 'Liquidation', order: 4 },
    ],
  },
  {
    title: 'Corporate Liquidation',
    order: 2,
    children: [],
  },
  {
    title: 'Business Combinations (PFRS 3)',
    order: 3,
    children: [
      { title: 'Acquisition Method', order: 1 },
      { title: 'Goodwill Computation', order: 2 },
    ],
  },
  {
    title: 'Consolidated Financial Statements',
    order: 4,
    children: [
      { title: 'Date of Acquisition', order: 1 },
      { title: 'Subsequent to Acquisition', order: 2 },
      { title: 'Intercompany Transactions', order: 3 },
    ],
  },
  {
    title: 'Foreign Currency Transactions',
    order: 5,
    children: [
      { title: 'Forex Transactions', order: 1 },
      { title: 'Translation of FS', order: 2 },
    ],
  },
];

const masTopics = [
  {
    title: 'Management Accounting Foundations',
    order: 1,
    children: [
      { title: 'Cost Concepts and Classifications', order: 1 },
      { title: 'Cost Behavior Analysis', order: 2 },
    ],
  },
  {
    title: 'Cost-Volume-Profit Analysis',
    order: 2,
    children: [
      { title: 'Break-even Point', order: 1 },
      { title: 'Target Profit', order: 2 },
      { title: 'Operating Leverage', order: 3 },
    ],
  },
  {
    title: 'Standard Costing and Variance Analysis',
    order: 3,
    children: [
      { title: 'Direct Material Variances', order: 1 },
      { title: 'Direct Labor Variances', order: 2 },
      { title: 'Factory Overhead Variances', order: 3 },
    ],
  },
  {
    title: 'Budgeting',
    order: 4,
    children: [
      { title: 'Master Budget', order: 1 },
      { title: 'Flexible Budgeting', order: 2 },
    ],
  },
  {
    title: 'Financial Management',
    order: 5,
    children: [
      { title: 'Working Capital Management', order: 1 },
      { title: 'Capital Budgeting', order: 2 },
    ],
  },
];

const audTopics = [
  {
    title: 'Auditing Theory',
    order: 1,
    children: [
      { title: 'Professional Code of Ethics', order: 1 },
      { title: 'PSA Standards', order: 2 },
      { title: 'Internal Control', order: 3 },
      { title: 'Audit Evidence', order: 4 },
      { title: 'Audit Reports', order: 5 },
      { title: 'Quality Control (ISQC 1)', order: 6 },
      { title: 'CIS / IT Audit Environment', order: 7 },
    ],
  },
  {
    title: 'Auditing Problems',
    order: 2,
    children: [
      { title: 'Audit of Cash', order: 1 },
      { title: 'Audit of Receivables', order: 2 },
      { title: 'Audit of Inventories', order: 3 },
      { title: 'Audit of PPE', order: 4 },
      { title: 'Audit of Liabilities', order: 5 },
      { title: 'Audit of Equity', order: 6 },
    ],
  },
];

const rfbtTopics = [
  {
    title: 'Law on Obligations and Contracts',
    order: 1,
    children: [
      { title: 'Obligations', order: 1 },
      { title: 'Contracts', order: 2 },
      { title: 'Natural Obligations', order: 3 },
    ],
  },
  {
    title: 'Law on Sales, Agency, and Credit Transactions',
    order: 2,
    children: [
      { title: 'Contract of Sales', order: 1 },
      { title: 'Contract of Agency', order: 2 },
      { title: 'Pledge, Mortgage, and Antichresis', order: 3 },
    ],
  },
  {
    title: 'Revised Corporation Code',
    order: 3,
    children: [
      { title: 'Incorporation', order: 1 },
      { title: 'Board of Directors', order: 2 },
      { title: 'Stocks and Stockholders', order: 3 },
      { title: 'Dissolution and Liquidation', order: 4 },
      { title: 'Foreign Corporations', order: 5 },
      { title: 'One Person Corporation', order: 6 },
    ],
  },
  {
    title: 'Partnerships',
    order: 4,
    children: [
      { title: 'General Provisions', order: 1 },
      { title: 'Rights and Obligations of Partners', order: 2 },
      { title: 'Dissolution and Winding Up', order: 3 },
      { title: 'Limited Partnership', order: 4 },
    ],
  },
  {
    title: 'Banking and Anti-Money Laundering Laws',
    order: 5,
    children: [
      { title: 'Secrecy of Bank Deposits', order: 1 },
      { title: 'Unclaimed Balances Law', order: 2 },
      { title: 'Anti-Money Laundering Act (AMLA)', order: 3 },
      { title: 'PDIC Law', order: 4 },
    ],
  },
  {
    title: 'Special Laws',
    order: 6,
    children: [
      { title: 'Data Privacy Act', order: 1 },
      { title: 'E-Commerce Act', order: 2 },
      { title: 'Intellectual Property Code', order: 3 },
      { title: 'Financial Rehabilitation and Insolvency Act (FRIA)', order: 4 },
      { title: 'Philippine Competition Act', order: 5 },
      { title: 'Truth in Lending Act', order: 6 },
      { title: 'Cooperative Code', order: 7 },
      { title: 'Ease of Doing Business Act', order: 8 },
    ],
  },
];

const taxTopics = [
  {
    title: 'Income Taxation',
    order: 1,
    children: [
      { title: 'Individuals', order: 1 },
      { title: 'Corporations (CREATE Act updates)', order: 2 },
      { title: 'Partnerships', order: 3 },
      { title: 'Gross Income', order: 4 },
      { title: 'Allowable Deductions', order: 5 },
      { title: 'Filing of Returns and Payment', order: 6 },
    ],
  },
  {
    title: 'Business Taxes',
    order: 2,
    children: [
      { title: 'Value Added Tax (VAT)', order: 1 },
      { title: 'Percentage Taxes', order: 2 },
      { title: 'Excise Taxes', order: 3 },
      { title: 'Documentary Stamp Tax (DST)', order: 4 },
    ],
  },
  {
    title: 'Transfer Taxes',
    order: 3,
    children: [
      { title: 'Estate Tax', order: 1 },
      { title: 'Donor\'s Tax', order: 2 },
    ],
  },
  {
    title: 'Tax Remedies',
    order: 4,
    children: [
      { title: 'Assessment and Collection', order: 1 },
      { title: 'Civil and Criminal Penalties', order: 2 },
      { title: 'Judicial Remedies (CTA)', order: 3 },
    ],
  },
  {
    title: 'Local Taxation and Real Property Tax',
    order: 5,
    children: [
      { title: 'Local Government Taxation', order: 1 },
      { title: 'Real Property Taxation', order: 2 },
    ],
  },
  {
    title: 'Preferential Taxation',
    order: 6,
    children: [
      { title: 'Senior Citizens & PWDs', order: 1 },
      { title: 'BMBE Law', order: 2 },
      { title: 'PEZA / BOI Incentives', order: 3 },
    ],
  },
];

const topicMaps: Record<string, typeof farTopics> = {
  FAR: farTopics,
  AFAR: afarTopics,
  MAS: masTopics,
  AUD: audTopics,
  RFBT: rfbtTopics,
  TAX: taxTopics,
};

async function main() {
  console.log('Start seeding CPALE syllabus...');

  for (const subjectData of cpaleSubjects) {
    // Check if subject exists (by title, since we don't have code in schema yet)
    // Assuming unique titles for system subjects
    const existing = await prisma.subject.findFirst({
      where: {
        title: subjectData.title,
        userId: null,
      },
    });

    let subjectId = existing?.id;

    if (!existing) {
      const subject = await prisma.subject.create({
        data: {
          title: subjectData.title,
          description: subjectData.description,
          userId: null, // System subject
          isEnrolled: false, // Default
          sem: subjectData.sem,
        },
      });
      subjectId = subject.id;
      console.log(`Created subject: ${subject.title} (${subjectData.sem} Semester)`);
    } else {
      console.log(`Subject "${subjectData.title}" exists. Updating semester and topics...`);
      const subject = await prisma.subject.update({
        where: { id: existing.id },
        data: {
          sem: subjectData.sem,
        },
      });
      subjectId = subject.id;
    }

    if (subjectId) {
      const topics = topicMaps[subjectData.code];
      if (topics) {
        for (const topicData of topics) {
          // Check if root topic exists
          let parentTopic = await prisma.topic.findFirst({
            where: {
              subjectId: subjectId,
              title: topicData.title,
              parentId: null
            }
          });

          if (!parentTopic) {
             parentTopic = await prisma.topic.create({
              data: {
                title: topicData.title,
                order: topicData.order,
                subjectId: subjectId,
              },
            });
          }

          if (topicData.children) {
            for (const childData of topicData.children) {
              const existingChild = await prisma.topic.findFirst({
                where: {
                  subjectId: subjectId,
                  parentId: parentTopic.id,
                  title: childData.title
                }
              });

              if (!existingChild) {
                await prisma.topic.create({
                  data: {
                    title: childData.title,
                    order: childData.order,
                    subjectId: subjectId,
                    parentId: parentTopic.id,
                  },
                });
              }
            }
          }
        }
        console.log(`Seeded/Updated topics for ${subjectData.title}`);
      }
    }
  }

  console.log('Seeding BS Accountancy Subjects...');
  for (const subjectData of bsAccountancySubjects) {
     const existing = await prisma.subject.findFirst({
      where: {
        title: subjectData.title,
        userId: null,
      },
    });

    if (!existing) {
      await prisma.subject.create({
        data: {
          title: subjectData.title,
          description: subjectData.description,
          userId: null,
          isEnrolled: true,
          sem: subjectData.sem,
        },
      });
      console.log(`Created subject: ${subjectData.title}`);
    }
  }

  const users = await prisma.user.findMany();
  console.log(`Processing subjects and schedules for ${users.length} users...`);

  // Define subjects by semester for seeding user enrollments
  const firstSemSubjects = cpaleSubjects.filter(s => s.sem === SemesterEnum.FIRST);
  const secondSemSubjects = [...bsAccountancySubjects, ...cpaleSubjects.filter(s => s.sem === SemesterEnum.SECOND)];

  for (const user of users) {
    // 1. Seed Subjects for User
    // For demo/all users, let's enroll them in the 2nd semester BS Accountancy subjects
    // since that matches the current class schedule context
    for (const subjectData of bsAccountancySubjects) {
      const subject = await prisma.subject.findFirst({
        where: { title: subjectData.title, userId: null }
      });
      
      if (subject) {
        // Create user-specific instance of the subject if not exists (enrollment)
        // OR simply link progress if your schema supports direct linking.
        // Based on schema, Subject has userId? meaning users can have their own copies/instances
        // OR we can use the system subjects.
        // Let's create a copy for the user so they can track their own progress/tasks
        const userSubject = await prisma.subject.findFirst({
            where: {
                title: subject.title,
                userId: user.id
            }
        });

        if (!userSubject) {
            await prisma.subject.create({
                data: {
                    title: subject.title,
                    description: subject.description,
                    userId: user.id,
                    sem: subject.sem,
                    isEnrolled: true
                }
            });
        }
      }
    }

    // 2. Seed Class Schedule
    const scheduleData = [
      // MONDAY
      { day: DayOfWeek.MONDAY, startTime: '07:30', endTime: '10:30', subject: 'Intermediate Accounting 2 & 3', type: ScheduleType.CLASS },
      { day: DayOfWeek.MONDAY, startTime: '10:30', endTime: '12:00', subject: 'Income Taxation', type: ScheduleType.CLASS },
      { day: DayOfWeek.MONDAY, startTime: '13:30', endTime: '15:00', subject: 'Operations Management', type: ScheduleType.CLASS },
      { day: DayOfWeek.MONDAY, startTime: '15:30', endTime: '17:30', subject: 'Physical Education 4', type: ScheduleType.CLASS },
      // TUESDAY
      { day: DayOfWeek.TUESDAY, startTime: '13:30', endTime: '15:00', subject: 'Financial Management', type: ScheduleType.CLASS },
      { day: DayOfWeek.TUESDAY, startTime: '15:00', endTime: '16:30', subject: 'Economic Development', type: ScheduleType.CLASS },
      { day: DayOfWeek.TUESDAY, startTime: '16:30', endTime: '18:00', subject: 'Business Laws & Regulations', type: ScheduleType.CLASS },
      { day: DayOfWeek.TUESDAY, startTime: '18:00', endTime: '19:30', subject: 'Human Behavior in Organization', type: ScheduleType.CLASS },
      // WEDNESDAY
      { day: DayOfWeek.WEDNESDAY, startTime: '18:00', endTime: '21:00', subject: 'IT Application Tools in Business', type: ScheduleType.CLASS },
      // THURSDAY
      { day: DayOfWeek.THURSDAY, startTime: '07:30', endTime: '10:30', subject: 'Intermediate Accounting 2 & 3', type: ScheduleType.CLASS },
      { day: DayOfWeek.THURSDAY, startTime: '10:30', endTime: '12:00', subject: 'Income Taxation', type: ScheduleType.CLASS },
      { day: DayOfWeek.THURSDAY, startTime: '13:30', endTime: '15:00', subject: 'Operations Management', type: ScheduleType.CLASS },
      // FRIDAY
      { day: DayOfWeek.FRIDAY, startTime: '13:30', endTime: '15:00', subject: 'Financial Management', type: ScheduleType.CLASS },
      { day: DayOfWeek.FRIDAY, startTime: '15:00', endTime: '16:30', subject: 'Economic Development', type: ScheduleType.CLASS },
      { day: DayOfWeek.FRIDAY, startTime: '16:30', endTime: '18:00', subject: 'Business Laws & Regulations', type: ScheduleType.CLASS },
      { day: DayOfWeek.FRIDAY, startTime: '18:00', endTime: '19:30', subject: 'Human Behavior in Organization', type: ScheduleType.CLASS },
      // REVIEW SESSIONS
      { day: DayOfWeek.MONDAY, startTime: '18:00', endTime: '20:00', subject: null, type: ScheduleType.REVIEW_SESSION },
      { day: DayOfWeek.TUESDAY, startTime: '10:30', endTime: '12:30', subject: null, type: ScheduleType.REVIEW_SESSION },
      { day: DayOfWeek.WEDNESDAY, startTime: '15:00', endTime: '17:00', subject: null, type: ScheduleType.REVIEW_SESSION },
      { day: DayOfWeek.THURSDAY, startTime: '15:30', endTime: '17:30', subject: null, type: ScheduleType.REVIEW_SESSION },
      { day: DayOfWeek.FRIDAY, startTime: '10:30', endTime: '12:30', subject: null, type: ScheduleType.REVIEW_SESSION },
    ];

    for (const item of scheduleData) {
      let subjectId: number | null = null;
      if (item.subject) {
        // Try to link to the user's specific subject copy first
        let sub = await prisma.subject.findFirst({
          where: {
            title: { contains: item.subject },
            userId: user.id
          }
        });
        
        // Fallback to system subject if user copy doesn't exist (though we just created them above)
        if (!sub) {
             sub = await prisma.subject.findFirst({
                where: {
                    title: { contains: item.subject },
                    userId: null
                }
            });
        }
        subjectId = sub?.id || null;
      }

      const exists = await prisma.classSchedule.findFirst({
        where: {
          userId: user.id,
          dayOfWeek: item.day,
          startTime: item.startTime,
        }
      });

      if (!exists) {
        await prisma.classSchedule.create({
          data: {
            userId: user.id,
            subjectId: subjectId,
            dayOfWeek: item.day,
            startTime: item.startTime,
            endTime: item.endTime,
            type: item.type,
            room: item.type === ScheduleType.CLASS ? 'Room 301' : 'Library',
          }
        });
      }
    }
  }

  console.log('Seeding finished.');
}


main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
