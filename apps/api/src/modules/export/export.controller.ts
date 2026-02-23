import { Body, Controller, Header, Post, Res } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import PDFDocument from 'pdfkit';
import { Parser as Json2CsvParser } from 'json2csv';
import { CalculationRequestDto } from '../calculation/dto/calculation.dto';
import { CalculationService } from '../calculation/services/calculation.service';

@ApiTags('export')
@Controller('export')
export class ExportController {
  constructor(private readonly calc: CalculationService) {}

  @Post('csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  async exportCsv(@Body() body: CalculationRequestDto, @Res() res: Response) {
    const result = this.calc.calculate(body);
    const rows = result.data.points.map((p) => ({
      index: p.index,
      height_km: p.height,
      phi_rad: p.phi,
      lambda_rad: p.lambda,
      S_ms2: p.acceleration.S,
      T_ms2: p.acceleration.T,
      W_ms2: p.acceleration.W,
      total_ms2: p.acceleration.total,
      newton_ms2: p.newtonAcceleration,
    }));

    const parser = new Json2CsvParser({ withBOM: true });
    const csv = parser.parse(rows);

    res.setHeader('Content-Disposition', 'attachment; filename="report.csv"');
    res.send(csv);
  }

  @Post('pdf')
  @Header('Content-Type', 'application/pdf')
  async exportPdf(@Body() body: CalculationRequestDto, @Res() res: Response) {
    const result = this.calc.calculate(body);
    res.setHeader('Content-Disposition', 'attachment; filename="report.pdf"');

    const doc = new PDFDocument({ margin: 40 });
    doc.pipe(res);

    doc.fontSize(16).text('Lab 1 — Geopotential perturbation report', { align: 'left' });
    doc.moveDown();

    doc.fontSize(12).text('Input orbital elements:');
    doc.fontSize(10).text(JSON.stringify(body.orbit, null, 2));
    doc.moveDown();

    doc.fontSize(12).text('Summary:');
    doc.fontSize(10).text(JSON.stringify(result.data.summary, null, 2));
    doc.moveDown();

    doc.fontSize(12).text('First 10 points:');
    doc.moveDown(0.5);
    const head = result.data.points.slice(0, 10);
    head.forEach((p) => {
      doc
        .fontSize(9)
        .text(
          `#${p.index} h=${p.height.toFixed(3)} km, total=${p.acceleration.total.toExponential(
            6,
          )} m/s^2`,
        );
    });

    doc.end();
  }
}

