import { z } from 'zod';

export const reportCardSchema = z.object({
  studentName: z.string().min(1, 'Student name is required'),
  grades: z.array(
    z.object({
      subject: z.string().min(1, 'Subject is required'),
      score: z.number().min(0, 'Score must be positive'),
      maxScore: z.number().min(0, 'Max score must be positive'),
      term: z.string().min(1, 'Term is required'),
    })
  ).min(1, 'At least one grade is required'),
});

export type ReportCardInput = z.infer<typeof reportCardSchema>;
