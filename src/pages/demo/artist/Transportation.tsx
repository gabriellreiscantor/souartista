import { useState } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { DemoArtistSidebar } from '@/components/DemoArtistSidebar';
import { DemoUserMenu } from '@/components/DemoUserMenu';
import { DemoMobileBottomNav } from '@/components/DemoMobileBottomNav';
import { DemoBanner } from '@/components/DemoBanner';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { NotificationBell } from '@/components/NotificationBell';
import { Car, Truck, Bus, Plane, Fuel, PlusCircle, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type TransportType = 'uber' | 'km' | 'van' | 'onibus' | 'aviao';

interface Ride {
  id: string;
  cost: number;
}

const DemoArtistTransportation = () => {
  const [activeType, setActiveType] = useState<TransportType>('uber');
  const [rideValue, setRideValue] = useState('');
  const [rides, setRides] = useState<Ride[]>([]);
  
  // Carro/Km Rodado state
  const [kmDistance, setKmDistance] = useState('');
  const [kmConsumption, setKmConsumption] = useState('');
  const [fuelPrice, setFuelPrice] = useState('');
  
  // Van/Ônibus/Avião state
  const [expenseValue, setExpenseValue] = useState('');
  const [description, setDescription] = useState('');

  const currentDate = new Date();
  const currentMonthYear = format(currentDate, "MMMM 'de' yyyy", { locale: ptBR });

  const transportTypes = [
    { id: 'uber', icon: Car, label: 'Uber' },
    { id: 'km', icon: Fuel, label: 'Carro/Km Rodado' },
    { id: 'van', icon: Truck, label: 'Van' },
    { id: 'onibus', icon: Bus, label: 'Ônibus' },
    { id: 'aviao', icon: Plane, label: 'Avião' }
  ] as const;

  const addRide = () => {
    const value = parseFloat(rideValue.replace(',', '.'));
    if (!isNaN(value) && value > 0) {
      setRides([...rides, { id: Date.now().toString(), cost: value }]);
      setRideValue('');
    }
  };

  const removeRide = (id: string) => {
    setRides(rides.filter(ride => ride.id !== id));
  };

  const calculateKmCost = () => {
    const distance = parseFloat(kmDistance);
    const consumption = parseFloat(kmConsumption);
    const price = parseFloat(fuelPrice.replace(',', '.'));
    
    if (!isNaN(distance) && !isNaN(consumption) && !isNaN(price) && consumption > 0) {
      const litersNeeded = distance / consumption;
      return litersNeeded * price;
    }
    return 0;
  };

  const getTotalCost = () => {
    if (activeType === 'uber') {
      return rides.reduce((sum, ride) => sum + ride.cost, 0);
    } else if (activeType === 'km') {
      return calculateKmCost();
    } else {
      const value = parseFloat(expenseValue.replace(',', '.'));
      return !isNaN(value) ? value : 0;
    }
  };

  const handleSave = () => {
    toast.info('Modo Demo', {
      description: 'Função disponível apenas na versão completa.'
    });
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#fafafa]">
        <DemoArtistSidebar />
        
        <div className="flex-1 flex flex-col">
          <DemoBanner />
          
          <header className="h-16 border-b border-gray-200 bg-white flex items-center px-4 md:px-6 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-gray-900">Locomoção</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <NotificationBell />
              <DemoUserMenu userName="Demo" userRole="artist" />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6 scrollbar-hide" style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}>
            <div className="max-w-2xl mx-auto space-y-4">
              <Card className="bg-white border-gray-200">
                <CardContent className="p-4 md:p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Gerenciamento de Locomoção</h2>
                  <p className="text-sm text-gray-600 mb-6">
                    Registre e associe despesas de deslocamento de forma detalhada e organizada.
                  </p>

                  {/* Transport Type Buttons */}
                  <div className="grid grid-cols-2 gap-2 mb-6">
                    {transportTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => {
                          setActiveType(type.id as TransportType);
                          setRides([]);
                          setRideValue('');
                          setKmDistance('');
                          setKmConsumption('');
                          setFuelPrice('');
                          setExpenseValue('');
                          setDescription('');
                        }}
                        className={`flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-xl transition-all ${
                          activeType === type.id
                            ? 'bg-primary text-white shadow-lg'
                            : 'bg-purple-50 text-primary hover:bg-purple-100'
                        }`}
                      >
                        <type.icon className="w-6 h-6" />
                        <span className="text-sm font-medium text-center">{type.label}</span>
                      </button>
                    ))}
                  </div>

                  {/* Uber */}
                  {activeType === 'uber' && (
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Corridas</label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="R$ 0,00"
                          value={rideValue}
                          onChange={(e) => setRideValue(e.target.value)}
                          className="bg-white border-gray-300 text-gray-900"
                        />
                      </div>

                      <Button
                        onClick={addRide}
                        variant="outline"
                        className="w-full border-gray-300 text-gray-900 hover:bg-gray-50"
                      >
                        <PlusCircle className="w-4 h-4 mr-2" />
                        Adicionar Corrida
                      </Button>

                      {rides.map((ride, index) => (
                        <div key={ride.id} className="flex items-center justify-between text-sm">
                          <span className="text-gray-700">Corrida {index + 1}</span>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">R$ {formatCurrency(ride.cost)}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => removeRide(ride.id)}
                              className="h-6 w-6 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Carro/Km Rodado */}
                  {activeType === 'km' && (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Distância Total (km)
                          </label>
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="Ex: 150"
                            value={kmDistance}
                            onChange={(e) => setKmDistance(e.target.value)}
                            className="bg-white border-gray-300 text-gray-900"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Consumo do Veículo (km/l)
                          </label>
                          <Input
                            type="text"
                            inputMode="decimal"
                            placeholder="Ex: 12"
                            value={kmConsumption}
                            onChange={(e) => setKmConsumption(e.target.value)}
                            className="bg-white border-gray-300 text-gray-900"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Preço do Litro</label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="R$ 0,00"
                          value={fuelPrice}
                          onChange={(e) => setFuelPrice(e.target.value)}
                          className="bg-white border-gray-300 text-gray-900"
                        />
                      </div>

                      <Card className="bg-purple-50 border-purple-200">
                        <CardContent className="p-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium text-gray-700">Custo Total Estimado</span>
                            <Fuel className="w-5 h-5 text-primary" />
                          </div>
                          <p className="text-3xl font-bold text-primary">R$ {formatCurrency(calculateKmCost())}</p>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Van / Ônibus / Avião */}
                  {(activeType === 'van' || activeType === 'onibus' || activeType === 'aviao') && (
                    <div className="space-y-4">
                      {activeType === 'van' && (
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-gray-700">
                          Caso sua viagem for por Km Rodado, utilize a aba "Carro/Km Rodado" para um cálculo preciso.
                        </div>
                      )}

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Valor da Despesa</label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          placeholder="R$ 0,00"
                          value={expenseValue}
                          onChange={(e) => setExpenseValue(e.target.value)}
                          className="bg-white border-gray-300 text-gray-900"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Descrição</label>
                        <Input
                          type="text"
                          placeholder="Ex: Aluguel da van para show"
                          value={description}
                          onChange={(e) => setDescription(e.target.value)}
                          className="bg-white border-gray-300 text-gray-900"
                        />
                      </div>
                    </div>
                  )}

                  {/* Total Cost & Save */}
                  <Card className="bg-purple-50 border-purple-200 mt-6">
                    <CardContent className="p-4 space-y-4">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-1">Custo Total</p>
                        <p className="text-3xl font-bold text-primary">R$ {formatCurrency(getTotalCost())}</p>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Associar Custo ao Show (Opcional)
                        </label>
                        <Select>
                          <SelectTrigger className="w-full bg-white border-gray-300 text-gray-900">
                            <SelectValue placeholder="Selecione um show" />
                          </SelectTrigger>
                          <SelectContent className="bg-white">
                            <SelectItem value="show1">Casa de Shows Melodia - 12/11</SelectItem>
                            <SelectItem value="show2">Pub e Lounge Estrela - 14/11</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <Button
                        onClick={handleSave}
                        className="w-full bg-primary hover:bg-primary/90 text-white"
                      >
                        Salvar Despesa
                      </Button>
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>

              {/* Histórico */}
              <Card className="bg-white border-gray-200">
                <CardContent className="p-4 md:p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        Histórico De {format(currentDate, 'MMMM', { locale: ptBR }).charAt(0).toUpperCase() + format(currentDate, 'MMMM', { locale: ptBR }).slice(1)} De {currentDate.getFullYear()}
                      </h3>
                      <p className="text-sm text-gray-600">Despesas de locomoção registradas neste mês.</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg bg-primary text-white hover:bg-primary/90">
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button className="bg-primary text-white hover:bg-primary/90">
                        Hoje
                      </Button>
                      <Button variant="outline" size="icon" className="h-10 w-10 rounded-lg bg-primary text-white hover:bg-primary/90">
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="border border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <p className="text-gray-500">Nenhuma despesa de locomoção registrada para este período.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
        <DemoMobileBottomNav role="artist" />
      </div>
    </SidebarProvider>
  );
};

export default DemoArtistTransportation;
