import { NextResponse } from 'next/server';

// API для получения данных ЦБ РФ: ключевая ставка и инфляция
export async function GET() {
    try {
        // Получаем ключевую ставку с сайта ЦБ (парсим HTML, так как JSON API требует авторизации)
        const keyRateResponse = await fetch('https://www.cbr.ru/key-indicators/', {
            headers: {
                'Accept': 'text/html',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            next: { revalidate: 3600 } // Cache for 1 hour
        });

        let keyRate = 21; // Fallback: текущая ключевая ставка (декабрь 2024)
        let inflationRate = 8.9; // Fallback: текущая инфляция

        if (keyRateResponse.ok) {
            const html = await keyRateResponse.text();

            // Парсим ключевую ставку из HTML
            // Ищем паттерн "Ключевая ставка" и значение после него
            const keyRateMatch = html.match(/Ключевая ставка[^<]*<[^>]*>[^<]*<[^>]*>([0-9,\.]+)/);
            if (keyRateMatch) {
                keyRate = parseFloat(keyRateMatch[1].replace(',', '.'));
            }

            // Парсим инфляцию
            const inflationMatch = html.match(/Инфляция[^<]*<[^>]*>[^<]*<[^>]*>([0-9,\.]+)/);
            if (inflationMatch) {
                inflationRate = parseFloat(inflationMatch[1].replace(',', '.'));
            }
        }

        // Рекомендуемая ставка по депозитам (обычно ключевая ставка - 1-2%)
        const depositRate = Math.max(keyRate - 2, keyRate * 0.9);

        return NextResponse.json({
            success: true,
            data: {
                keyRate, // Ключевая ставка ЦБ
                inflationRate, // Инфляция год к году
                depositRate, // Рекомендуемая ставка по депозитам
                date: new Date().toLocaleDateString('ru-RU'),
                source: 'cbr.ru'
            }
        });
    } catch (error) {
        console.error('Error fetching CBR data:', error);

        // Fallback данные на декабрь 2024
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch CBR data',
            data: {
                keyRate: 21,
                inflationRate: 8.9,
                depositRate: 19,
                date: '13.12.2024',
                source: 'fallback'
            }
        });
    }
}
