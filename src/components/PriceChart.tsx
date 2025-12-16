'use client';

import { useMemo } from 'react';
import {
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area,
    ComposedChart,
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { TrendingUp } from 'lucide-react';

interface PriceDataPoint {
    date: string;
    newBuilding: number;
    secondary: number;
}

interface PriceChartProps {
    data: PriceDataPoint[];
    isLoading?: boolean;
    period?: string;
    onPeriodChange?: (period: string) => void;
}

const pricePeriods = [
    { value: '1', label: 'Квартал' },
    { value: '2', label: '1 год' },
    { value: '3', label: '3 года' },
    { value: '4', label: '5 лет' },
    { value: '5', label: '7 лет' },
];

// Indigo theme colors
const INDIGO_PRIMARY = '#818CF8';    // indigo-400
const INDIGO_LIGHT = '#A5B4FC';      // indigo-300
const INDIGO_DARK = '#6366F1';       // indigo-500
const CYAN_PRIMARY = '#22D3EE';      // cyan-400
const CYAN_LIGHT = '#67E8F9';        // cyan-300

const formatPrice = (value: number) => {
    if (value >= 1000000) {
        return `${(value / 1000).toFixed(0)} тыс`;
    }
    return value.toLocaleString('ru-RU');
};

const formatTooltipPrice = (value: number) => {
    return `${value.toLocaleString('ru-RU')} ₽/м²`;
};

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="rounded-lg border border-border bg-card p-3 shadow-lg">
                <p className="mb-2 text-xs font-medium text-muted-foreground">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-xs">
                        <div
                            className="h-2 w-2 rounded-full"
                            style={{ backgroundColor: entry.color }}
                        />
                        <span className="text-muted-foreground">{entry.name}:</span>
                        <span className="font-semibold" style={{ color: entry.color }}>
                            {formatTooltipPrice(entry.value)}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

export default function PriceChart({ data, isLoading, period = '2', onPeriodChange }: PriceChartProps) {
    const periodLabel = pricePeriods.find(p => p.value === period)?.label || '1 год';

    const { priceStats, yAxisDomain } = useMemo(() => {
        if (data.length < 2) return { priceStats: null, yAxisDomain: ['auto', 'auto'] as [string, string] };

        const first = data[0];
        const last = data[data.length - 1];

        const newBuildingChange = ((last.newBuilding - first.newBuilding) / first.newBuilding) * 100;
        const secondaryChange = ((last.secondary - first.secondary) / first.secondary) * 100;

        const allPrices = data.flatMap(d => [d.newBuilding, d.secondary]).filter(p => p > 0);
        const minPrice = Math.min(...allPrices);
        const maxPrice = Math.max(...allPrices);
        const padding = (maxPrice - minPrice) * 0.1;
        const yMin = Math.floor((minPrice - padding) / 10000) * 10000;
        const yMax = Math.ceil((maxPrice + padding) / 10000) * 10000;

        return {
            priceStats: {
                newBuilding: {
                    current: last.newBuilding,
                    change: newBuildingChange,
                },
                secondary: {
                    current: last.secondary,
                    change: secondaryChange,
                },
            },
            yAxisDomain: [yMin, yMax] as [number, number]
        };
    }, [data]);

    if (isLoading) {
        return (
            <Card>
                <CardContent className="flex h-[400px] items-center justify-center">
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
                        <span className="text-xs text-muted-foreground">Загрузка данных...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!data || data.length === 0) {
        return (
            <Card>
                <CardContent className="flex h-[400px] items-center justify-center">
                    <span className="text-xs text-muted-foreground">Нет данных для отображения</span>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader className="bg-primary text-primary-foreground py-3 rounded-t-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2 text-sm font-medium">
                            <TrendingUp className="h-4 w-4" />
                            Динамика цен на квартиры в Москве
                        </CardTitle>
                        <CardDescription className="text-primary-foreground/70 mt-0.5 text-xs">
                            Средняя стоимость за м² за {periodLabel.toLowerCase()}
                        </CardDescription>
                    </div>
                    {onPeriodChange && (
                        <Select value={period} onValueChange={onPeriodChange}>
                            <SelectTrigger className="w-[100px] h-8 text-xs bg-primary-foreground/20 border-primary-foreground/30 text-primary-foreground">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {pricePeriods.map((p) => (
                                    <SelectItem key={p.value} value={p.value} className="text-xs">
                                        {p.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}
                </div>
            </CardHeader>
            <CardContent className="pt-4">
                {/* Price Stats */}
                {priceStats && (
                    <div className="mb-4 grid grid-cols-2 gap-3">
                        <div className="rounded-lg border border-border bg-muted/50 p-3">
                            <div className="text-[10px] text-muted-foreground">Новостройки сейчас</div>
                            <div className="text-lg font-bold" style={{ color: INDIGO_PRIMARY }}>
                                {priceStats.newBuilding.current.toLocaleString('ru-RU')} ₽/м²
                            </div>
                            <div className={`text-xs font-medium ${priceStats.newBuilding.change >= 0 ? 'text-primary' : 'text-destructive'}`}>
                                {priceStats.newBuilding.change >= 0 ? '↑' : '↓'} {Math.abs(priceStats.newBuilding.change).toFixed(1)}% за год
                            </div>
                        </div>
                        <div className="rounded-lg border border-border bg-muted/50 p-3">
                            <div className="text-[10px] text-muted-foreground">Вторичка сейчас</div>
                            <div className="text-lg font-bold" style={{ color: CYAN_PRIMARY }}>
                                {priceStats.secondary.current.toLocaleString('ru-RU')} ₽/м²
                            </div>
                            <div className={`text-xs font-medium ${priceStats.secondary.change >= 0 ? 'text-primary' : 'text-destructive'}`}>
                                {priceStats.secondary.change >= 0 ? '↑' : '↓'} {Math.abs(priceStats.secondary.change).toFixed(1)}% за год
                            </div>
                        </div>
                    </div>
                )}

                {/* Chart */}
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <ComposedChart
                            data={data}
                            margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
                        >
                            <defs>
                                <linearGradient id="colorNewBuilding" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={INDIGO_PRIMARY} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={INDIGO_PRIMARY} stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="colorSecondary" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor={CYAN_PRIMARY} stopOpacity={0.3} />
                                    <stop offset="95%" stopColor={CYAN_PRIMARY} stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                                tickLine={{ stroke: '#4B5563' }}
                                axisLine={{ stroke: '#4B5563' }}
                            />
                            <YAxis
                                tickFormatter={formatPrice}
                                tick={{ fontSize: 10, fill: '#9CA3AF' }}
                                tickLine={{ stroke: '#4B5563' }}
                                axisLine={{ stroke: '#4B5563' }}
                                width={60}
                                domain={yAxisDomain}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend
                                wrapperStyle={{ paddingTop: '15px' }}
                                formatter={(value) => (
                                    <span className="text-xs text-muted-foreground">{value}</span>
                                )}
                            />
                            {/* Areas for gradient fill */}
                            <Area
                                type="monotone"
                                dataKey="newBuilding"
                                stroke="transparent"
                                fill="url(#colorNewBuilding)"
                                legendType="none"
                            />
                            <Area
                                type="monotone"
                                dataKey="secondary"
                                stroke="transparent"
                                fill="url(#colorSecondary)"
                                legendType="none"
                            />
                            {/* Lines */}
                            <Line
                                type="monotone"
                                dataKey="newBuilding"
                                stroke={INDIGO_PRIMARY}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 5, fill: INDIGO_PRIMARY }}
                                name="Новостройки"
                            />
                            <Line
                                type="monotone"
                                dataKey="secondary"
                                stroke={CYAN_PRIMARY}
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 5, fill: CYAN_PRIMARY }}
                                name="Вторичка"
                            />
                        </ComposedChart>
                    </ResponsiveContainer>
                </div>

                {/* Source */}
                <div className="mt-3 text-center text-[10px] text-muted-foreground">
                    Источник данных: msk.restate.ru
                </div>
            </CardContent>
        </Card>
    );
}
