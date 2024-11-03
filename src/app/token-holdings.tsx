'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Loader2, RefreshCw } from "lucide-react"
import { toast } from "@/components/ui/use-toast"

interface TokenHolding {
  token_account: string;
  token_address: string;
  amount: string;
  token_decimals: number;
  owner: string;
}

interface TokenMetadata {
  address: string;
  name: string;
  symbol: string;
  icon: string;
  decimals: number;
  price: number;
  volume_24h: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_24h: number;
  supply: string;
  holder: number;
}

interface TokenHoldingsProps {
  walletAddress: string;
}

export default function TokenHoldings({ walletAddress }: TokenHoldingsProps = { walletAddress: '' }) {
  const [holdings, setHoldings] = useState<TokenHolding[]>([])
  const [tokenMetadata, setTokenMetadata] = useState<Record<string, TokenMetadata>>({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchHoldings = useCallback(async (address: string) => {
    if (!address) return
    
    setIsLoading(true)
    setError(null)

    const apiKey = process.env.NEXT_PUBLIC_SOLSCAN_API_KEY
    if (!apiKey) {
      setError('API密钥未设置')
      setIsLoading(false)
      return
    }

    const requestOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "token": apiKey
      }
    }

    try {
      const response = await fetch(`https://pro-api.solscan.io/v2.0/account/token-accounts?type=token&page=1&page_size=10&hide_zero=true&address=${address}`, requestOptions)
      
      if (!response.ok) {
        throw new Error(`获取代币持仓失败: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      if (data.success) {
        const nonZeroHoldings = data.data.filter((token: TokenHolding) => 
          BigInt(token.amount) > BigInt(0)
        )
        setHoldings(nonZeroHoldings)
        await fetchTokenMetadata(nonZeroHoldings)
      } else {
        throw new Error(data.message || '获取代币持仓失败')
      }
    } catch (error) {
      console.error('获取代币持仓错误:', error)
      setError(error instanceof Error ? error.message : '发生未知错误')
      toast({
        title: "错误",
        description: "获取代币持仓失败，请稍后重试。",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }, [])

  const fetchTokenMetadata = async (tokens: TokenHolding[]) => {
    const apiKey = process.env.NEXT_PUBLIC_SOLSCAN_API_KEY
    if (!apiKey) {
      console.error('API密钥未设置')
      return
    }

    const requestOptions = {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "token": apiKey
      }
    }

    const metadataPromises = tokens.map(token => 
      fetch(`https://pro-api.solscan.io/v2.0/token/meta?address=${token.token_address}`, requestOptions)
        .then(response => response.json())
        .then(response => {
          if (response.success) {
            return { [token.token_address]: response.data }
          }
          return null
        })
        .catch(err => {
          console.error(`获取代币元数据错误 (${token.token_address}):`, err)
          return null
        })
    )

    const metadataResults = await Promise.all(metadataPromises)
    const newMetadata = metadataResults.reduce((acc, result) => {
      if (result) {
        return { ...acc, ...result }
      }
      return acc
    }, {})

    setTokenMetadata(prevMetadata => ({ ...prevMetadata, ...newMetadata }))
  }

  useEffect(() => {
    if (walletAddress) {
      fetchHoldings(walletAddress)
    }
  }, [walletAddress, fetchHoldings])

  const handleRefresh = () => {
    fetchHoldings(walletAddress)
  }

  const formatAmount = (amount: string, decimals: number) => {
    const value = BigInt(amount)
    const divisor = BigInt(10 ** decimals)
    const integerPart = value / divisor
    const fractionalPart = value % divisor
    const paddedFractional = fractionalPart.toString().padStart(decimals, '0')
    return `${integerPart}.${paddedFractional.slice(0, 4)}`
  }

  const calculateValue = (amount: string, decimals: number, price: number) => {
    const formattedAmount = parseFloat(formatAmount(amount, decimals));
    const value = formattedAmount * price;
    return value.toFixed(2);
  }

  return (
    <Card className="w-full mt-6">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>代币持仓</CardTitle>
          <Button 
            variant="outline" 
            size="icon"
            onClick={handleRefresh}
            disabled={isLoading}
            className="bg-gray-200 text-gray-500 hover:text-black"
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4" />
            )}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="text-red-500 mb-4">{error}</div>
        )}
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>代币名称</TableHead>
                <TableHead className="text-right">数量</TableHead>
                <TableHead className="text-right">价值 (USD)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {holdings.length > 0 ? (
                holdings.map((token, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <span
                        className="cursor-pointer hover:underline"
                        onClick={() => {
                          navigator.clipboard.writeText(token.token_address);
                          toast({
                            title: "已复制",
                            description: "代币合约地址已复制到剪贴板",
                          });
                        }}
                      >
                        {tokenMetadata[token.token_address] ? (
                          tokenMetadata[token.token_address].name
                        ) : (
                          '加载中...'
                        )}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      {formatAmount(token.amount, token.token_decimals)}
                    </TableCell>
                    <TableCell className="text-right">
                      {tokenMetadata[token.token_address] ? (
                        `$${calculateValue(token.amount, token.token_decimals, tokenMetadata[token.token_address].price)}`
                      ) : (
                        '加载中...'
                      )}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="h-24 text-center">
                    {isLoading ? '加载中...' : '没有找到代币持仓'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}