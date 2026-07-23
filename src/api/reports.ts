import { Router } from 'express';
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { validate } from '../middleware/validation';
import { reportCardSchema } from '../validators/reportCard';

const router = Router();

router.post('/report-card', validate(reportCardSchema), async (req, res) => {
  const { studentName, grades } = req.body;

  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([600, 400]);
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    page.drawText('NEXUSEDU REPORT CARD', { x: 50, y: 350, size: 24, font, color: rgb(0, 0, 0) });
    page.drawText(`Student: ${studentName}`, { x: 50, y: 310, size: 14 });
    
    let yOffset = 270;
    grades.forEach((g) => {
      page.drawText(`${g.subject}: ${g.score}/${g.maxScore} (${g.term})`, { x: 50, y: yOffset, size: 12 });
      yOffset -= 20;
    });

    const pdfBytes = await pdfDoc.save();
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=report_${studentName}.pdf`);
    res.send(Buffer.from(pdfBytes));
  } catch (err) {
    console.error('Error generating report card:', err);
    res.status(500).json({ error: 'Failed to generate report card' });
  }
});

export default router;
