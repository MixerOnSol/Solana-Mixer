"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

// Mock data
const data = [
  { date: "May 12", earned: 0.5, distributed: 0.45 },
  { date: "May 13", earned: 1.2, distributed: 1.1 },
  { date: "May 14", earned: 0.8, distributed: 0.75 },
  { date: "May 15", earned: 1.5, distributed: 1.4 },
  { date: "May 16", earned: 2.3, distributed: 2.2 },
  { date: "May 17", earned: 3.1, distributed: 2.9 },
  { date: "May 18", earned: 2.5, distributed: 2.4 },
  { date: "May 19", earned: 3.8, distributed: 3.6 },
  { date: "May 20", earned: 4.2, distributed: 4.0 },
  { date: "May 21", earned: 5.0, distributed: 4.8 },
]

export function PayoutChart() {
  const [activeTab, setActiveTab] = useState("week")

  return (
    <Card>
      <CardHeader>
        <CardTitle>Revenue & Distributions</CardTitle>
        <CardDescription>SOL earned from creator fees vs. SOL distributed to recipients</CardDescription>
        <Tabs defaultValue="week" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="day">Day</TabsTrigger>
            <TabsTrigger value="week">Week</TabsTrigger>
            <TabsTrigger value="month">Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        <div className="h-[300px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{
                top: 5,
                right: 10,
                left: 10,
                bottom: 0,
              }}
            >
              <defs>
                <linearGradient id="colorEarned" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorDistributed" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis
                stroke="#888888"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => `${value} SOL`}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(var(--card))",
                  borderColor: "hsl(var(--border))",
                  borderRadius: "6px",
                  fontSize: "12px",
                }}
                formatter={(value: number) => [`${value.toFixed(2)} SOL`, undefined]}
              />
              <Area
                type="monotone"
                dataKey="earned"
                stroke="#10b981"
                fillOpacity={1}
                fill="url(#colorEarned)"
                name="Earned"
              />
              <Area
                type="monotone"
                dataKey="distributed"
                stroke="#6366f1"
                fillOpacity={1}
                fill="url(#colorDistributed)"
                name="Distributed"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  )
}
