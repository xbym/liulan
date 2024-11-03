// src/components/SolBalance.tsx
'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface SolBalanceProps {
  walletAddress: string;
}

export default function SolBalance({ walletAddress }: SolBalanceProps) {
  const [balance, setBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBalance = async () => {
    if (!walletAddress) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://pro-api.solscan.io/v2.0/account/info?address=${walletAddress}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'token': process.env.NEXT_PUBLIC_SOLSCAN_API_KEY || ''
        }
      });

      if (!response.ok) {
        throw new Error('获取SOL余额失败');
      }

      const data = await response.json();
      if (data.success && data.data) {
        // Convert lamports to SOL (1 SOL = 10^9 lamports)
        const solBalance = parseFloat(data.data.lamports) / 1000000000;
        setBalance(solBalance);
      } else {
        throw new Error(data.message || '获取SOL余额失败');
      }
    } catch (error) {
      console.error('获取SOL余额错误:', error);
      setError(error instanceof Error ? error.message : '未知错误');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBalance();
    // 设置定时刷新
    const intervalId = setInterval(fetchBalance, 30000); // 每30秒刷新一次

    return () => clearInterval(intervalId);
  }, [walletAddress]);

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex justify-between items-center">
          SOL 余额
          {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <div className="text-red-500 text-sm">{error}</div>
        ) : (
          <div className="text-2xl font-bold">
            {balance !== null ? `${balance.toFixed(4)} SOL` : '加载中...'}
          </div>
        )}
      </CardContent>
    </Card>
  );
}