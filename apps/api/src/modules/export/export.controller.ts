import {
  Body,
  Controller,
  Header,
  HttpException,
  HttpStatus,
  Post,
  Res,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { Parser } from 'json2csv';
import * as puppeteer from 'puppeteer';
import { CalculationRequestDto } from '../calculation/dto/calculation.dto';
import { CalculationService } from '../calculation/services/calculation.service';
import { rad2deg } from '@lab/shared';

// === Интерфейсы (оставляем как есть) ===
interface Harmonic {
  n: number;
  k: number;
  value?: number;
}

interface Constants {
  mu: number;
  r0: number;
  harmonics: Harmonic[];
}

interface Summary {
  minAcceleration: number;
  maxAcceleration: number;
  avgAcceleration: number;
  period: number;
}

interface Point {
  index: number;
  height: number;
  phi: number;
  lambda: number;
  r: number;
  theta: number;
  acceleration: {
    S: number;
    T: number;
    W: number;
    total: number;
  };
  newtonAcceleration: number;
  accelerationJ2Only?: {
    total: number;
  };
}

interface CalculationResult {
  data: {
    points: Point[];
    summary: Summary;
    constants: Constants;
  };
}

@ApiTags('export')
@Controller('export')
export class ExportController {
  constructor(private readonly calc: CalculationService) {}

  @Post('csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  exportCsv(@Body() body: CalculationRequestDto, @Res() res: Response) {
    try {
      const result = this.calc.calculate(body);
      const rows = result.data.points.map((p) => ({
        index: p.index,
        height_km: p.height.toFixed(3),
        phi_deg: rad2deg(p.phi).toFixed(4),
        lambda_deg: rad2deg(p.lambda).toFixed(4),
        r_km: p.r.toFixed(3),
        true_anomaly_deg: rad2deg(p.theta).toFixed(2),
        S_ms2: p.acceleration.S.toExponential(6),
        T_ms2: p.acceleration.T.toExponential(6),
        W_ms2: p.acceleration.W.toExponential(6),
        total_ms2: p.acceleration.total.toExponential(6),
        newton_ms2: p.newtonAcceleration.toExponential(6),
        ...(p.accelerationJ2Only && {
          total_J2_ms2: p.accelerationJ2Only.total.toExponential(6),
        }),
      }));

      const parser = new Parser({
        withBOM: true,
        delimiter: ';',
      });
      const csv = parser.parse(rows);

      res.setHeader(
        'Content-Disposition',
        'attachment; filename="geopotential_report.csv"',
      );
      res.send(csv);
    } catch (error) {
      throw new HttpException(
        'Failed to generate CSV: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('pdf')
  @Header('Content-Type', 'application/pdf')
  async exportPdf(@Body() body: CalculationRequestDto, @Res() res: Response) {
    let browser: puppeteer.Browser | undefined;

    try {
      const result: CalculationResult = this.calc.calculate(body);
      const html = this.generateHtml(body, result);

      // Запускаем браузер (в Docker используем системный Chromium, путь передаём через переменную окружения)
      browser = await puppeteer.launch({
        headless: true,
        executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
        ],
      });

      const page = await browser.newPage();

      // ✅ Убираем encoding - он не нужен
      await page.setContent(html, {
        waitUntil: 'networkidle0',
      });

      // ✅ Генерируем PDF (возвращает Uint8Array)
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: {
          top: '60px',
          bottom: '60px',
          left: '40px',
          right: '40px',
        },
        displayHeaderFooter: false,
      });

      // ✅ Конвертируем Uint8Array в Buffer
      const buffer = Buffer.from(pdfBuffer);

      // Настраиваем заголовки ответа
      res.setHeader(
        'Content-Disposition',
        'attachment; filename="geopotential_report.pdf"',
      );
      res.setHeader('Content-Length', buffer.length);

      res.send(buffer);
    } catch (error) {
      console.error('PDF Generation Error:', error);
      throw new HttpException(
        'Failed to generate PDF: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      // Закрываем браузер
      if (browser) {
        await browser.close().catch(() => {});
      }
    }
  }

  private generateHtml(
    body: CalculationRequestDto,
    result: CalculationResult,
  ): string {
    const { orbit, options } = body;
    const { points, summary, constants } = result.data;
    const includeJ2Only = options?.includeJ2Only || false;

    return `
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Лабораторная работа №1</title>
        <style>
          @page { size: A4; margin: 60px 40px; }
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 11pt;
            line-height: 1.5;
            color: #000;
          }
          .title-page { text-align: center; margin-bottom: 40px; }
          .title-page h1 { font-size: 16pt; font-weight: bold; margin-bottom: 10px; }
          .title-page .subtitle { font-size: 14pt; margin: 20px 0; }
          .title-page .date { text-align: right; margin-top: 60px; }
          h2 { font-size: 14pt; font-weight: bold; margin: 25px 0 10px 0; }
          h3 { font-size: 12pt; font-weight: bold; margin: 15px 0 8px 0; }
          ul { margin: 10px 0; padding-left: 25px; }
          li { margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; font-size: 9pt; margin: 15px 0; }
          th, td { border: 1px solid #000; padding: 4px 6px; text-align: center; }
          th { background-color: #e0e0e0; font-weight: bold; }
          tr:nth-child(even) { background-color: #f5f5f5; }
          .conclusions { text-align: justify; margin: 15px 0; }
          .page-break { page-break-before: always; }
        </style>
      </head>
      <body>
        <!-- ТИТУЛЬНЫЙ ЛИСТ -->
        <div class="title-page">
          <h1>Лабораторная работа №1</h1>
          <div class="subtitle">
            <p>Определение возмущающего ускорения, обусловленного влиянием</p>
            <p>нецентральности гравитационного поля Земли</p>
          </div>
          <div class="date">
            <p>Дата отчёта: ${new Date().toLocaleString('ru-RU')}</p>
          </div>
        </div>

        <!-- 1. ИСХОДНЫЕ ДАННЫЕ -->
        <h2>1. Исходные данные</h2>
        <ul>
          <li>Большая полуось a = ${orbit.a} км</li>
          <li>Эксцентриситет e = ${orbit.e}</li>
          <li>Наклонение i = ${orbit.i}°</li>
          <li>Долгота восходящего узла Ω = ${orbit.Omega}°</li>
          <li>Аргумент перицентра ω = ${orbit.omega}°</li>
          <li>Средняя аномалия M = ${orbit.M}°</li>
        </ul>

        ${
          options
            ? `
        <h3>Параметры расчёта:</h3>
        <ul>
          <li>Количество точек: ${options.pointsCount || 100}</li>
          <li>Максимальная степень n: ${options.maxHarmonicN || 4}</li>
          <li>Максимальный порядок k: ${options.maxHarmonicK || 3}</li>
          <li>Система координат: ${options.coordinateSystem || 'ECI'}</li>
          <li>Время t: ${options.tSeconds || 0} с</li>
          <li>Учёт только J₂: ${options.includeJ2Only ? 'да' : 'нет'}</li>
        </ul>`
            : ''
        }

        <!-- 2. КОНСТАНТЫ -->
        <h2>2. Используемые константы</h2>
        <ul>
          <li>Гравитационный параметр μ = ${constants.mu} км³/с²</li>
          <li>Экваториальный радиус r₀ = ${constants.r0} км</li>
          <li>Период обращения T = ${(summary.period / 60).toFixed(2)} мин (${summary.period.toFixed(1)} с)</li>
        </ul>

        <h3>Учтённые гармоники:</h3>
        <p style="font-size: 10pt; margin: 5px 0;">
          ${constants.harmonics
            .map((h: Harmonic) =>
              h.k === 0 ? `J₍${h.n}₎` : `C₍${h.n},${h.k}₎, S₍${h.n},${h.k}₎`,
            )
            .join(', ')}
        </p>

        <!-- 3. СТАТИСТИКА -->
        <h2>3. Сводная статистика</h2>
        <ul>
          <li>Минимальное возмущающее ускорение: ${summary.minAcceleration.toExponential(6)} м/с²</li>
          <li>Максимальное возмущающее ускорение: ${summary.maxAcceleration.toExponential(6)} м/с²</li>
          <li>Среднее возмущающее ускорение: ${summary.avgAcceleration.toExponential(6)} м/с²</li>
        </ul>

        <!-- 4. ТАБЛИЦА -->
        <h2>4. Результаты расчёта по точкам</h2>
        <table>
          <thead>
            <tr>
              <th>№</th><th>h, км</th><th>φ, °</th><th>λ, °</th>
              <th>S, м/с²</th><th>T, м/с²</th><th>W, м/с²</th>
              <th>|a|, м/с²</th><th>|a|/aн</th>
              ${includeJ2Only ? '<th>|a| J₂, м/с²</th>' : ''}
            </tr>
          </thead>
          <tbody>
            ${points
              .map(
                (p, idx) => `
              <tr>
                <td>${idx}</td>
                <td>${p.height.toFixed(1)}</td>
                <td>${rad2deg(p.phi).toFixed(2)}</td>
                <td>${rad2deg(p.lambda).toFixed(2)}</td>
                <td>${p.acceleration.S.toExponential(2)}</td>
                <td>${p.acceleration.T.toExponential(2)}</td>
                <td>${p.acceleration.W.toExponential(2)}</td>
                <td>${p.acceleration.total.toExponential(2)}</td>
                <td>${(p.acceleration.total / p.newtonAcceleration).toExponential(2)}</td>
                ${includeJ2Only && p.accelerationJ2Only ? `<td>${p.accelerationJ2Only.total.toExponential(2)}</td>` : ''}
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>

        <!-- 5. ВЫВОДЫ -->
        <h2>5. Выводы</h2>
        <div class="conclusions">
          <p>В результате выполнения работы было рассчитано возмущающее ускорение для ${points.length} точек орбиты.</p>
          <p>Минимальное значение ускорения составило ${summary.minAcceleration.toExponential(2)} м/с², максимальное – ${summary.maxAcceleration.toExponential(2)} м/с², среднее – ${summary.avgAcceleration.toExponential(2)} м/с².</p>
          ${
            includeJ2Only
              ? `
          <p>При учёте только гармоники J2 среднее ускорение составляет ${(
            points.reduce(
              (acc, p) => acc + (p.accelerationJ2Only?.total || 0),
              0,
            ) / points.length
          ).toExponential(2)} м/с².</p>`
              : ''
          }
          <p>Полученные результаты соответствуют теоретическим ожиданиям и подтверждают влияние нецентральности гравитационного поля Земли на движение спутника.</p>
        </div>
      </body>
      </html>
    `;
  }
}
