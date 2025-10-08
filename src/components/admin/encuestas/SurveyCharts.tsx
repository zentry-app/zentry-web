'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  BarChart3, 
  PieChart as PieChartIcon, 
  TrendingUp,
  Users,
  Star,
  Hash,
  Clock
} from 'lucide-react';

interface ChartData {
  name: string;
  value: number;
  count: number;
  percentage: number;
  color?: string;
}

interface SurveyChartsProps {
  questionResults: Array<{
    questionIndex: number;
    question: string;
    type: string;
    results: any;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D', '#FFC658', '#FF7C7C'];

export function SurveyCharts({ questionResults }: SurveyChartsProps) {
  const getChartData = (questionResult: any): ChartData[] => {
    const { type, results } = questionResult;
    
    switch (type) {
      case 'siNo':
        return Object.entries(results.counts || {}).map(([option, count], index) => ({
          name: option,
          value: count as number,
          count: count as number,
          percentage: results.total > 0 ? ((count as number) / results.total) * 100 : 0,
          color: COLORS[index % COLORS.length]
        }));

      case 'opcionUnica':
      case 'opcionMultiple':
        return (results.options || []).map((option: string, index: number) => ({
          name: option,
          value: results.counts[option] || 0,
          count: results.counts[option] || 0,
          percentage: results.total > 0 ? ((results.counts[option] || 0) / results.total) * 100 : 0,
          color: COLORS[index % COLORS.length]
        }));

      case 'escalaLikert':
        return [5, 4, 3, 2, 1].map((value, index) => ({
          name: ['Muy de acuerdo', 'De acuerdo', 'Neutral', 'En desacuerdo', 'Muy en desacuerdo'][index],
          value: results.distribution[value] || 0,
          count: results.distribution[value] || 0,
          percentage: results.total > 0 ? ((results.distribution[value] || 0) / results.total) * 100 : 0,
          color: COLORS[index % COLORS.length]
        }));

      case 'escalaNumero':
        return Object.entries(results.distribution || {}).map(([value, count], index) => ({
          name: value,
          value: count as number,
          count: count as number,
          percentage: results.total > 0 ? ((count as number) / results.total) * 100 : 0,
          color: COLORS[index % COLORS.length]
        }));

      default:
        return [];
    }
  };

  const renderBarChart = (questionResult: any, index: number) => {
    const data = getChartData(questionResult);
    if (data.length === 0) return null;

    return (
      <Card key={index} className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Pregunta {questionResult.questionIndex + 1}: {questionResult.question}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="name" 
                  angle={-45}
                  textAnchor="end"
                  height={100}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value: any, name: string) => [
                    `${value} (${data.find(d => d.name === name)?.percentage.toFixed(1)}%)`,
                    'Respuestas'
                  ]}
                />
                <Legend />
                <Bar dataKey="value" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderPieChart = (questionResult: any, index: number) => {
    const data = getChartData(questionResult);
    if (data.length === 0) return null;

    return (
      <Card key={index} className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PieChartIcon className="h-5 w-5" />
            Pregunta {questionResult.questionIndex + 1}: {questionResult.question}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percentage }) => `${name}: ${percentage.toFixed(1)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: any) => [
                    `${value} respuestas`,
                    'Cantidad'
                  ]}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderLineChart = (questionResult: any, index: number) => {
    const data = getChartData(questionResult);
    if (data.length === 0) return null;

    return (
      <Card key={index} className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Pregunta {questionResult.questionIndex + 1}: {questionResult.question}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip 
                  formatter={(value: any) => [
                    `${value} respuestas`,
                    'Cantidad'
                  ]}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="value" 
                  stroke="#8884d8" 
                  fill="#8884d8" 
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    );
  };

  const getChartType = (questionType: string) => {
    switch (questionType) {
      case 'siNo':
      case 'opcionUnica':
        return 'pie';
      case 'opcionMultiple':
      case 'escalaLikert':
        return 'bar';
      case 'escalaNumero':
        return 'line';
      default:
        return 'bar';
    }
  };

  const renderChart = (questionResult: any, index: number) => {
    const chartType = getChartType(questionResult.type);
    
    switch (chartType) {
      case 'pie':
        return renderPieChart(questionResult, index);
      case 'line':
        return renderLineChart(questionResult, index);
      default:
        return renderBarChart(questionResult, index);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Visualizaciones de Datos
        </h3>
        <Badge variant="outline">
          {questionResults.length} gráficas
        </Badge>
      </div>
      
      {questionResults.map((questionResult, index) => 
        renderChart(questionResult, index)
      )}
    </div>
  );
}
