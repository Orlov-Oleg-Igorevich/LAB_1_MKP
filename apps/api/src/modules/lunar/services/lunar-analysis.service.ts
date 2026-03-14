import { Injectable } from '@nestjs/common';

interface InitialOrbit {
  a: number;
  e: number;
  i: number;
  Omega: number;
  omega: number;
  M: number;
}

interface OrbitalPoint {
  t: number;
  u: number;
  r: number;
  orbitalElements: {
    a: number;
    e: number;
    i: number;
    Omega: number;
    omega: number;
    M: number;
  };
  acceleration: {
    S: number;
    T: number;
    W: number;
    total: number;
  };
}

interface AnalysisResult {
  // Basic statistics
  summary: {
    integrationTime: number; // seconds
    orbitPeriod: number; // seconds
    numberOfRevolutions: number;
    pointsCount: number;
  };

  // Orbital element changes
  elementChanges: {
    deltaA: number; // km
    deltaE: number;
    deltaI: number; // rad
    deltaOmega: number; // rad
    deltaOmega_arg: number; // rad
    driftRates: {
      a: number; // km/s
      e: number; // 1/s
      i: number; // rad/s
      Omega: number; // rad/s
      omega: number; // rad/s
    };
  };

  // Acceleration statistics
  accelerationStats: {
    S: { min: number; max: number; mean: number; rms: number };
    T: { min: number; max: number; mean: number; rms: number };
    W: { min: number; max: number; mean: number; rms: number };
    total: { min: number; max: number; mean: number; rms: number };
  };

  // Perturbation analysis
  perturbationAnalysis: {
    dominantComponent: 'S' | 'T' | 'W';
    periodicComponents: Array<{
      component: string;
      amplitude: number;
      frequency: number; // rad^-1
      period: number; // in terms of u (radians)
    }>;
    maxPerturbationMagnitude: number;
  };

  // Numerical quality metrics
  numericalQuality: {
    energyConservation: number; // relative change in semi-major axis
    smoothness: number; // measure of trajectory smoothness
    estimatedError: number; // rough error estimate
  };

  // Recommendations
  recommendations: string[];
}

@Injectable()
export class LunarAnalysisService {
  /**
   * Perform comprehensive analysis of lunar perturbation results
   */
  analyze(points: OrbitalPoint[], initialOrbit: InitialOrbit): AnalysisResult {
    if (!points || points.length < 2) {
      throw new Error('At least 2 points required for analysis');
    }

    const summary = this.analyzeSummary(points, initialOrbit);
    const elementChanges = this.analyzeElementChanges(points);
    const accelerationStats = this.analyzeAccelerations(points);
    const perturbationAnalysis = this.analyzePerturbations(points);
    const numericalQuality = this.analyzeNumericalQuality(points);
    const recommendations = this.generateRecommendations(
      elementChanges,
      accelerationStats,
      perturbationAnalysis,
      numericalQuality,
    );

    return {
      summary,
      elementChanges,
      accelerationStats,
      perturbationAnalysis,
      numericalQuality,
      recommendations,
    };
  }

  /**
   * Analyze basic summary statistics
   */
  private analyzeSummary(points: OrbitalPoint[], initialOrbit: InitialOrbit) {
    const totalTime = points[points.length - 1].t - points[0].t;

    // Calculate orbital period using Kepler's third law
    const mu = 398600.4418; // Earth gravitational parameter, km³/s²
    const period = 2 * Math.PI * Math.sqrt(Math.pow(initialOrbit.a, 3) / mu);

    return {
      integrationTime: totalTime,
      orbitPeriod: period,
      numberOfRevolutions: totalTime / period,
      pointsCount: points.length,
    };
  }

  /**
   * Analyze changes in orbital elements
   */
  private analyzeElementChanges(points: OrbitalPoint[]) {
    const first = points[0].orbitalElements;
    const last = points[points.length - 1].orbitalElements;
    const totalTime = points[points.length - 1].t - points[0].t;

    const deltaA = last.a - first.a;
    const deltaE = last.e - first.e;
    const deltaI = last.i - first.i;
    const deltaOmega = last.Omega - first.Omega;
    const deltaOmega_arg = last.omega - first.omega;

    return {
      deltaA,
      deltaE,
      deltaI,
      deltaOmega,
      deltaOmega_arg,
      driftRates: {
        a: deltaA / totalTime,
        e: deltaE / totalTime,
        i: deltaI / totalTime,
        Omega: deltaOmega / totalTime,
        omega: deltaOmega_arg / totalTime,
      },
    };
  }

  /**
   * Analyze acceleration statistics
   */
  private analyzeAccelerations(points: OrbitalPoint[]) {
    const accelerations = points.map((p) => p.acceleration);

    const calcStats = (values: number[]) => ({
      min: Math.min(...values),
      max: Math.max(...values),
      mean: values.reduce((a, b) => a + b, 0) / values.length,
      rms: Math.sqrt(values.reduce((sum, v) => sum + v * v, 0) / values.length),
    });

    return {
      S: calcStats(accelerations.map((a) => a.S)),
      T: calcStats(accelerations.map((a) => a.T)),
      W: calcStats(accelerations.map((a) => a.W)),
      total: calcStats(accelerations.map((a) => a.total)),
    };
  }

  /**
   * Analyze perturbation characteristics
   */
  private analyzePerturbations(points: OrbitalPoint[]) {
    const accelerations = points.map((p) => p.acceleration);

    // Determine dominant component by RMS
    const rmsS = Math.sqrt(
      accelerations.reduce((sum, a) => sum + a.S * a.S, 0) /
        accelerations.length,
    );
    const rmsT = Math.sqrt(
      accelerations.reduce((sum, a) => sum + a.T * a.T, 0) /
        accelerations.length,
    );
    const rmsW = Math.sqrt(
      accelerations.reduce((sum, a) => sum + a.W * a.W, 0) /
        accelerations.length,
    );

    let dominantComponent: 'S' | 'T' | 'W' = 'S';
    if (rmsT > rmsS && rmsT > rmsW) dominantComponent = 'T';
    else if (rmsW > rmsS && rmsW > rmsT) dominantComponent = 'W';

    // Simple periodicity detection using zero crossings
    const periodicComponents = this.detectPeriodicComponents(points);

    // Maximum perturbation magnitude
    const maxPerturbationMagnitude = Math.max(
      ...accelerations.map((a) => a.total),
    );

    return {
      dominantComponent,
      periodicComponents,
      maxPerturbationMagnitude,
    };
  }

  /**
   * Detect periodic components in perturbations (simplified FFT-like analysis)
   */
  private detectPeriodicComponents(points: OrbitalPoint[]) {
    const components: Array<{
      component: string;
      amplitude: number;
      frequency: number;
      period: number;
    }> = [];

    // Analyze S, T, W variations with respect to argument of latitude u
    const uValues = points.map((p) => p.u);
    const SValues = points.map((p) => p.acceleration.S);
    const TValues = points.map((p) => p.acceleration.T);
    const WValues = points.map((p) => p.acceleration.W);

    // Simplified frequency analysis using autocorrelation-like method
    // Look for peaks in correlation with sinusoids at different frequencies

    const testFrequencies = [0.5, 1, 2, 3, 4, 6, 12]; // Test common harmonic frequencies

    for (const freq of testFrequencies) {
      const period = (2 * Math.PI) / freq;

      // Calculate correlation with sin(freq * u) and cos(freq * u)
      let sinCorrS = 0,
        cosCorrS = 0;
      let sinCorrT = 0,
        cosCorrT = 0;
      let sinCorrW = 0,
        cosCorrW = 0;

      for (let i = 0; i < points.length; i++) {
        const arg = freq * uValues[i];
        const sinVal = Math.sin(arg);
        const cosVal = Math.cos(arg);

        sinCorrS += SValues[i] * sinVal;
        cosCorrS += SValues[i] * cosVal;
        sinCorrT += TValues[i] * sinVal;
        cosCorrT += TValues[i] * cosVal;
        sinCorrW += WValues[i] * sinVal;
        cosCorrW += WValues[i] * cosVal;
      }

      const n = points.length;
      const amplitudeS =
        (2 / n) * Math.sqrt(sinCorrS * sinCorrS + cosCorrS * cosCorrS);
      const amplitudeT =
        (2 / n) * Math.sqrt(sinCorrT * sinCorrT + cosCorrT * cosCorrT);
      const amplitudeW =
        (2 / n) * Math.sqrt(sinCorrW * sinCorrW + cosCorrW * cosCorrW);

      const maxAmplitude = Math.max(amplitudeS, amplitudeT, amplitudeW);

      // Only report significant components (threshold: 10% of max acceleration)
      const maxAccel = Math.max(
        ...SValues.map(Math.abs),
        ...TValues.map(Math.abs),
        ...WValues.map(Math.abs),
      );

      if (maxAmplitude > 0.1 * maxAccel) {
        let dominantComp = 'S';
        let amplitude = amplitudeS;
        if (amplitudeT > amplitude) {
          dominantComp = 'T';
          amplitude = amplitudeT;
        }
        if (amplitudeW > amplitude) {
          dominantComp = 'W';
          amplitude = amplitudeW;
        }

        components.push({
          component: `${dominantComp}(${freq.toFixed(1)})`,
          amplitude: amplitude,
          frequency: freq,
          period: period,
        });
      }
    }

    // Sort by amplitude (descending)
    components.sort((a, b) => b.amplitude - a.amplitude);

    // Return top 3 components
    return components.slice(0, 3);
  }

  /**
   * Analyze numerical quality of the integration
   */
  private analyzeNumericalQuality(points: OrbitalPoint[]): {
    energyConservation: number;
    smoothness: number;
    estimatedError: number;
  } {
    // Energy conservation check (via semi-major axis)
    const aValues = points.map((p) => p.orbitalElements.a);
    const aMean = aValues.reduce((sum, a) => sum + a, 0) / aValues.length;
    const aStdDev = Math.sqrt(
      aValues.reduce((sum, a) => sum + Math.pow(a - aMean, 2), 0) /
        aValues.length,
    );
    const energyConservation = aStdDev / aMean;

    // Smoothness check (via second derivative of position)
    let smoothnessMetric = 0;
    for (let i = 1; i < points.length - 1; i++) {
      const rPrev = points[i - 1].r;
      const rCurr = points[i].r;
      const rNext = points[i + 1].r;

      // Second difference (approximates second derivative)
      const secondDiff = Math.abs(rNext - 2 * rCurr + rPrev);
      smoothnessMetric += secondDiff;
    }
    smoothnessMetric /= points.length - 2;

    // Rough error estimate based on step size variation (if available)
    // For now, use energy conservation as proxy
    const estimatedError = energyConservation;

    return {
      energyConservation,
      smoothness: smoothnessMetric,
      estimatedError,
    };
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(
    elementChanges: AnalysisResult['elementChanges'],
    accelerationStats: AnalysisResult['accelerationStats'],
    perturbationAnalysis: AnalysisResult['perturbationAnalysis'],
    numericalQuality: AnalysisResult['numericalQuality'],
  ): string[] {
    const recommendations: string[] = [];

    // Check perturbation magnitude
    const maxAccel = perturbationAnalysis.maxPerturbationMagnitude;
    if (maxAccel > 1e-6) {
      recommendations.push(
        '⚠️ Высокий уровень возмущений (>10⁻⁶ м/с²). Рекомендуется использовать адаптивный шаг интегрирования RKF45.',
      );
    }

    // Check dominant component
    const domComp = perturbationAnalysis.dominantComponent;
    if (domComp === 'W') {
      recommendations.push(
        '📊 Бинормальная составляющая W доминирует. Ожидайте значительную прецессию узла Ω и наклонения i.',
      );
    } else if (domComp === 'T') {
      recommendations.push(
        '📊 Трансверсальная составляющая T доминирует. Ожидайте значительное изменение эксцентриситета e и аргумента ω.',
      );
    } else if (domComp === 'S') {
      recommendations.push(
        '📊 Радиальная составляющая S доминирует. Ожидайте значительное изменение большой полуоси a.',
      );
    }

    // Check periodic components
    if (perturbationAnalysis.periodicComponents.length > 0) {
      const periods = perturbationAnalysis.periodicComponents
        .map((c) => c.period.toFixed(2))
        .join(', ');
      recommendations.push(
        `🔄 Обнаружены периодические составляющие с периодами: ${periods} рад. Это связано с гармониками лунного воздействия.`,
      );
    }

    // Check numerical quality
    if (numericalQuality.energyConservation > 1e-6) {
      recommendations.push(
        '⚠️ Заметные численные ошибки (изменение энергии >10⁻⁶). Уменьшите шаг интегрирования или повысьте точность RKF45.',
      );
    }

    // Check drift rates
    const driftOmega =
      ((Math.abs(elementChanges.driftRates.Omega) * 180) / Math.PI) * 86400; // deg/day
    if (driftOmega > 1) {
      recommendations.push(
        `📈 Быстрая прецессия узла: ${driftOmega.toFixed(3)}°/сутки. Учитывайте при долгосрочном прогнозировании.`,
      );
    }

    // General recommendation
    if (recommendations.length === 0) {
      recommendations.push(
        '✅ Возмущения умеренные, численная стабильность хорошая. Результаты надёжны.',
      );
    }

    return recommendations;
  }

  /**
   * Export analysis to formatted text report
   */
  exportToText(analysis: AnalysisResult): string {
    const lines = [
      '═══════════════════════════════════════════════════════════',
      '       АНАЛИЗ РЕЗУЛЬТАТОВ ЛУННЫХ ВОЗМУЩЕНИЙ',
      '═══════════════════════════════════════════════════════════',
      '',
      '📊 ОБЩАЯ СТАТИСТИКА',
      `   Время интегрирования: ${(analysis.summary.integrationTime / 3600).toFixed(3)} ч`,
      `   Орбитальный период: ${(analysis.summary.orbitPeriod / 60).toFixed(3)} мин`,
      `   Количество витков: ${analysis.summary.numberOfRevolutions.toFixed(3)}`,
      `   Точек траектории: ${analysis.summary.pointsCount}`,
      '',
      '🔵 ИЗМЕНЕНИЯ ЭЛЕМЕНТОВ ОРБИТЫ',
      `   Δa (большая полуось): ${analysis.elementChanges.deltaA.toExponential(4)} км`,
      `   Δe (эксцентриситет): ${analysis.elementChanges.deltaE.toExponential(6)}`,
      `   Δi (наклонение): ${((analysis.elementChanges.deltaI * 180) / Math.PI).toExponential(4)}°`,
      `   ΔΩ (узел): ${((analysis.elementChanges.deltaOmega * 180) / Math.PI).toExponential(4)}°`,
      `   Δω (перицентр): ${((analysis.elementChanges.deltaOmega_arg * 180) / Math.PI).toExponential(4)}°`,
      '',
      '⚡ СТАТИСТИКА УСКОРЕНИЙ',
      `   S (радиальная): [${analysis.accelerationStats.S.min.toExponential(2)}, ${analysis.accelerationStats.S.max.toExponential(2)}] м/с²`,
      `   T (трансверсальная): [${analysis.accelerationStats.T.min.toExponential(2)}, ${analysis.accelerationStats.T.max.toExponential(2)}] м/с²`,
      `   W (бинормальная): [${analysis.accelerationStats.W.min.toExponential(2)}, ${analysis.accelerationStats.W.max.toExponential(2)}] м/с²`,
      `   |a| (полная): [${analysis.accelerationStats.total.min.toExponential(2)}, ${analysis.accelerationStats.total.max.toExponential(2)}] м/с²`,
      '',
      '🎯 АНАЛИЗ ВОЗМУЩЕНИЙ',
      `   Доминирующая компонента: ${analysis.perturbationAnalysis.dominantComponent}`,
      `   Максимальное ускорение: ${analysis.perturbationAnalysis.maxPerturbationMagnitude.toExponential(2)} м/с²`,
    ];

    if (analysis.perturbationAnalysis.periodicComponents.length > 0) {
      lines.push('   Периодические составляющие:');
      analysis.perturbationAnalysis.periodicComponents.forEach((comp) => {
        lines.push(
          `     - ${comp.component}: амплитуда=${comp.amplitude.toExponential(2)}, период=${comp.period.toFixed(2)} рад`,
        );
      });
    }

    lines.push('');
    lines.push('📈 КАЧЕСТВО ЧИСЛЕННОГО ИНТЕГРИРОВАНИЯ');
    lines.push(
      `   Сохранение энергии: ${analysis.numericalQuality.energyConservation.toExponential(4)}`,
    );
    lines.push(
      `   Гладкость траектории: ${analysis.numericalQuality.smoothness.toExponential(6)}`,
    );
    lines.push(
      `   Оценка ошибки: ${analysis.numericalQuality.estimatedError.toExponential(4)}`,
    );

    lines.push('');
    lines.push('💡 РЕКОМЕНДАЦИИ');
    analysis.recommendations.forEach((rec) => {
      lines.push(`   ${rec}`);
    });

    lines.push('');
    lines.push('═══════════════════════════════════════════════════════════');

    return lines.join('\n');
  }
}
