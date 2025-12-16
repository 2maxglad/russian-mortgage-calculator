'use client';

import { useState, useEffect, useCallback } from 'react';
import {
    CalculatorInputs,
    CalculationResults,
    calculateAll,
    formatCurrency,
    formatMonths,
} from '@/lib/calculations';
import PriceChart from '@/components/PriceChart';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import {
    Home,
    TrendingUp,
    Wallet,
    Percent,
    Calendar,
    PiggyBank,
    Calculator,
    Info,
    Target,
    Clock,
    CreditCard,
    ArrowUpRight,
    ArrowDownRight,
    Building2,
    RefreshCw,
    Loader2,
} from 'lucide-react';

interface MarketPrices {
    date: string;
    pricePerSqm: {
        newBuilding: number;
        secondary: number;
    };
    averagePrice: {
        newBuilding: number;
        secondary: number;
    };
    avgSize: number;
    history: Array<{
        date: string;
        newBuilding: number;
        secondary: number;
    }>;
}

const apartmentTypes = [
    { value: '2', label: '1-комнатная', avgSize: 38 },
    { value: '3', label: '2-комнатная', avgSize: 55 },
    { value: '4', label: '3-комнатная', avgSize: 75 },
    { value: '6', label: 'Студия', avgSize: 28 },
];

const defaultInputs: CalculatorInputs = {
    apartmentPrice: 10000000,
    priceGrowthRate: 8,
    salary: 150000,
    salaryGrowthRate: 5,
    monthlySavings: 50000,
    initialSavings: 0,
    savingsInterestRate: 10,
    mortgageRate: 18,
    downPaymentPercent: 20,
    mortgageTerm: 20,
};

interface CbrData {
    keyRate: number;
    inflationRate: number;
    depositRate: number;
    date: string;
    source: string;
}

export default function MortgageCalculator() {
    const [inputs, setInputs] = useState<CalculatorInputs>(defaultInputs);
    const [results, setResults] = useState<CalculationResults | null>(null);
    const [apartmentType, setApartmentType] = useState('3');
    const [marketPrices, setMarketPrices] = useState<MarketPrices | null>(null);
    const [isLoadingPrices, setIsLoadingPrices] = useState(false);
    const [priceSource, setPriceSource] = useState<'new' | 'secondary'>('new');
    const [pricePeriod, setPricePeriod] = useState('2');
    const [cbrData, setCbrData] = useState<CbrData | null>(null);

    useEffect(() => {
        const fetchCbrData = async () => {
            try {
                const response = await fetch('/api/cbr');
                const data = await response.json();
                if (data.success && data.data) {
                    setCbrData(data.data);
                }
            } catch (error) {
                console.error('Error fetching CBR data:', error);
            }
        };
        fetchCbrData();
    }, []);

    const fetchMarketPrices = useCallback(async (type: string, period: string) => {
        setIsLoadingPrices(true);
        try {
            const response = await fetch(`/api/prices?type=${type}&period=${period}`);
            const data = await response.json();
            if (data.success && data.data) {
                setMarketPrices(data.data);
                const price = priceSource === 'new'
                    ? data.data.averagePrice.newBuilding
                    : data.data.averagePrice.secondary;
                setInputs(prev => ({ ...prev, apartmentPrice: price }));
            }
        } catch (error) {
            console.error('Error fetching prices:', error);
        } finally {
            setIsLoadingPrices(false);
        }
    }, [priceSource]);

    useEffect(() => {
        fetchMarketPrices(apartmentType, pricePeriod);
    }, [apartmentType, pricePeriod, fetchMarketPrices]);

    useEffect(() => {
        if (marketPrices) {
            const price = priceSource === 'new'
                ? marketPrices.averagePrice.newBuilding
                : marketPrices.averagePrice.secondary;
            setInputs(prev => ({ ...prev, apartmentPrice: price }));
        }
    }, [priceSource, marketPrices]);

    const updateInput = useCallback(
        <K extends keyof CalculatorInputs>(key: K, value: CalculatorInputs[K]) => {
            setInputs((prev) => ({ ...prev, [key]: value }));
        },
        []
    );

    useEffect(() => {
        const newResults = calculateAll(inputs);
        setResults(newResults);
    }, [inputs]);

    const formatInputValue = (value: number) => {
        return value.toLocaleString('ru-RU');
    };

    const parseInputValue = (value: string) => {
        return parseInt(value.replace(/\s/g, '').replace(/,/g, ''), 10) || 0;
    };

    return (
        <TooltipProvider>
            <div className="min-h-screen bg-background">
                {/* Header */}
                <header className="sticky top-0 z-50 border-b border-border bg-card/95 backdrop-blur-sm">
                    <div className="container mx-auto flex items-center justify-between px-4 py-3">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                                <Building2 className="h-4 w-4 text-primary-foreground" />
                            </div>
                            <div>
                                <h1 className="text-base font-semibold text-foreground">
                                    Калькулятор нищеброда
                                </h1>
                                <p className="text-xs text-muted-foreground">
                                    Узнай правду о своих шансах на жильё
                                </p>
                            </div>
                        </div>
                        <Badge variant="outline" className="hidden text-xs sm:flex">
                            <Calculator className="mr-1 h-3 w-3" />
                            v1.0
                        </Badge>
                    </div>
                </header>

                <main className="container mx-auto px-4 py-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Input Section */}
                        <div className="space-y-4">
                            <Tabs defaultValue="property" className="w-full">
                                <TabsList className="grid w-full grid-cols-4">
                                    <TabsTrigger value="property" className="text-xs">
                                        <Home className="h-3 w-3 sm:mr-1" />
                                        <span className="hidden sm:inline">Жильё</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="income" className="text-xs">
                                        <Wallet className="h-3 w-3 sm:mr-1" />
                                        <span className="hidden sm:inline">Доходы</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="mortgage" className="text-xs">
                                        <CreditCard className="h-3 w-3 sm:mr-1" />
                                        <span className="hidden sm:inline">Ипотека</span>
                                    </TabsTrigger>
                                    <TabsTrigger value="formulas" className="text-xs">
                                        <Calculator className="h-3 w-3 sm:mr-1" />
                                        <span className="hidden sm:inline">Формулы</span>
                                    </TabsTrigger>
                                </TabsList>

                                {/* Property Tab */}
                                <TabsContent value="property" className="mt-4">
                                    <Card>
                                        <CardHeader className="bg-primary text-primary-foreground py-3 rounded-t-lg">
                                            <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                                <Home className="h-4 w-4" />
                                                Параметры недвижимости
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4 pt-4">
                                            {/* Market Prices Section */}
                                            <div className="space-y-3 rounded-md border border-border bg-muted/50 p-3">
                                                <div className="flex items-center justify-between">
                                                    <Label className="flex items-center gap-2 text-xs font-medium">
                                                        <Building2 className="h-3 w-3 text-primary" />
                                                        Рыночные цены Москвы
                                                        {marketPrices && (
                                                            <Badge variant="secondary" className="text-[10px]">
                                                                {marketPrices.date}
                                                            </Badge>
                                                        )}
                                                    </Label>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0"
                                                        onClick={() => fetchMarketPrices(apartmentType, pricePeriod)}
                                                        disabled={isLoadingPrices}
                                                    >
                                                        {isLoadingPrices ? (
                                                            <Loader2 className="h-3 w-3 animate-spin" />
                                                        ) : (
                                                            <RefreshCw className="h-3 w-3" />
                                                        )}
                                                    </Button>
                                                </div>

                                                <div className="grid grid-cols-2 gap-3">
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] text-muted-foreground">Тип квартиры</Label>
                                                        <Select value={apartmentType} onValueChange={setApartmentType}>
                                                            <SelectTrigger className="h-8 text-xs">
                                                                <SelectValue placeholder="Выберите тип" />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                {apartmentTypes.map((type) => (
                                                                    <SelectItem key={type.value} value={type.value} className="text-xs">
                                                                        {type.label} (~{type.avgSize} м²)
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                    <div className="space-y-1">
                                                        <Label className="text-[10px] text-muted-foreground">Рынок</Label>
                                                        <Select value={priceSource} onValueChange={(v) => setPriceSource(v as 'new' | 'secondary')}>
                                                            <SelectTrigger className="h-8 text-xs">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent>
                                                                <SelectItem value="new" className="text-xs">Новостройка</SelectItem>
                                                                <SelectItem value="secondary" className="text-xs">Вторичка</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                    </div>
                                                </div>

                                                {marketPrices && (
                                                    <div className="grid grid-cols-2 gap-2 text-xs">
                                                        <div className={`rounded-md p-2 transition-all ${priceSource === 'new' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'}`}>
                                                            <div className="text-[10px] opacity-70">Новостройка</div>
                                                            <div className="font-medium">
                                                                {formatCurrency(marketPrices.pricePerSqm.newBuilding)}/м²
                                                            </div>
                                                        </div>
                                                        <div className={`rounded-md p-2 transition-all ${priceSource === 'secondary' ? 'bg-primary text-primary-foreground' : 'bg-card border border-border'}`}>
                                                            <div className="text-[10px] opacity-70">Вторичка</div>
                                                            <div className="font-medium">
                                                                {formatCurrency(marketPrices.pricePerSqm.secondary)}/м²
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <Separator />

                                            {/* Apartment Price */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="apartmentPrice" className="flex items-center gap-1 text-xs">
                                                        Стоимость квартиры
                                                        <Tooltip>
                                                            <TooltipTrigger>
                                                                <Info className="h-3 w-3 text-muted-foreground" />
                                                            </TooltipTrigger>
                                                            <TooltipContent>
                                                                <p className="text-xs">Текущая рыночная стоимость</p>
                                                            </TooltipContent>
                                                        </Tooltip>
                                                    </Label>
                                                    <span className="text-sm font-semibold text-primary">
                                                        {formatCurrency(inputs.apartmentPrice)}
                                                    </span>
                                                </div>
                                                <Input
                                                    id="apartmentPrice"
                                                    type="text"
                                                    value={formatInputValue(inputs.apartmentPrice)}
                                                    onChange={(e) => updateInput('apartmentPrice', parseInputValue(e.target.value))}
                                                    className="h-8 text-sm font-medium"
                                                />
                                                <Slider
                                                    value={[inputs.apartmentPrice]}
                                                    onValueChange={([value]) => updateInput('apartmentPrice', value)}
                                                    min={1000000}
                                                    max={50000000}
                                                    step={100000}
                                                    className="py-2"
                                                />
                                                <div className="flex justify-between text-[10px] text-muted-foreground">
                                                    <span>1 млн ₽</span>
                                                    <span>50 млн ₽</span>
                                                </div>
                                            </div>

                                            <Separator />

                                            {/* Price Growth Rate */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="flex items-center gap-1 text-xs">
                                                        <TrendingUp className="h-3 w-3 text-primary" />
                                                        Рост цен (% в год)
                                                    </Label>
                                                    <Badge variant="secondary" className="text-xs">{inputs.priceGrowthRate}%</Badge>
                                                </div>
                                                <Slider
                                                    value={[inputs.priceGrowthRate]}
                                                    onValueChange={([value]) => updateInput('priceGrowthRate', value)}
                                                    min={0}
                                                    max={30}
                                                    step={0.5}
                                                    className="py-2"
                                                />
                                                <div className="flex flex-wrap gap-1">
                                                    {[5, 8, 10, 15].map((rate) => (
                                                        <button
                                                            key={rate}
                                                            onClick={() => updateInput('priceGrowthRate', rate)}
                                                            className={`rounded px-2 py-0.5 text-[10px] font-medium transition-all ${inputs.priceGrowthRate === rate
                                                                ? 'bg-primary text-primary-foreground'
                                                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                                                }`}
                                                        >
                                                            {rate}%
                                                        </button>
                                                    ))}
                                                </div>

                                                {marketPrices && marketPrices.history.length > 2 && (
                                                    <div className="mt-2 rounded-md border border-border bg-muted/50 p-2">
                                                        <div className="mb-1 text-[10px] font-medium">
                                                            📈 Рост по данным Restate.ru
                                                        </div>
                                                        <div className="grid grid-cols-2 gap-2 text-center">
                                                            {(() => {
                                                                const history = marketPrices.history;
                                                                const first = history[0];
                                                                const last = history[history.length - 1];
                                                                const months = history.length;
                                                                const newChange = ((last.newBuilding - first.newBuilding) / first.newBuilding) * 100;
                                                                const secChange = ((last.secondary - first.secondary) / first.secondary) * 100;
                                                                const annualizedNew = months > 0 ? (newChange / months) * 12 : 0;
                                                                const annualizedSec = months > 0 ? (secChange / months) * 12 : 0;
                                                                return (
                                                                    <>
                                                                        <button
                                                                            onClick={() => updateInput('priceGrowthRate', Math.round(annualizedNew * 2) / 2)}
                                                                            className="rounded bg-card p-1.5 transition-colors hover:bg-accent border border-border"
                                                                        >
                                                                            <div className="text-[10px] text-muted-foreground">Новостройки</div>
                                                                            <div className={`text-xs font-bold ${annualizedNew >= 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                                                                                {annualizedNew >= 0 ? '↑' : '↓'} {Math.abs(annualizedNew).toFixed(1)}%/год
                                                                            </div>
                                                                        </button>
                                                                        <button
                                                                            onClick={() => updateInput('priceGrowthRate', Math.round(annualizedSec * 2) / 2)}
                                                                            className="rounded bg-card p-1.5 transition-colors hover:bg-accent border border-border"
                                                                        >
                                                                            <div className="text-[10px] text-muted-foreground">Вторичка</div>
                                                                            <div className={`text-xs font-bold ${annualizedSec >= 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                                                                                {annualizedSec >= 0 ? '↑' : '↓'} {Math.abs(annualizedSec).toFixed(1)}%/год
                                                                            </div>
                                                                        </button>
                                                                    </>
                                                                );
                                                            })()}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* Income Tab */}
                                <TabsContent value="income" className="mt-4">
                                    <Card>
                                        <CardHeader className="bg-primary text-primary-foreground py-3 rounded-t-lg">
                                            <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                                <Wallet className="h-4 w-4" />
                                                Доходы и накопления
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4 pt-4">
                                            {/* Salary */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="salary" className="text-xs">Зарплата (в месяц)</Label>
                                                    <span className="text-sm font-semibold text-primary">{formatCurrency(inputs.salary)}</span>
                                                </div>
                                                <Input
                                                    id="salary"
                                                    type="text"
                                                    value={formatInputValue(inputs.salary)}
                                                    onChange={(e) => updateInput('salary', parseInputValue(e.target.value))}
                                                    className="h-8 text-sm font-medium"
                                                />
                                                <Slider
                                                    value={[inputs.salary]}
                                                    onValueChange={([value]) => updateInput('salary', value)}
                                                    min={30000}
                                                    max={1000000}
                                                    step={5000}
                                                    className="py-2"
                                                />
                                            </div>

                                            <Separator />

                                            {/* Salary Growth */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="flex items-center gap-1 text-xs">
                                                        <ArrowUpRight className="h-3 w-3 text-primary" />
                                                        Рост зарплаты (% в год)
                                                    </Label>
                                                    <Badge variant="secondary" className="text-xs">{inputs.salaryGrowthRate}%</Badge>
                                                </div>
                                                <Slider
                                                    value={[inputs.salaryGrowthRate]}
                                                    onValueChange={([value]) => updateInput('salaryGrowthRate', value)}
                                                    min={0}
                                                    max={30}
                                                    step={0.5}
                                                    className="py-2"
                                                />
                                                <div className="flex flex-wrap gap-1">
                                                    {[3, 5, 7, 10].map((rate) => (
                                                        <button
                                                            key={rate}
                                                            onClick={() => updateInput('salaryGrowthRate', rate)}
                                                            className={`rounded px-2 py-0.5 text-[10px] font-medium transition-all ${inputs.salaryGrowthRate === rate
                                                                ? 'bg-primary text-primary-foreground'
                                                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                                                }`}
                                                        >
                                                            {rate}%
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <Separator />

                                            {/* Monthly Savings */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="savings" className="flex items-center gap-1 text-xs">
                                                        <PiggyBank className="h-3 w-3 text-primary" />
                                                        Откладываете в месяц
                                                    </Label>
                                                    <span className="text-sm font-semibold text-primary">{formatCurrency(inputs.monthlySavings)}</span>
                                                </div>
                                                <Input
                                                    id="savings"
                                                    type="text"
                                                    value={formatInputValue(inputs.monthlySavings)}
                                                    onChange={(e) => updateInput('monthlySavings', parseInputValue(e.target.value))}
                                                    className="h-8 text-sm font-medium"
                                                />
                                                <Slider
                                                    value={[inputs.monthlySavings]}
                                                    onValueChange={([value]) => updateInput('monthlySavings', value)}
                                                    min={5000}
                                                    max={500000}
                                                    step={5000}
                                                    className="py-2"
                                                />
                                                <div className="rounded-md bg-muted p-2">
                                                    <p className="text-xs text-muted-foreground">
                                                        Вы откладываете <span className="font-semibold text-primary">{Math.round((inputs.monthlySavings / inputs.salary) * 100)}%</span> от зарплаты
                                                    </p>
                                                </div>
                                                <div className="flex flex-wrap gap-1">
                                                    {[30, 40, 50, 60].map((percent) => (
                                                        <button
                                                            key={percent}
                                                            onClick={() => updateInput('monthlySavings', Math.round(inputs.salary * percent / 100 / 1000) * 1000)}
                                                            className={`rounded px-2 py-0.5 text-[10px] font-medium transition-all ${Math.round((inputs.monthlySavings / inputs.salary) * 100) === percent
                                                                ? 'bg-primary text-primary-foreground'
                                                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                                                }`}
                                                        >
                                                            {percent}% от ЗП
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <Separator />

                                            {/* Initial Savings */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label htmlFor="initialSavings" className="flex items-center gap-1 text-xs">
                                                        <Wallet className="h-3 w-3 text-primary" />
                                                        Уже накоплено
                                                    </Label>
                                                    <span className="text-sm font-semibold text-primary">{formatCurrency(inputs.initialSavings)}</span>
                                                </div>
                                                <Input
                                                    id="initialSavings"
                                                    type="text"
                                                    value={formatInputValue(inputs.initialSavings)}
                                                    onChange={(e) => updateInput('initialSavings', parseInputValue(e.target.value))}
                                                    className="h-8 text-sm font-medium"
                                                />
                                                <Slider
                                                    value={[inputs.initialSavings]}
                                                    onValueChange={([value]) => updateInput('initialSavings', value)}
                                                    min={0}
                                                    max={10000000}
                                                    step={50000}
                                                    className="py-2"
                                                />
                                            </div>

                                            <Separator />

                                            {/* Savings Interest Rate */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="flex items-center gap-1 text-xs">
                                                        <TrendingUp className="h-3 w-3 text-primary" />
                                                        Доходность копилки (% годовых)
                                                    </Label>
                                                    <Badge variant="secondary" className="text-xs">{inputs.savingsInterestRate}%</Badge>
                                                </div>
                                                <Slider
                                                    value={[inputs.savingsInterestRate]}
                                                    onValueChange={([value]) => updateInput('savingsInterestRate', value)}
                                                    min={0}
                                                    max={25}
                                                    step={0.5}
                                                    className="py-2"
                                                />
                                                <div className="flex flex-wrap gap-1">
                                                    {[0, 8, 10, 12, 15].map((rate) => (
                                                        <button
                                                            key={rate}
                                                            onClick={() => updateInput('savingsInterestRate', rate)}
                                                            className={`rounded px-2 py-0.5 text-[10px] font-medium transition-all ${inputs.savingsInterestRate === rate
                                                                ? 'bg-primary text-primary-foreground'
                                                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                                                }`}
                                                        >
                                                            {rate}%
                                                        </button>
                                                    ))}
                                                </div>

                                                {cbrData && (
                                                    <div className="mt-2 space-y-2">
                                                        <div className="rounded-md border border-border bg-muted/50 p-2">
                                                            <div className="mb-1 text-[10px] font-medium">📊 Справка ЦБ РФ ({cbrData.date})</div>
                                                            <div className="grid grid-cols-3 gap-1 text-center">
                                                                <div>
                                                                    <div className="text-[10px] text-muted-foreground">Ключ. ставка</div>
                                                                    <div className="text-xs font-bold text-primary">{cbrData.keyRate}%</div>
                                                                </div>
                                                                <div>
                                                                    <div className="text-[10px] text-muted-foreground">Инфляция</div>
                                                                    <div className="text-xs font-bold text-destructive">{cbrData.inflationRate}%</div>
                                                                </div>
                                                                <button
                                                                    onClick={() => updateInput('savingsInterestRate', cbrData.depositRate)}
                                                                    className="rounded bg-card p-1 transition-colors hover:bg-accent border border-border"
                                                                >
                                                                    <div className="text-[10px] text-muted-foreground">Рекомендуемо</div>
                                                                    <div className="text-xs font-bold text-primary">{cbrData.depositRate}%</div>
                                                                </button>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* Mortgage Tab */}
                                <TabsContent value="mortgage" className="mt-4">
                                    <Card>
                                        <CardHeader className="bg-primary text-primary-foreground py-3 rounded-t-lg">
                                            <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                                <CreditCard className="h-4 w-4" />
                                                Параметры ипотеки
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4 pt-4">
                                            {/* Mortgage Rate */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="flex items-center gap-1 text-xs">
                                                        <Percent className="h-3 w-3 text-primary" />
                                                        Ставка по ипотеке (% годовых)
                                                    </Label>
                                                    <Badge variant={inputs.mortgageRate > 15 ? 'destructive' : 'secondary'} className="text-xs">
                                                        {inputs.mortgageRate}%
                                                    </Badge>
                                                </div>
                                                <Slider
                                                    value={[inputs.mortgageRate]}
                                                    onValueChange={([value]) => updateInput('mortgageRate', value)}
                                                    min={1}
                                                    max={30}
                                                    step={0.1}
                                                    className="py-2"
                                                />
                                                <div className="flex flex-wrap gap-1">
                                                    {[6, 12, 18, 24].map((rate) => (
                                                        <button
                                                            key={rate}
                                                            onClick={() => updateInput('mortgageRate', rate)}
                                                            className={`rounded px-2 py-0.5 text-[10px] font-medium transition-all ${inputs.mortgageRate === rate
                                                                ? 'bg-primary text-primary-foreground'
                                                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                                                }`}
                                                        >
                                                            {rate}%
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <Separator />

                                            {/* Down Payment */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="flex items-center gap-1 text-xs">
                                                        <Target className="h-3 w-3 text-primary" />
                                                        Первоначальный взнос
                                                    </Label>
                                                    <div className="text-right">
                                                        <Badge variant="secondary" className="text-xs">{inputs.downPaymentPercent}%</Badge>
                                                        <p className="mt-0.5 text-xs font-medium text-primary">
                                                            {formatCurrency(inputs.apartmentPrice * (inputs.downPaymentPercent / 100))}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Slider
                                                    value={[inputs.downPaymentPercent]}
                                                    onValueChange={([value]) => updateInput('downPaymentPercent', value)}
                                                    min={10}
                                                    max={90}
                                                    step={5}
                                                    className="py-2"
                                                />
                                                <div className="flex flex-wrap gap-1">
                                                    {[15, 20, 30, 50].map((rate) => (
                                                        <button
                                                            key={rate}
                                                            onClick={() => updateInput('downPaymentPercent', rate)}
                                                            className={`rounded px-2 py-0.5 text-[10px] font-medium transition-all ${inputs.downPaymentPercent === rate
                                                                ? 'bg-primary text-primary-foreground'
                                                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                                                }`}
                                                        >
                                                            {rate}%
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <Separator />

                                            {/* Mortgage Term */}
                                            <div className="space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <Label className="flex items-center gap-1 text-xs">
                                                        <Calendar className="h-3 w-3 text-primary" />
                                                        Срок ипотеки
                                                    </Label>
                                                    <Badge variant="secondary" className="text-xs">{inputs.mortgageTerm} лет</Badge>
                                                </div>
                                                <Slider
                                                    value={[inputs.mortgageTerm]}
                                                    onValueChange={([value]) => updateInput('mortgageTerm', value)}
                                                    min={1}
                                                    max={30}
                                                    step={1}
                                                    className="py-2"
                                                />
                                                <div className="flex flex-wrap gap-1">
                                                    {[10, 15, 20, 25, 30].map((term) => (
                                                        <button
                                                            key={term}
                                                            onClick={() => updateInput('mortgageTerm', term)}
                                                            className={`rounded px-2 py-0.5 text-[10px] font-medium transition-all ${inputs.mortgageTerm === term
                                                                ? 'bg-primary text-primary-foreground'
                                                                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                                                                }`}
                                                        >
                                                            {term} лет
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>

                                {/* Formulas Tab */}
                                <TabsContent value="formulas" className="mt-4">
                                    <Card>
                                        <CardHeader className="bg-primary text-primary-foreground py-3 rounded-t-lg">
                                            <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                                <Calculator className="h-4 w-4" />
                                                Формулы расчёта
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3 pt-4 text-xs">
                                            <div className="rounded-md bg-muted p-3">
                                                <h4 className="mb-1 font-semibold text-primary">1. Первоначальный взнос</h4>
                                                <div className="space-y-0.5 font-mono text-[10px]">
                                                    <p>ПВ = Цена × (% взноса / 100)</p>
                                                    <p className="text-muted-foreground">
                                                        ПВ = {formatCurrency(inputs.apartmentPrice)} × ({inputs.downPaymentPercent}% / 100)
                                                    </p>
                                                    <p className="font-bold text-primary">= {formatCurrency(inputs.apartmentPrice * inputs.downPaymentPercent / 100)}</p>
                                                </div>
                                            </div>

                                            <div className="rounded-md bg-muted p-3">
                                                <h4 className="mb-1 font-semibold text-primary">2. Месяцев до накопления ПВ</h4>
                                                <div className="space-y-0.5 font-mono text-[10px]">
                                                    <p>Итерация: накопления += (накопления × ставка/12) + взнос</p>
                                                    <p className="text-muted-foreground">
                                                        Начальные: {formatCurrency(inputs.initialSavings)}, Взнос: {formatCurrency(inputs.monthlySavings)}/мес
                                                    </p>
                                                    <p className="font-bold text-primary">= {results?.monthsToDownPayment || 0} мес ({formatMonths(results?.monthsToDownPayment || 0)})</p>
                                                </div>
                                            </div>

                                            <div className="rounded-md bg-muted p-3">
                                                <h4 className="mb-1 font-semibold text-primary">3. Цена через N месяцев</h4>
                                                <div className="space-y-0.5 font-mono text-[10px]">
                                                    <p>Цена_будущая = Цена × (1 + рост/100)^(месяцев/12)</p>
                                                    <p className="font-bold text-primary">= {formatCurrency(results?.futureApartmentPrice || inputs.apartmentPrice)}</p>
                                                </div>
                                            </div>

                                            <div className="rounded-md bg-muted p-3">
                                                <h4 className="mb-1 font-semibold text-primary">4. Ежемесячный платёж (аннуитет)</h4>
                                                <div className="space-y-0.5 font-mono text-[10px]">
                                                    <p>r = ставка/12/100, n = срок × 12</p>
                                                    <p>Платёж = Сумма × r × (1+r)^n / ((1+r)^n - 1)</p>
                                                    <p className="font-bold text-primary">Платёж = {formatCurrency(results?.monthlyPayment || 0)}</p>
                                                </div>
                                            </div>

                                            <div className="rounded-md bg-muted p-3">
                                                <h4 className="mb-1 font-semibold text-primary">5. Итоговая стоимость ипотеки</h4>
                                                <div className="space-y-0.5 font-mono text-[10px]">
                                                    <p>Всего = ПВ + (Платёж × срок × 12)</p>
                                                    <p className="font-bold text-primary">= {formatCurrency(results?.totalMortgageCost || 0)}</p>
                                                    <p className="text-muted-foreground">
                                                        Переплата: {formatCurrency(results?.totalInterest || 0)}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="rounded-md bg-muted p-3">
                                                <h4 className="mb-1 font-semibold text-primary">6. Накопить всю сумму</h4>
                                                <div className="space-y-0.5 font-mono text-[10px]">
                                                    <p>Цель растёт: {inputs.priceGrowthRate}%/год</p>
                                                    <p>Накопления растут: {inputs.savingsInterestRate}%/год + {formatCurrency(inputs.monthlySavings)}/мес</p>
                                                    <p className="font-bold text-primary">= {results?.monthsToFullPrice || 0} мес ({formatMonths(results?.monthsToFullPrice || 0)})</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </TabsContent>
                            </Tabs>
                        </div>

                        {/* Results Section */}
                        <div className="space-y-4">
                            {results && (
                                <>
                                    {/* Main Results Card */}
                                    <Card>
                                        <CardHeader className="bg-primary text-primary-foreground py-3 rounded-t-lg">
                                            <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                                <Calculator className="h-4 w-4" />
                                                Результаты расчёта
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="p-0">
                                            <div className="grid grid-cols-1 divide-y sm:grid-cols-2 sm:divide-x sm:divide-y-0">
                                                <div className="p-4">
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Clock className="h-3 w-3" />
                                                        Накопите на ПВ за
                                                    </div>
                                                    <p className="mt-1 text-2xl font-bold text-primary">{formatMonths(results.monthsToDownPayment)}</p>
                                                    <p className="text-xs text-muted-foreground">На сумму {formatCurrency(results.requiredDownPayment)}</p>
                                                </div>
                                                <div className="p-4">
                                                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                                        <Target className="h-3 w-3" />
                                                        Полная стоимость за
                                                    </div>
                                                    <p className="mt-1 text-2xl font-bold text-primary">{formatMonths(results.monthsToFullPrice)}</p>
                                                    <p className="text-xs text-muted-foreground">Без ипотеки</p>
                                                </div>
                                            </div>

                                            <Separator />

                                            <div className="bg-muted/50 p-3">
                                                <div className="flex items-start gap-2">
                                                    <ArrowUpRight className="mt-0.5 h-4 w-4 text-primary" />
                                                    <div>
                                                        <p className="text-xs font-medium">Будущая стоимость квартиры</p>
                                                        <p className="text-lg font-bold text-primary">{formatCurrency(results.futureApartmentPrice)}</p>
                                                        <p className="text-[10px] text-muted-foreground">
                                                            К моменту накопления ПВ (+{formatCurrency(results.futureApartmentPrice - inputs.apartmentPrice)})
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Mortgage Details */}
                                    <Card>
                                        <CardHeader className="py-3">
                                            <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                                <CreditCard className="h-4 w-4 text-primary" />
                                                Расчёт ипотеки
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-3 pt-0">
                                            <div className="rounded-md bg-muted p-3">
                                                <span className="text-xs text-muted-foreground">Ежемесячный платёж</span>
                                                <span className="block text-xl font-bold text-primary">{formatCurrency(results.monthlyMortgagePayment)}</span>
                                            </div>

                                            <div className="grid grid-cols-2 gap-2">
                                                <div className="rounded-md bg-muted p-3">
                                                    <p className="text-[10px] text-muted-foreground">Сумма кредита</p>
                                                    <p className="text-sm font-semibold">{formatCurrency(results.futureApartmentPrice - results.requiredDownPayment)}</p>
                                                </div>
                                                <div className="rounded-md bg-muted p-3">
                                                    <p className="text-[10px] text-muted-foreground">Всего выплатите</p>
                                                    <p className="text-sm font-semibold">{formatCurrency(results.totalMortgagePayment)}</p>
                                                </div>
                                            </div>

                                            <div className="rounded-md border-2 border-destructive/50 bg-destructive/10 p-3">
                                                <div className="flex items-center gap-1">
                                                    <ArrowDownRight className="h-4 w-4 text-destructive" />
                                                    <span className="text-xs font-medium">Переплата по ипотеке</span>
                                                </div>
                                                <p className="mt-0.5 text-xl font-bold text-destructive">{formatCurrency(results.mortgageOverpayment)}</p>
                                                <p className="text-[10px] text-muted-foreground">
                                                    {Math.round((results.mortgageOverpayment / (results.futureApartmentPrice - results.requiredDownPayment)) * 100)}% от суммы кредита
                                                </p>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    {/* Recommendation */}
                                    <Card className="border-2 border-primary">
                                        <CardHeader className="py-3">
                                            <CardTitle className="flex items-center gap-2 text-sm font-medium text-primary">
                                                <PiggyBank className="h-4 w-4" />
                                                Рекомендация
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="pt-0">
                                            <p className="text-xs text-muted-foreground">
                                                Чтобы накопить на ПВ за <span className="font-semibold text-foreground">2 года</span>, откладывайте:
                                            </p>
                                            <p className="mt-1 text-2xl font-bold text-primary">{formatCurrency(results.recommendedMonthlySavings)}</p>
                                            <p className="text-[10px] text-muted-foreground">ежемесячно (с учётом роста цен)</p>
                                        </CardContent>
                                    </Card>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Projection Table */}
                    {results && results.monthlyProjection.length > 0 && (
                        <Card className="mt-6">
                            <CardHeader className="py-3">
                                <CardTitle className="flex items-center gap-2 text-sm font-medium">
                                    <TrendingUp className="h-4 w-4 text-primary" />
                                    Прогноз накоплений
                                </CardTitle>
                                <CardDescription className="text-xs">Помесячная проекция накоплений и роста цены</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-xs">
                                        <thead>
                                            <tr className="border-b bg-muted">
                                                <th className="px-3 py-2 text-left font-medium">Период</th>
                                                <th className="px-3 py-2 text-right font-medium">Цена квартиры</th>
                                                <th className="px-3 py-2 text-right font-medium">Цель (ПВ)</th>
                                                <th className="px-3 py-2 text-right font-medium">Накоплено</th>
                                                <th className="px-3 py-2 text-right font-medium">Разница</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {results.monthlyProjection
                                                .filter((_, i) => i % 12 === 0 || i === results.monthsToDownPayment)
                                                .slice(0, 11)
                                                .map((row) => (
                                                    <tr
                                                        key={row.month}
                                                        className={`border-b transition-colors hover:bg-muted/50 ${row.month === results.monthsToDownPayment ? 'bg-primary/10' : ''}`}
                                                    >
                                                        <td className="px-3 py-2 font-medium">{row.month === 0 ? 'Сейчас' : formatMonths(row.month)}</td>
                                                        <td className="px-3 py-2 text-right">{formatCurrency(row.apartmentPrice)}</td>
                                                        <td className="px-3 py-2 text-right">{formatCurrency(row.downPaymentTarget)}</td>
                                                        <td className="px-3 py-2 text-right font-medium text-primary">{formatCurrency(row.totalSavings)}</td>
                                                        <td className={`px-3 py-2 text-right font-medium ${row.surplus >= 0 ? 'text-primary' : 'text-muted-foreground'}`}>
                                                            {row.surplus >= 0 ? '+' : ''}{formatCurrency(row.surplus)}
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </main>

                {/* Price Chart Section */}
                <section className="container mx-auto px-4 pb-6">
                    <PriceChart
                        data={marketPrices?.history || []}
                        isLoading={isLoadingPrices}
                        period={pricePeriod}
                        onPeriodChange={setPricePeriod}
                    />
                </section>

                {/* Footer */}
                <footer className="border-t border-border bg-card py-4">
                    <div className="container mx-auto px-4 text-center text-[10px] text-muted-foreground">
                        <p>Калькулятор нищеброда — честный инструмент для планирования покупки недвижимости</p>
                        <p className="mt-0.5">Расчёты носят информационный характер и не являются финансовой консультацией</p>
                    </div>
                </footer>
            </div>
        </TooltipProvider>
    );
}
