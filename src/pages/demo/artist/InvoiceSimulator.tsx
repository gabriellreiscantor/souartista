import { useState, useMemo } from 'react';
import { AlertTriangle, Calculator, Info, Receipt, HelpCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DemoArtistSidebar } from '@/components/DemoArtistSidebar';
import { DemoMobileBottomNav } from '@/components/DemoMobileBottomNav';
import { DemoBanner } from '@/components/DemoBanner';
import { useIsMobile } from '@/hooks/use-mobile';
import { SafeAreaWrapper } from '@/components/SafeAreaWrapper';
import { DemoUserMenu } from '@/components/DemoUserMenu';

// Constantes 2026
const TETO_INSS_2026 = 876.97;
const ALIQUOTA_INSS = 0.11;

// Tabela IRRF 2026 (com isenção até R$ 5.000)
const TABELA_IRRF_2026 = [
  { limite: 5000, aliquota: 0, deducao: 0 },
  { limite: 7000, aliquota: 0.075, deducao: 375 },
  { limite: 9500, aliquota: 0.15, deducao: 900 },
  { limite: 12000, aliquota: 0.225, deducao: 1612.50 },
  { limite: Infinity, aliquota: 0.275, deducao: 2212.50 },
];

type TipoRecebimento = 'pf' | 'mei' | 'cnpj';

const formatCurrency = (value: number): string => {
  return value.toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const calcularIRRF = (baseCalculo: number): number => {
  for (const faixa of TABELA_IRRF_2026) {
    if (baseCalculo <= faixa.limite) {
      const imposto = baseCalculo * faixa.aliquota - faixa.deducao;
      return Math.max(0, imposto);
    }
  }
  return 0;
};

const DemoInvoiceSimulator = () => {
  const isMobile = useIsMobile();
  const [tipoRecebimento, setTipoRecebimento] = useState<TipoRecebimento>('pf');
  const [valorBruto, setValorBruto] = useState<string>('10000');
  const [retencaoFonte, setRetencaoFonte] = useState(true);
  const [issPercentual, setIssPercentual] = useState<string>('2');

  const valorBrutoNum = parseFloat(valorBruto) || 0;
  const issPercentualNum = parseFloat(issPercentual) || 0;

  const calculos = useMemo(() => {
    let inss = 0;
    let irrf = 0;
    let iss = 0;
    let baseIRRF = valorBrutoNum;
    let temINSS = false;
    let temIRRF = false;

    switch (tipoRecebimento) {
      case 'pf':
        temINSS = true;
        temIRRF = true;
        inss = Math.min(valorBrutoNum * ALIQUOTA_INSS, TETO_INSS_2026);
        baseIRRF = valorBrutoNum - inss;
        irrf = calcularIRRF(baseIRRF);
        iss = valorBrutoNum * (issPercentualNum / 100);
        break;
      case 'mei':
        iss = valorBrutoNum * (issPercentualNum / 100);
        break;
      case 'cnpj':
        iss = valorBrutoNum * (issPercentualNum / 100);
        break;
    }

    const totalDescontos = inss + irrf + iss;
    const valorLiquido = valorBrutoNum - totalDescontos;

    return {
      inss,
      irrf,
      iss,
      baseIRRF,
      totalDescontos,
      valorLiquido,
      temINSS,
      temIRRF,
    };
  }, [valorBrutoNum, tipoRecebimento, issPercentualNum]);

  return (
    <SafeAreaWrapper>
      <SidebarProvider>
        <div className="flex min-h-screen w-full bg-[#fafafa]">
          {!isMobile && <DemoArtistSidebar />}
          
          <div className="flex-1 flex flex-col">
            <DemoBanner />
            
            {/* Header */}
            <header className="h-16 border-b border-gray-200 bg-white flex items-center px-4 md:px-6 justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger />
                <h1 className="text-xl font-semibold text-gray-900">
                  Simular Nota Fiscal
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <DemoUserMenu userName="Demo User" userRole="artist" />
              </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6">
              <div className="max-w-3xl mx-auto space-y-6">
                {/* Aviso */}
                <Alert className="bg-yellow-50 border-yellow-200">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-800 text-sm">
                    Este é um <strong>simulador de estimativa</strong> baseado nas regras gerais do Brasil (2026). 
                    Não é consultoria contábil. Para emissão oficial, confirme com seu contador ou com a prefeitura.
                  </AlertDescription>
                </Alert>

                {/* Tipo de Recebimento */}
                <Card className="bg-white border-gray-200">
                  <CardContent className="p-4 md:p-6">
                    <div className="flex items-center gap-2 mb-4">
                      <Receipt className="w-5 h-5 text-purple-600" />
                      <h2 className="font-semibold text-gray-900">Tipo de Recebimento</h2>
                    </div>
                    
                    <RadioGroup 
                      value={tipoRecebimento} 
                      onValueChange={(v) => setTipoRecebimento(v as TipoRecebimento)}
                      className="grid gap-3"
                    >
                      <div className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                        <RadioGroupItem value="pf" id="pf" className="mt-1" />
                        <Label htmlFor="pf" className="flex-1 cursor-pointer">
                          <span className="font-medium text-gray-900">Pessoa Física (RPA/Recibo)</span>
                          <p className="text-sm text-gray-500 mt-1">
                            Sem CNPJ. O contratante emite RPA e retém INSS + IRRF na fonte.
                          </p>
                        </Label>
                      </div>
                      
                      <div className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                        <RadioGroupItem value="mei" id="mei" className="mt-1" />
                        <Label htmlFor="mei" className="flex-1 cursor-pointer">
                          <span className="font-medium text-gray-900">MEI (Microempreendedor Individual)</span>
                          <p className="text-sm text-gray-500 mt-1">
                            Você emite NFS-e. Paga DAS mensal fixo (~R$ 75-80). Sem retenção por show.
                          </p>
                        </Label>
                      </div>
                      
                      <div className="flex items-start space-x-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                        <RadioGroupItem value="cnpj" id="cnpj" className="mt-1" />
                        <Label htmlFor="cnpj" className="flex-1 cursor-pointer">
                          <span className="font-medium text-gray-900">CNPJ (ME/EPP/Simples Nacional)</span>
                          <p className="text-sm text-gray-500 mt-1">
                            Empresa no Simples. Impostos federais via DAS. Aqui calculamos só ISS.
                          </p>
                        </Label>
                      </div>
                    </RadioGroup>
                  </CardContent>
                </Card>

                {/* Dados do Cachê */}
                <Card className="bg-white border-gray-200">
                  <CardContent className="p-4 md:p-6 space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calculator className="w-5 h-5 text-purple-600" />
                      <h2 className="font-semibold text-gray-900">Dados do Cachê</h2>
                    </div>

                    <div>
                      <Label htmlFor="valorBruto" className="text-sm font-medium text-gray-900">
                        Valor Bruto do Cachê
                      </Label>
                      <div className="mt-1.5">
                        <CurrencyInput
                          id="valorBruto"
                          value={valorBruto}
                          onChange={setValorBruto}
                          placeholder="0,00"
                          className="text-lg"
                        />
                      </div>
                    </div>

                    {tipoRecebimento === 'pf' && (
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="retencao"
                          checked={retencaoFonte}
                          onCheckedChange={(checked) => setRetencaoFonte(checked === true)}
                        />
                        <Label htmlFor="retencao" className="text-sm cursor-pointer text-gray-700">
                          O contratante retém impostos na fonte
                        </Label>
                      </div>
                    )}

                    <div>
                      <Label htmlFor="iss" className="text-sm font-medium text-gray-900">
                        ISS (%)
                      </Label>
                      <p className="text-xs text-gray-500 mb-1.5">
                        Varia de 2% a 5% conforme o município. Padrão: 2%
                      </p>
                      <Input
                        id="iss"
                        type="number"
                        min="0"
                        max="5"
                        step="0.5"
                        value={issPercentual}
                        onChange={(e) => setIssPercentual(e.target.value)}
                        className="w-24 !bg-white !text-gray-900"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Resultado */}
                {valorBrutoNum > 0 && (
                  <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-200">
                    <CardContent className="p-4 md:p-6">
                      <div className="flex items-center gap-2 mb-4">
                        <Info className="w-5 h-5 text-purple-600" />
                        <h2 className="font-semibold text-gray-900">Resultado da Simulação</h2>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-200">
                          <span className="text-gray-500">Valor Bruto</span>
                          <span className="font-semibold text-gray-900">R$ {formatCurrency(valorBrutoNum)}</span>
                        </div>

                        {calculos.temINSS && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">(-) INSS (11%)</span>
                            <span className="text-red-600">- R$ {formatCurrency(calculos.inss)}</span>
                          </div>
                        )}

                        {calculos.temIRRF && (
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-500">(-) IRRF</span>
                            <span className="text-red-600">- R$ {formatCurrency(calculos.irrf)}</span>
                          </div>
                        )}

                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-500">(-) ISS ({issPercentualNum}%)</span>
                          <span className="text-red-600">- R$ {formatCurrency(calculos.iss)}</span>
                        </div>

                        <div className="flex justify-between items-center py-2 border-t border-dashed border-gray-300">
                          <span className="text-gray-500">Total Descontos</span>
                          <span className="font-medium text-red-600">- R$ {formatCurrency(calculos.totalDescontos)}</span>
                        </div>

                        <div className="flex justify-between items-center py-3 bg-purple-100 rounded-lg px-3 mt-2">
                          <span className="font-semibold text-gray-900">💵 VALOR LÍQUIDO</span>
                          <span className="text-xl font-bold text-purple-600">R$ {formatCurrency(calculos.valorLiquido)}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Explicações */}
                <Accordion type="single" collapsible className="bg-white rounded-lg border border-gray-200">
                  <AccordionItem value="explicacao" className="border-none">
                    <AccordionTrigger className="px-4 hover:no-underline">
                      <div className="flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-900">Como foi calculado?</span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="px-4 pb-4 text-sm text-gray-600 space-y-4">
                      {tipoRecebimento === 'pf' && (
                        <>
                          <div>
                            <p className="font-medium text-gray-900 mb-1">INSS (11%)</p>
                            <p>
                              Quando você recebe como pessoa física, o contratante retém 11% de INSS na fonte, 
                              limitado ao teto de R$ {formatCurrency(TETO_INSS_2026)} em 2026.
                            </p>
                          </div>
                          <div>
                            <p className="font-medium text-gray-900 mb-1">IRRF (Tabela 2026)</p>
                            <p>
                              A base de cálculo é o valor bruto menos o INSS. Em 2026, há isenção para 
                              valores até R$ 5.000. Acima disso, aplica-se a tabela progressiva:
                            </p>
                            <ul className="list-disc ml-5 mt-2 space-y-1">
                              <li>Até R$ 5.000: isento</li>
                              <li>R$ 5.000 a R$ 7.000: 7,5%</li>
                              <li>R$ 7.000 a R$ 9.500: 15%</li>
                              <li>R$ 9.500 a R$ 12.000: 22,5%</li>
                              <li>Acima de R$ 12.000: 27,5%</li>
                            </ul>
                          </div>
                        </>
                      )}
                      
                      {tipoRecebimento === 'mei' && (
                        <div>
                          <p className="font-medium text-gray-900 mb-1">MEI - Microempreendedor Individual</p>
                          <p>
                            Como MEI, você não tem retenção de INSS ou IRRF por show. Você paga apenas o DAS mensal 
                            (valor fixo em torno de R$ 75-80 em 2026, que já inclui INSS + ISS + contribuições).
                          </p>
                          <p className="mt-2">
                            Alguns tomadores (prefeituras) podem ainda reter ISS na fonte - por isso mantemos 
                            o cálculo do ISS aqui. Confirme antes com o contratante.
                          </p>
                        </div>
                      )}
                      
                      {tipoRecebimento === 'cnpj' && (
                        <div>
                          <p className="font-medium text-gray-900 mb-1">CNPJ (Simples Nacional)</p>
                          <p>
                            Empresas no Simples Nacional têm tributação simplificada via DAS. Aqui calculamos 
                            apenas o ISS, que pode ser retido na fonte pelo tomador.
                          </p>
                          <p className="mt-2">
                            Para cálculo preciso dos demais impostos federais (que dependem do faturamento 
                            acumulado e anexo do Simples), consulte seu contador.
                          </p>
                        </div>
                      )}

                      <div>
                        <p className="font-medium text-gray-900 mb-1">ISS</p>
                        <p>
                          O Imposto Sobre Serviços varia de 2% a 5% conforme o município. O padrão é 2%, 
                          mas você pode ajustar conforme a alíquota da sua cidade ou do local do show.
                        </p>
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>

                {/* Aviso final */}
                <p className="text-xs text-center text-gray-500 px-4">
                  Os valores são estimativas. Pode haver regras locais específicas. 
                  Confirme sempre com seu contador ou com a prefeitura.
                </p>
              </div>
            </main>
          </div>

          {isMobile && <DemoMobileBottomNav role="artist" />}
        </div>
      </SidebarProvider>
    </SafeAreaWrapper>
  );
};

export default DemoInvoiceSimulator;
