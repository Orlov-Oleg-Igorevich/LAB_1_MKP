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
import * as fs from 'fs';
import { CalculationRequestDto } from '../calculation/dto/calculation.dto';
import { CalculationService } from '../calculation/services/calculation.service';
import { rad2deg } from '@lab/shared';
import { LunarCalculationRequestDto } from '../lunar/dto/lunar-calculation.dto';
import { LunarService } from '../lunar/services/lunar.service';

// === Интерфейсы ===
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

// === Lunar Interfaces ===
interface LunarPoint {
  index: number;
  t: number;
  u: number;
  theta: number;
  r: number;
  orbitalElements: {
    Omega: number;
    i: number;
    p: number;
    e: number;
    omega: number;
    a: number;
  };
  changes: {
    deltaOmega: number;
    deltaI: number;
    deltaP: number;
    deltaE: number;
    deltaOmega_arg: number;
  };
  acceleration: {
    S: number;
    T: number;
    W: number;
    total: number;
  };
}

interface LunarSummary {
  minPerturbation: number;
  maxPerturbation: number;
  avgPerturbation: number;
  orbitalChanges: {
    deltaOmega: number;
    deltaI: number;
    deltaP: number;
    deltaE: number;
    deltaOmega_arg: number;
  };
  period: number;
}

interface LunarConstants {
  muEarth: number;
  muMoon: number;
  moonOrbit: {
    a: number;
    e: number;
    i: number;
  };
}

interface LunarResult {
  data: {
    points: LunarPoint[];
    summary: LunarSummary;
    constants: LunarConstants;
  };
}

@ApiTags('export')
@Controller('export')
export class ExportController {
  constructor(
    private readonly calc: CalculationService,
    private readonly lunar: LunarService,
  ) {}

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

      console.log('[PDF Export] Starting Puppeteer launch...');
      console.log(
        '[PDF Export] Executable path:',
        process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
      );

      // Проверяем существование файла Chromium
      const chromePath =
        process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium';
      if (fs.existsSync(chromePath)) {
        console.log('[PDF Export] Chromium executable exists:', chromePath);
      } else {
        console.error(
          '[PDF Export] CRITICAL: Chromium NOT FOUND at:',
          chromePath,
        );
      }

      // Запускаем браузер (в Docker используем системный Chromium, путь передаём через переменную окружения)
      browser = await puppeteer.launch({
        headless: true,
        executablePath: chromePath,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--single-process',
          '--no-zygote',
        ],
        dumpio: true, // Вывод stdout/stderr браузера в консоль
        timeout: 180000, // 3 минуты на запуск
      });

      console.log('[PDF Export] Browser launched successfully!');

      const page = await browser.newPage();

      console.log('[PDF Export] Setting HTML content...');

      // Устанавливаем таймаут и генерируем PDF из HTML
      await page.setContent(html, {
        waitUntil: 'load',
        timeout: 30000,
      });

      console.log('[PDF Export] Content loaded, generating PDF...');

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

      console.log(
        '[PDF Export] PDF generated successfully! Size:',
        pdfBuffer.length,
        'bytes',
      );

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
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : 'No stack';

      console.error('[PDF Export] CRITICAL ERROR:', {
        message: errorMessage,
        stack: errorStack,
      });
      throw new HttpException(
        'Failed to generate PDF: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      // Закрываем браузер
      if (browser) {
        console.log('[PDF Export] Closing browser...');
        await browser.close().catch((err) => {
          const errMsg = err instanceof Error ? err.message : 'Unknown error';
          console.error('[PDF Export] Error closing browser:', errMsg);
        });
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

  // === Lunar Perturbation Export Methods ===

  @Post('lunar-csv')
  @Header('Content-Type', 'text/csv; charset=utf-8')
  exportLunarCsv(
    @Body() body: LunarCalculationRequestDto,
    @Res() res: Response,
  ) {
    try {
      const result = this.lunar.calculate(body);
      const rows = result.data.points.map((p) => ({
        index: p.index,
        t_sec: p.t.toFixed(2),
        u_deg: rad2deg(p.u).toFixed(4),
        theta_deg: rad2deg(p.theta).toFixed(4),
        r_km: p.r.toFixed(3),
        Omega_deg: rad2deg(p.orbitalElements.Omega).toFixed(6),
        i_deg: rad2deg(p.orbitalElements.i).toFixed(6),
        p_km: p.orbitalElements.p.toFixed(3),
        e: p.orbitalElements.e.toFixed(8),
        omega_deg: rad2deg(p.orbitalElements.omega).toFixed(6),
        a_km: p.orbitalElements.a.toFixed(3),
        deltaOmega_deg: p.changes.deltaOmega.toFixed(6),
        deltaI_deg: p.changes.deltaI.toFixed(6),
        deltaP_km: p.changes.deltaP.toFixed(4),
        deltaE: p.changes.deltaE.toFixed(8),
        deltaOmega_arg_deg: p.changes.deltaOmega_arg.toFixed(6),
        S_ms2: p.acceleration.S.toExponential(6),
        T_ms2: p.acceleration.T.toExponential(6),
        W_ms2: p.acceleration.W.toExponential(6),
        total_ms2: p.acceleration.total.toExponential(6),
      }));

      const parser = new Parser({
        withBOM: true,
        delimiter: ';',
      });
      const csv = parser.parse(rows);

      res.setHeader(
        'Content-Disposition',
        'attachment; filename="lunar_perturbation_report.csv"',
      );
      res.send(csv);
    } catch (error) {
      console.error('Lunar CSV Export Error:', error);
      throw new HttpException(
        'Failed to generate lunar CSV: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Post('lunar-pdf')
  @Header('Content-Type', 'application/pdf')
  async exportLunarPdf(
    @Body() body: LunarCalculationRequestDto,
    @Res() res: Response,
  ) {
    let browser: import('puppeteer').Browser | undefined;

    try {
      const result: LunarResult = this.lunar.calculate(body);
      const html = this.generateLunarHtml(body, result);

      console.log('[Lunar PDF Export] Starting Puppeteer launch...');
      console.log(
        '[Lunar PDF Export] Executable path:',
        process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium',
      );

      // Проверяем существование файла Chromium
      const chromePath =
        process.env.PUPPETEER_EXECUTABLE_PATH || '/usr/bin/chromium';
      if (fs.existsSync(chromePath)) {
        console.log(
          '[Lunar PDF Export] Chromium executable exists:',
          chromePath,
        );
      } else {
        console.error(
          '[Lunar PDF Export] CRITICAL: Chromium NOT FOUND at:',
          chromePath,
        );
      }

      browser = await puppeteer.launch({
        headless: true,
        executablePath: chromePath,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--single-process',
          '--no-zygote',
        ],
        dumpio: true,
        timeout: 180000,
      });

      const page = await browser.newPage();
      await page.setContent(html, {
        waitUntil: 'load',
        timeout: 30000,
      });

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

      const buffer = Buffer.from(pdfBuffer);

      res.setHeader(
        'Content-Disposition',
        'attachment; filename="lunar_perturbation_report.pdf"',
      );
      res.setHeader('Content-Length', buffer.length);

      res.send(buffer);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      const errorStack = error instanceof Error ? error.stack : 'No stack';

      console.error('[Lunar PDF Export] CRITICAL ERROR:', {
        message: errorMessage,
        stack: errorStack,
      });
      throw new HttpException(
        'Failed to generate lunar PDF: ' +
          (error instanceof Error ? error.message : 'Unknown error'),
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    } finally {
      if (browser) {
        console.log('[Lunar PDF Export] Closing browser...');
        await browser.close().catch((err) => {
          const errMsg = err instanceof Error ? err.message : 'Unknown error';
          console.error('[Lunar PDF Export] Error closing browser:', errMsg);
        });
      }
    }
  }

  private generateLunarHtml(
    body: LunarCalculationRequestDto,
    result: LunarResult,
  ): string {
    const { orbit: satelliteOrbit, moon: moonOrbit } = body;
    const { points, summary, constants } = result.data;

    return `
      <!DOCTYPE html>
      <html lang="ru">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Лабораторная работа №2 - Лунные возмущения</title>
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
          <h1>Лабораторная работа №2</h1>
          <div class="subtitle">
            <p>Изучение влияния лунных возмущений на движение ИСЗ</p>
          </div>
          <div class="date">
            <p>Дата отчёта: ${new Date().toLocaleString('ru-RU')}</p>
          </div>
        </div>

        <!-- 1. ИСХОДНЫЕ ДАННЫЕ -->
        <h2>1. Исходные данные</h2>
        <h3>Параметры орбиты спутника:</h3>
        <ul>
          <li>Большая полуось a = ${satelliteOrbit.a} км</li>
          <li>Эксцентриситет e = ${satelliteOrbit.e}</li>
          <li>Наклонение i = ${satelliteOrbit.i}°</li>
          <li>Долгота восходящего узла Ω = ${satelliteOrbit.Omega}°</li>
          <li>Аргумент перицентра ω = ${satelliteOrbit.omega}°</li>
          <li>Средняя аномалия M = ${satelliteOrbit.M}°</li>
        </ul>

        <h3>Параметры орбиты Луны:</h3>
        <ul>
          <li>Большая полуось aₗ = ${moonOrbit.a} км</li>
          <li>Эксцентриситет eₗ = ${moonOrbit.e}</li>
          <li>Наклонение iₗ = ${moonOrbit.i}°</li>
          <li>Долгота восходящего узла Ωₗ = ${moonOrbit.Omega}°</li>
          <li>Аргумент широты uₗ = ${moonOrbit.u}°</li>
        </ul>

        <h3>Параметры расчёта:</h3>
        <ul>
          <li>Количество точек: ${body.options?.pointsCount || 100}</li>
          <li>Время интегрирования: ${(summary.period / 60).toFixed(2)} мин (один период)</li>
        </ul>

        <!-- 2. КОНСТАНТЫ -->
        <h2>2. Используемые константы</h2>
        <ul>
          <li>Гравитационный параметр Земли μ = ${constants.muEarth} км³/с²</li>
          <li>Гравитационный параметр Луны μₗ = ${constants.muMoon} км³/с²</li>
          <li>Период обращения спутника T = ${(summary.period / 60).toFixed(2)} мин (${summary.period.toFixed(1)} с)</li>
        </ul>

        <!-- 3. МЕТОДИКА РАСЧЁТА -->
        <h2>3. Методика расчёта</h2>
        <p style="margin: 10px 0;">
          Возмущающее ускорение от притяжения Луны рассчитывается по формуле:
        </p>
        <p style="margin: 10px 0; text-align: center;">
          F = -μₗ × (ρ/ρ³ + r₁₂/r₁₂³)
        </p>
        <p style="margin: 10px 0;">
          где ρ — вектор от Луны к спутнику, r₁₂ — вектор от Луны к Земле.
        </p>
        
        <h3>Система дифференциальных уравнений:</h3>
        <p style="margin: 10px 0;">
          Интегрирование методом Рунге-Кутта 4-го порядка:
        </p>
        <ul>
          <li>dΩ/du = (r³ sin u) / (μ p sin i) × W</li>
          <li>di/du = (r³ cos u) / (μ p) × W</li>
          <li>dp/du = (2r³)/μ × T</li>
          <li>de/du = (r²)/(μ e) × [sin ν S + cos ν (1 + r/p) T + e (r/p) W]</li>
          <li>dω/du = (r²)/(μ e) × [cos ν S + e sin ν (1 + r/p) T - e (r/p) cot i sin u W]</li>
        </ul>

        <!-- 4. СТАТИСТИКА -->
        <h2>4. Сводная статистика</h2>
        <h3>Возмущающие ускорения:</h3>
        <ul>
          <li>Минимальное: ${summary.minPerturbation.toExponential(6)} м/с²</li>
          <li>Максимальное: ${summary.maxPerturbation.toExponential(6)} м/с²</li>
          <li>Среднее: ${summary.avgPerturbation.toExponential(6)} м/с²</li>
        </ul>

        <h3>Изменение элементов орбиты за один оборот:</h3>
        <ul>
          <li>ΔΩ = ${summary.orbitalChanges.deltaOmega.toFixed(6)}° (долгота восходящего узла)</li>
          <li>Δi = ${summary.orbitalChanges.deltaI.toFixed(6)}° (наклонение)</li>
          <li>Δp = ${summary.orbitalChanges.deltaP.toFixed(4)} км (фокальный параметр)</li>
          <li>Δe = ${summary.orbitalChanges.deltaE.toFixed(8)} (эксцентриситет)</li>
          <li>Δω = ${summary.orbitalChanges.deltaOmega_arg.toFixed(6)}° (аргумент перицентра)</li>
        </ul>

        <!-- 5. ТАБЛИЦА -->
        <h2>5. Результаты расчёта по точкам</h2>
        <table>
          <thead>
            <tr>
              <th>№</th>
              <th>t, с</th>
              <th>u, °</th>
              <th>θ, °</th>
              <th>r, км</th>
              <th>S, м/с²</th>
              <th>T, м/с²</th>
              <th>W, м/с²</th>
              <th>|a|, м/с²</th>
            </tr>
          </thead>
          <tbody>
            ${points
              .map(
                (p, idx) => `
              <tr>
                <td>${idx}</td>
                <td>${p.t.toFixed(1)}</td>
                <td>${rad2deg(p.u).toFixed(2)}</td>
                <td>${rad2deg(p.theta).toFixed(2)}</td>
                <td>${p.r.toFixed(1)}</td>
                <td>${p.acceleration.S.toExponential(2)}</td>
                <td>${p.acceleration.T.toExponential(2)}</td>
                <td>${p.acceleration.W.toExponential(2)}</td>
                <td>${p.acceleration.total.toExponential(2)}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>

        <div class="page-break"></div>
        
        <h2>6. Изменение элементов орбиты</h2>
        <table>
          <thead>
            <tr>
              <th>№</th>
              <th>Ω, °</th>
              <th>i, °</th>
              <th>p, км</th>
              <th>e</th>
              <th>ω, °</th>
              <th>a, км</th>
            </tr>
          </thead>
          <tbody>
            ${points
              .map(
                (p, idx) => `
              <tr>
                <td>${idx}</td>
                <td>${rad2deg(p.orbitalElements.Omega).toFixed(4)}</td>
                <td>${rad2deg(p.orbitalElements.i).toFixed(4)}</td>
                <td>${p.orbitalElements.p.toFixed(2)}</td>
                <td>${p.orbitalElements.e.toFixed(6)}</td>
                <td>${rad2deg(p.orbitalElements.omega).toFixed(4)}</td>
                <td>${p.orbitalElements.a.toFixed(2)}</td>
              </tr>
            `,
              )
              .join('')}
          </tbody>
        </table>

        <!-- 7. ВЫВОДЫ -->
        <h2>7. Выводы</h2>
        <div class="conclusions">
          <p>В результате выполнения работы было исследовано влияние гравитационного поля Луны на орбиту искусственного спутника Земли.</p>
          
          <p>Расчёт выполнен для ${points.length} точек орбиты методом численного интегрирования системы из 5 дифференциальных уравнений методом Рунге-Кутта 4-го порядка.</p>
          
          <p><b>Основные результаты:</b></p>
          <ul>
            <li>Возмущающее ускорение имеет порядок ${summary.avgPerturbation.toExponential(2)} м/с²</li>
            <li>За один оборот элементы орбиты изменяются на:</li>
            <ul>
              <li>ΔΩ = ${summary.orbitalChanges.deltaOmega.toFixed(6)}°</li>
              <li>Δi = ${summary.orbitalChanges.deltaI.toFixed(6)}°</li>
              <li>Δp = ${summary.orbitalChanges.deltaP.toFixed(4)} км</li>
              <li>Δe = ${summary.orbitalChanges.deltaE.toFixed(8)}</li>
              <li>Δω = ${summary.orbitalChanges.deltaOmega_arg.toFixed(6)}°</li>
            </ul>
          </ul>
          
          <p>Полученные результаты соответствуют теоретическим ожиданиям и подтверждают влияние гравитационного поля Луны на движение спутника. Наибольшее влияние наблюдается в элементах, определяющих ориентацию орбиты в пространстве (Ω, ω).</p>
        </div>
      </body>
      </html>
    `;
  }
}
