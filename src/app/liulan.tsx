'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { ScrollArea } from "@/components/ui/scroll-area"
import WalletImportModal from './wallet-import-modal'
import TokenHoldings from './token-holdings'

interface StopGroup {
  pricePercent: number;
  amountPercent: number;
}

interface CustomPnlConfig {
  priorityFee: string;
  jitoEnabled: boolean;
  jitoTip: number;
  maxSlippage: number;
  concurrentNodes: number;
  retries: number;
}

interface Wallet {
  id: string;
  name: string;
  type: string;
  address: string;
}

interface WalletResponse {
  err: boolean;
  res: Wallet[];
  docs: string;
}

export default function TokenBrowserAndQuickTrade() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [selectedWalletAddress, setSelectedWalletAddress] = useState<string>('');

  const [tradingPair, setTradingPair] = useState<string>('');
  const [walletId, setWalletId] = useState<string>('');
  const [priorityFee, setPriorityFee] = useState<string>('');
  const [jitoEnabled, setJitoEnabled] = useState<boolean>(true);
  const [jitoTip, setJitoTip] = useState<number>(0.001);
  const [maxSlippage, setMaxSlippage] = useState<number>(0.1);
  const [concurrentNodes, setConcurrentNodes] = useState<number>(2);
  const [retries, setRetries] = useState<number>(1);
  const [amountOrPercent, setAmountOrPercent] = useState<number>(0.1);
  const [stopEarnPercent, setStopEarnPercent] = useState<number>(0.5);
  const [stopLossPercent, setStopLossPercent] = useState<number>(0.5);
  const [stopEarnGroup, setStopEarnGroup] = useState<StopGroup[]>([
    { pricePercent: 0.5, amountPercent: 1 }
  ]);
  const [stopLossGroup, setStopLossGroup] = useState<StopGroup[]>([
    { pricePercent: 0.5, amountPercent: 1 }
  ]);
  const [pnlCustomConfigEnabled, setPnlCustomConfigEnabled] = useState<boolean>(true);
  const [pnlCustomConfig, setPnlCustomConfig] = useState<CustomPnlConfig>({
    priorityFee: '',
    jitoEnabled: true,
    jitoTip: 0.001,
    maxSlippage: 0.1,
    concurrentNodes: 2,
    retries: 1
  });

  const [chartUrl, setChartUrl] = useState('');
  const baseUrl = 'https://www.gmgn.cc/kline/sol/';

  useEffect(() => {
    setStopEarnGroup([{ pricePercent: stopEarnPercent, amountPercent: 1 }]);
  }, [stopEarnPercent]);

  useEffect(() => {
    setStopLossGroup([{ pricePercent: stopLossPercent, amountPercent: 1 }]);
  }, [stopLossPercent]);

  const fetchWallets = useCallback(async () => {
    if (!apiKey) return;
    
    try {
      const response = await fetch('https://api-bot-v1.dbotx.com/account/wallets?type=solana', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey
        }
      });

      if (!response.ok) {
        throw new Error('获取钱包列表失败');
      }

      const data: WalletResponse = await response.json();
      if (data.err) {
        throw new Error('获取钱包列表失败');
      }
      setWallets(data.res);
    } catch (error) {
      console.error('获取钱包列表时出错:', error);
      alert('获取钱包列表失败，请重试。');
    }
  }, [apiKey]);

  useEffect(() => {
    if (apiKey) {
      fetchWallets();
    }
  }, [apiKey, fetchWallets]);

  const handleImport = async (importApiKey: string, privateKeys: string, onlyImportApiKey: boolean) => {
    setIsImporting(true);
    try {
      if (onlyImportApiKey) {
        setApiKey(importApiKey);
        alert('API Key 已成功保存');
      } else {
        const response = await fetch('https://api-bot-v1.dbotx.com/account/wallets', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-KEY': importApiKey
          },
          body: JSON.stringify({
            type: 'solana',
            privateKeys: privateKeys.split('\n').map(key => key.trim()).filter(key => key !== '')
          })
        });

        if (!response.ok) {
          throw new Error('导入失败');
        }

        await response.json();
        setApiKey(importApiKey);
        alert(`成功导入钱包`);
      }
      setIsModalOpen(false);
      await fetchWallets();
    } catch (error) {
      console.error('导入钱包时出错:', error);
      alert(error instanceof Error ? error.message : "导入钱包时发生未知错误");
    } finally {
      setIsImporting(false);
    }
  };

  const handleWalletSelect = (wallet: Wallet) => {
    setWalletId(wallet.id);
    setSelectedWalletAddress(wallet.address);
  };

  const handleQuickTradeSubmit = async (type: 'buy' | 'sell') => {
    if (!tradingPair || !walletId || !apiKey) {
      alert('请填写所有必要字段并确保已导入钱包');
      return;
    }

    const requestData = {
      chain: 'solana',
      pair: tradingPair,
      walletId: walletId,
      type: type,
      priorityFee: priorityFee,
      jitoEnabled: jitoEnabled,
      jitoTip: jitoTip,
      maxSlippage: maxSlippage,
      concurrentNodes: concurrentNodes,
      retries: retries,
      amountOrPercent: amountOrPercent,
      stopEarnPercent: stopEarnPercent,
      stopLossPercent: stopLossPercent,
      stopEarnGroup: stopEarnGroup,
      stopLossGroup: stopLossGroup,
      pnlCustomConfigEnabled: pnlCustomConfigEnabled,
      pnlCustomConfig: pnlCustomConfig
    };

    try {
      const response = await fetch('https://api-bot-v1.dbotx.com/automation/swap_order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': apiKey
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        throw new Error('创建交易订单失败');
      }

      const data = await response.json();
      console.log('交易订单已创建:', data);
      alert('交易订单创建成功！');
    } catch (error) {
      console.error('创建交易订单时出错:', error);
      alert('创建交易订单失败。请重试。');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 p-4">
      <div className="fixed right-4 top-4 z-50 flex flex-col items-end">
        <div className="text-sm text-gray-600 mb-4 p-4 bg-blue-50 rounded-lg max-w-xs">
          请先使用<a href="https://dbotx.com/?ref=81930897" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">该链接</a>注册dbot账户，然后打开API界面复制APIKey后回到本网站输入即可导入。
        </div>
        <Button
          className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white font-medium"
          onClick={() => setIsModalOpen(true)}
        >
          导入钱包
        </Button>
      </div>

      <WalletImportModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onImport={handleImport}
        isImporting={isImporting}
      />

      <div className="mx-auto max-w-[1600px] space-y-8 pt-8">
        <h1 className="text-center text-3xl font-bold text-gray-900">
          SOL 代币浏览器与快速交易
        </h1>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* Left Column - Chart and Holdings */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>代币信息</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <Input
                      value={tradingPair}
                      onChange={(e) => {
                        const value = e.target.value;
                        setTradingPair(value);
                        if (value) {
                          setChartUrl(`${baseUrl}${value}`);
                        } else {
                          setChartUrl('');
                        }
                      }}
                      placeholder="输入代币合约地址"
                      className="flex-1"
                    />
                  </div>
                  {chartUrl && (
                    <iframe
                      src={chartUrl}
                      className="w-full h-[600px] rounded-lg"
                      title="代币信息"
                    />
                  )}
                </div>
              </CardContent>
            </Card>

            {selectedWalletAddress && (
              <TokenHoldings walletAddress={selectedWalletAddress} />
            )}
          </div>

          {/* Right Column - Trading Controls */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle>快速交易</CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[calc(100vh-200px)] pr-4">
                  <div className="space-y-6">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label>选择钱包</Label>
                        <div className="grid grid-cols-1 gap-2">
                          {wallets && wallets.length > 0 ? (
                            wallets.map((wallet) => (
                              <div
                                key={wallet.id}
                                className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                                  walletId === wallet.id
                                    ? 'bg-primary text-primary-foreground font-bold'
                                    : 'bg-background hover:bg-accent hover:text-accent-foreground'
                                }`}
                                onClick={() => handleWalletSelect(wallet)}
                              >
                                <div className="font-medium">{wallet.address}</div>
                                {walletId === wallet.id && (
                                  <div className="mt-2 text-sm">✓ 已选择</div>
                                )}
                              </div>
                            ))
                          ) : (
                            <div className="text-center py-4 text-muted-foreground">
                              {apiKey ? '正在加载钱包...' : '暂无可用钱包，请先导入API Key'}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="amountOrPercent">数量或百分比</Label>
                          <Input
                            id="amountOrPercent"
                            type="number"
                            value={amountOrPercent}
                            onChange={(e) => setAmountOrPercent(Number(e.target.value))}
                            step="0.01"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="priorityFee">优先费 (SOL)</Label>
                          <Input
                            id="priorityFee"
                            value={priorityFee}
                            onChange={(e) => setPriorityFee(e.target.value)}
                            placeholder="留空表示自动"
                          />
                        </div>
                      </div>
                    </div>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">防夹设置</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label htmlFor="jitoEnabled">启用防夹</Label>
                          <Switch
                            id="jitoEnabled"
                            checked={jitoEnabled}
                            onCheckedChange={setJitoEnabled}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="jitoTip">防夹费 (SOL)</Label>
                          <Input
                            id="jitoTip"
                            type="number"
                            value={jitoTip}
                            onChange={(e) => setJitoTip(Number(e.target.value))}
                            step="0.001"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">交易设置</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="maxSlippage">最大滑点</Label>
                          <Input
                            id="maxSlippage"
                            type="number"
                            value={maxSlippage}
                            onChange={(e)=> setMaxSlippage(Number(e.target.value))}
                            step="0.01"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="concurrentNodes">并发节点</Label>
                          <Input
                            id="concurrentNodes"
                            type="number"
                            value={concurrentNodes}
                            onChange={(e) => setConcurrentNodes(Number(e.target.value))}
                            min="1"
                            max="3"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="retries">重试次数</Label>
                          <Input
                            id="retries"
                            type="number"
                            value={retries}
                            onChange={(e) => setRetries(Number(e.target.value))}
                            min="0"
                            max="10"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-sm font-medium">止盈止损设置</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="stopEarnPercent">止盈百分比</Label>
                            <Input
                              id="stopEarnPercent"
                              type="number"
                              value={stopEarnPercent}
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                setStopEarnPercent(value);
                              }}
                              step="0.01"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="stopLossPercent">止损百分比</Label>
                            <Input
                              id="stopLossPercent"
                              type="number"
                              value={stopLossPercent}
                              onChange={(e) => {
                                const value = Number(e.target.value);
                                setStopLossPercent(value);
                              }}
                              step="0.01"
                            />
                          </div>
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="stopEarnGroup">止盈组（自动同步）</Label>
                          <Textarea
                            id="stopEarnGroup"
                            value={JSON.stringify(stopEarnGroup, null, 2)}
                            readOnly
                            className="h-24 bg-gray-50"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="stopLossGroup">止损组（自动同步）</Label>
                          <Textarea
                            id="stopLossGroup"
                            value={JSON.stringify(stopLossGroup, null, 2)}
                            readOnly
                            className="h-24 bg-gray-50"
                          />
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-sm font-medium">自定义盈亏配置</CardTitle>
                          <Switch
                            id="pnlCustomConfigEnabled"
                            checked={pnlCustomConfigEnabled}
                            onCheckedChange={setPnlCustomConfigEnabled}
                          />
                        </div>
                      </CardHeader>
                      {pnlCustomConfigEnabled && (
                        <CardContent>
                          <div className="space-y-2">
                            <Textarea
                              id="pnlCustomConfig"
                              value={JSON.stringify(pnlCustomConfig, null, 2)}
                              onChange={(e) => {
                                try {
                                  setPnlCustomConfig(JSON.parse(e.target.value))
                                } catch (err) {
                                  console.error('自定义盈亏配置JSON格式无效', err)
                                }
                              }}
                              placeholder='{"priorityFee": "", "jitoEnabled": true, "jitoTip": 0.001, "maxSlippage": 0.1, "concurrentNodes": 2, "retries": 1}'
                              className="h-32"
                            />
                          </div>
                        </CardContent>
                      )}
                    </Card>

                    <div className="flex gap-4">
                      <Button
                        onClick={() => handleQuickTradeSubmit('buy')}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        买入
                      </Button>
                      <Button
                        onClick={() => handleQuickTradeSubmit('sell')}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                      >
                        卖出
                      </Button>
                    </div>
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}