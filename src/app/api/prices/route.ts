import { NextRequest, NextResponse } from 'next/server';

// Restate.ru API types:
// type=1 - Все квартиры
// type=2 - 1-комн квартиры
// type=3 - 2-комн квартиры
// type=4 - 3-комн квартиры
// type=5 - Многокомнатные
// type=6 - Студии
// period=1 - Квартал, 2 - 1 год, 3 - 3 года, 4 - 5 лет, 5 - 7 лет

export async function GET(request: NextRequest) {
    const searchParams = request.nextUrl.searchParams;
    const type = searchParams.get('type') || '1';
    const region = searchParams.get('region') || '2'; // 2 = Москва
    const period = searchParams.get('period') || '2'; // Default: 1 year

    try {
        const response = await fetch(
            `https://msk.restate.ru/action/graph2/data/?region=${region}&type=${type}&period=${period}&influence=1&money=&metro=&area=&okrug=&op=1&form=9&sy=1&cjs=1`,
            {
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                },
                next: { revalidate: 3600 } // Cache for 1 hour
            }
        );

        if (!response.ok) {
            throw new Error(`API responded with status: ${response.status}`);
        }

        const data = await response.json();

        // Extract latest price data
        const rows = data.rows || [];
        const lastRow = rows[rows.length - 1];

        // Get price per sqm (new buildings is column 1, secondary is column 2)
        const newBuildingPrice = lastRow ? lastRow[1] : null;
        const secondaryPrice = lastRow ? lastRow[2] : null;
        const date = lastRow ? lastRow[0] : null;

        // Calculate average apartment prices based on typical sizes
        const sizes: Record<string, number> = {
            '1': 50,  // All apartments average
            '2': 38,  // 1-room
            '3': 55,  // 2-room
            '4': 75,  // 3-room
            '5': 100, // Multi-room
            '6': 28   // Studio
        };

        const avgSize = sizes[type] || 50;

        return NextResponse.json({
            success: true,
            data: {
                date,
                type,
                pricePerSqm: {
                    newBuilding: Math.round(newBuildingPrice || 0),
                    secondary: Math.round(secondaryPrice || 0)
                },
                averagePrice: {
                    newBuilding: Math.round((newBuildingPrice || 0) * avgSize),
                    secondary: Math.round((secondaryPrice || 0) * avgSize)
                },
                avgSize,
                history: rows.map((row: (string | number)[]) => ({
                    date: row[0],
                    newBuilding: row[1],
                    secondary: row[2]
                }))
            }
        });
    } catch (error) {
        console.error('Error fetching prices:', error);

        // Return fallback data
        return NextResponse.json({
            success: false,
            error: 'Failed to fetch prices',
            data: {
                date: '09.12.2025',
                type,
                pricePerSqm: {
                    newBuilding: 519306,
                    secondary: 475564
                },
                averagePrice: {
                    newBuilding: 519306 * 50,
                    secondary: 475564 * 50
                },
                avgSize: 50,
                history: []
            }
        });
    }
}
