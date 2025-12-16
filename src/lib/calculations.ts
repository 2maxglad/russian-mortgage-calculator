// Типы данных для калькулятора
export interface CalculatorInputs {
  // Недвижимость
  apartmentPrice: number; // Текущая стоимость квартиры
  priceGrowthRate: number; // Рост цен на жильё (% в год)

  // Доходы и накопления
  salary: number; // Текущая зарплата
  salaryGrowthRate: number; // Рост зарплаты (% в год)
  monthlySavings: number; // Сумма накоплений в месяц
  initialSavings: number; // Начальные сбережения (уже накоплено)
  savingsInterestRate: number; // Процент на инвестиционную копилку (% годовых)

  // Ипотека
  mortgageRate: number; // Процентная ставка по ипотеке (% годовых)
  downPaymentPercent: number; // Первоначальный взнос (%)
  mortgageTerm: number; // Срок ипотеки (лет)
}

export interface CalculationResults {
  // Будущая стоимость квартиры через N месяцев
  futureApartmentPrice: number;

  // Необходимый первоначальный взнос
  requiredDownPayment: number;

  // Время накопления на первоначальный взнос (месяцев)
  monthsToDownPayment: number;

  // Время накопления на полную стоимость (месяцев)
  monthsToFullPrice: number;

  // Ежемесячный платёж по ипотеке
  monthlyMortgagePayment: number;

  // Общая сумма выплат по ипотеке
  totalMortgagePayment: number;

  // Переплата по ипотеке
  mortgageOverpayment: number;

  // Рекомендуемая сумма накоплений для достижения цели за N лет
  recommendedMonthlySavings: number;

  // Накопленная сумма через N месяцев с учётом роста ЗП
  projectedSavings: number;

  // Детализация по месяцам для графика
  monthlyProjection: MonthlyProjection[];
}

export interface MonthlyProjection {
  month: number;
  apartmentPrice: number;
  totalSavings: number;
  monthlySaving: number;
  downPaymentTarget: number;
  surplus: number; // разница между накоплениями и целью
}

/**
 * Расчёт будущей стоимости квартиры
 * FV = PV * (1 + r)^n
 */
export function calculateFuturePrice(
  currentPrice: number,
  annualGrowthRate: number,
  months: number
): number {
  const monthlyRate = annualGrowthRate / 100 / 12;
  return currentPrice * Math.pow(1 + monthlyRate, months);
}

/**
 * Расчёт накоплений с учётом роста зарплаты и % на накопленные средства
 * Ежемесячно: добавляем взнос + начисляем % на накопления
 */
export function calculateSavingsWithGrowth(
  initialMonthlySaving: number,
  annualSalaryGrowthRate: number,
  months: number,
  initialSavings: number = 0,
  annualInterestRate: number = 0
): number {
  const monthlyGrowthRate = annualSalaryGrowthRate / 100 / 12;
  const monthlyInterestRate = annualInterestRate / 100 / 12;
  let totalSavings = initialSavings;
  let currentSaving = initialMonthlySaving;

  for (let i = 0; i < months; i++) {
    // Сначала начисляем проценты на накопленное
    totalSavings *= (1 + monthlyInterestRate);
    // Затем добавляем ежемесячный взнос
    totalSavings += currentSaving;
    // Увеличиваем взнос в соответствии с ростом ЗП
    currentSaving *= (1 + monthlyGrowthRate);
  }

  return totalSavings;
}

/**
 * Расчёт времени накопления на целевую сумму
 * с учётом роста цены, роста накоплений и % на сбережения
 */
export function calculateMonthsToTarget(
  targetAmount: number,
  currentPrice: number,
  priceGrowthRate: number,
  monthlySavings: number,
  salaryGrowthRate: number,
  targetPercent: number = 100,
  initialSavings: number = 0,
  savingsInterestRate: number = 0
): number {
  const monthlyPriceGrowth = priceGrowthRate / 100 / 12;
  const monthlySalaryGrowth = salaryGrowthRate / 100 / 12;
  const monthlyInterestRate = savingsInterestRate / 100 / 12;

  let totalSavings = initialSavings;
  let currentSaving = monthlySavings;
  let currentApartmentPrice = currentPrice;
  let months = 0;
  const maxMonths = 600; // Максимум 50 лет

  // Проверяем начальные сбережения
  const initialTarget = currentApartmentPrice * (targetPercent / 100);
  if (totalSavings >= initialTarget) {
    return 0;
  }

  while (months < maxMonths) {
    // Начисляем проценты и добавляем сбережения
    totalSavings *= (1 + monthlyInterestRate);
    totalSavings += currentSaving;
    currentSaving *= (1 + monthlySalaryGrowth);
    currentApartmentPrice *= (1 + monthlyPriceGrowth);
    months++;

    const target = currentApartmentPrice * (targetPercent / 100);
    if (totalSavings >= target) {
      return months;
    }
  }

  return -1; // Невозможно накопить
}

/**
 * Расчёт ежемесячного платежа по ипотеке (аннуитетный)
 * PMT = P * [r(1+r)^n] / [(1+r)^n - 1]
 */
export function calculateMortgagePayment(
  principal: number, // Сумма кредита
  annualRate: number, // Годовая ставка в %
  termYears: number // Срок в годах
): number {
  const monthlyRate = annualRate / 100 / 12;
  const numPayments = termYears * 12;

  if (monthlyRate === 0) {
    return principal / numPayments;
  }

  const payment =
    principal *
    (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
    (Math.pow(1 + monthlyRate, numPayments) - 1);

  return payment;
}

/**
 * Расчёт рекомендуемой суммы накоплений
 * чтобы накопить на первоначальный взнос за заданное время
 */
export function calculateRecommendedSavings(
  targetAmount: number,
  currentPrice: number,
  priceGrowthRate: number,
  salaryGrowthRate: number,
  targetMonths: number,
  downPaymentPercent: number
): number {
  // Расчёт будущей стоимости квартиры
  const futurePrice = calculateFuturePrice(currentPrice, priceGrowthRate, targetMonths);
  const targetDownPayment = futurePrice * (downPaymentPercent / 100);

  // Расчёт множителя для накоплений с ростом ЗП
  const monthlySalaryGrowth = salaryGrowthRate / 100 / 12;
  let multiplier = 0;
  let growthFactor = 1;

  for (let i = 0; i < targetMonths; i++) {
    multiplier += growthFactor;
    growthFactor *= 1 + monthlySalaryGrowth;
  }

  return targetDownPayment / multiplier;
}

/**
 * Генерация помесячной проекции с учётом начальных сбережений и %
 */
export function generateMonthlyProjection(
  inputs: CalculatorInputs,
  maxMonths: number = 120 // 10 лет по умолчанию
): MonthlyProjection[] {
  const projection: MonthlyProjection[] = [];
  const monthlyPriceGrowth = inputs.priceGrowthRate / 100 / 12;
  const monthlySalaryGrowth = inputs.salaryGrowthRate / 100 / 12;
  const monthlyInterestRate = inputs.savingsInterestRate / 100 / 12;

  let totalSavings = inputs.initialSavings;
  let currentSaving = inputs.monthlySavings;
  let currentApartmentPrice = inputs.apartmentPrice;

  for (let month = 0; month <= maxMonths; month++) {
    const downPaymentTarget = currentApartmentPrice * (inputs.downPaymentPercent / 100);

    projection.push({
      month,
      apartmentPrice: Math.round(currentApartmentPrice),
      totalSavings: Math.round(totalSavings),
      monthlySaving: Math.round(currentSaving),
      downPaymentTarget: Math.round(downPaymentTarget),
      surplus: Math.round(totalSavings - downPaymentTarget),
    });

    // Начисляем проценты на накопления
    totalSavings *= (1 + monthlyInterestRate);
    totalSavings += currentSaving;
    currentSaving *= (1 + monthlySalaryGrowth);
    currentApartmentPrice *= (1 + monthlyPriceGrowth);
  }

  return projection;
}

/**
 * Полный расчёт для калькулятора
 */
export function calculateAll(inputs: CalculatorInputs): CalculationResults {
  // Рассчёт времени накопления на первоначальный взнос
  const monthsToDownPayment = calculateMonthsToTarget(
    inputs.apartmentPrice * (inputs.downPaymentPercent / 100),
    inputs.apartmentPrice,
    inputs.priceGrowthRate,
    inputs.monthlySavings,
    inputs.salaryGrowthRate,
    inputs.downPaymentPercent,
    inputs.initialSavings,
    inputs.savingsInterestRate
  );

  // Рассчёт времени накопления на полную стоимость
  const monthsToFullPrice = calculateMonthsToTarget(
    inputs.apartmentPrice,
    inputs.apartmentPrice,
    inputs.priceGrowthRate,
    inputs.monthlySavings,
    inputs.salaryGrowthRate,
    100,
    inputs.initialSavings,
    inputs.savingsInterestRate
  );

  // Будущая стоимость квартиры на момент накопления первоначального взноса
  const futureApartmentPrice =
    monthsToDownPayment > 0
      ? calculateFuturePrice(inputs.apartmentPrice, inputs.priceGrowthRate, monthsToDownPayment)
      : inputs.apartmentPrice;

  // Необходимый первоначальный взнос (от будущей цены)
  const requiredDownPayment = futureApartmentPrice * (inputs.downPaymentPercent / 100);

  // Сумма кредита (после первоначального взноса)
  const loanAmount = futureApartmentPrice - requiredDownPayment;

  // Ежемесячный платёж по ипотеке
  const monthlyMortgagePayment = calculateMortgagePayment(
    loanAmount,
    inputs.mortgageRate,
    inputs.mortgageTerm
  );

  // Общая сумма выплат
  const totalMortgagePayment = monthlyMortgagePayment * inputs.mortgageTerm * 12;

  // Переплата
  const mortgageOverpayment = totalMortgagePayment - loanAmount;

  // Рекомендуемая сумма накоплений (чтобы накопить за 2 года)
  const targetMonths = 24;
  const recommendedMonthlySavings = calculateRecommendedSavings(
    requiredDownPayment,
    inputs.apartmentPrice,
    inputs.priceGrowthRate,
    inputs.salaryGrowthRate,
    targetMonths,
    inputs.downPaymentPercent
  );

  // Накопления через время накопления на ПВ
  const projectedSavings =
    monthsToDownPayment > 0
      ? calculateSavingsWithGrowth(
        inputs.monthlySavings,
        inputs.salaryGrowthRate,
        monthsToDownPayment,
        inputs.initialSavings,
        inputs.savingsInterestRate
      )
      : inputs.initialSavings;

  // Генерация проекции
  const monthlyProjection = generateMonthlyProjection(inputs);

  return {
    futureApartmentPrice: Math.round(futureApartmentPrice),
    requiredDownPayment: Math.round(requiredDownPayment),
    monthsToDownPayment,
    monthsToFullPrice,
    monthlyMortgagePayment: Math.round(monthlyMortgagePayment),
    totalMortgagePayment: Math.round(totalMortgagePayment),
    mortgageOverpayment: Math.round(mortgageOverpayment),
    recommendedMonthlySavings: Math.round(recommendedMonthlySavings),
    projectedSavings: Math.round(projectedSavings),
    monthlyProjection,
  };
}

/**
 * Форматирование числа как валюты
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('ru-RU', {
    style: 'currency',
    currency: 'RUB',
    maximumFractionDigits: 0,
  }).format(value);
}

/**
 * Форматирование месяцев в годы и месяцы
 */
export function formatMonths(months: number): string {
  if (months < 0) return 'Невозможно';

  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;

  if (years === 0) {
    return `${remainingMonths} мес.`;
  } else if (remainingMonths === 0) {
    return `${years} ${getYearWord(years)}`;
  } else {
    return `${years} ${getYearWord(years)} ${remainingMonths} мес.`;
  }
}

function getYearWord(years: number): string {
  const lastDigit = years % 10;
  const lastTwoDigits = years % 100;

  if (lastTwoDigits >= 11 && lastTwoDigits <= 14) {
    return 'лет';
  } else if (lastDigit === 1) {
    return 'год';
  } else if (lastDigit >= 2 && lastDigit <= 4) {
    return 'года';
  } else {
    return 'лет';
  }
}
