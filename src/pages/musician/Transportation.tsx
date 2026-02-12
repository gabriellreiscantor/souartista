import { useState, useEffect } from 'react';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { MusicianSidebar } from '@/components/MusicianSidebar';
import { UserMenu } from '@/components/UserMenu';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Car, Truck, Bus, Plane, PlusCircle, Fuel, ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { NotificationBell } from '@/components/NotificationBell';
import { CurrencyInput } from '@/components/ui/currency-input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';
import { format, startOfMonth, endOfMonth, addMonths, subMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type TransportTab = 'uber' | 'km' | 'van' | 'onibus' | 'aviao';

interface Ride {
  cost: number;
}

interface Show {
  id: string;
  venue_name: string;
  date_local: string;
}

const MusicianTransportation = () => {
  const { user, userData, userRole } = useAuth();
  
  const [activeTab, setActiveTab] = useState<TransportTab>('uber');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [shows, setShows] = useState<Show[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  
  // Uber state
  const [rides, setRides] = useState<Ride[]>([]);
  const [currentRide, setCurrentRide] = useState('');
  
  // Km state
  const [kmData, setKmData] = useState({
    distance: '',
    consumption: '',
    pricePerLiter: '',
  });
  
  // Other transports state
  const [otherData, setOtherData] = useState({
    cost: '',
    description: '',
  });
  
  // Common
  const [selectedShow, setSelectedShow] = useState('');

  useEffect(() => {
    if (user) {
      fetchShows();
      fetchExpenses();
    }
  }, [user, currentMonth]);

  const fetchShows = async () => {
    try {
      const { data, error } = await supabase
        .from('shows')
        .select('id, venue_name, date_local')
        .contains('team_musician_ids', [user?.id])
        .order('date_local', { ascending: false });

      if (error) throw error;
      setShows(data || []);
    } catch (error) {
      console.error('Error fetching shows:', error);
    }
  };

  const fetchExpenses = async () => {
    try {
      const start = startOfMonth(currentMonth);
      const end = endOfMonth(currentMonth);

      const { data, error } = await supabase
        .from('locomotion_expenses')
        .select('*')
        .eq('uid', user?.id)
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExpenses(data || []);
    } catch (error) {
      console.error('Error fetching expenses:', error);
    }
  };

  const addRide = () => {
    const value = parseFloat(currentRide);
    if (value > 0) {
      setRides([...rides, { cost: value }]);
      setCurrentRide('');
    }
  };

  const calculateKmCost = () => {
    const distance = parseFloat(kmData.distance) || 0;
    const consumption = parseFloat(kmData.consumption) || 1;
    const price = parseFloat(kmData.pricePerLiter) || 0;
    
    if (distance > 0 && consumption > 0 && price > 0) {
      return (distance / consumption) * price;
    }
    return 0;
  };

  const getTotalCost = () => {
    if (activeTab === 'uber') {
      return rides.reduce((sum, ride) => sum + ride.cost, 0);
    } else if (activeTab === 'km') {
      return calculateKmCost();
    } else {
      return parseFloat(otherData.cost) || 0;
    }
  };

  const handleSave = async () => {
    try {
      const totalCost = getTotalCost();
      
      if (totalCost <= 0) {
        toast.error('O custo total deve ser maior que zero');
        return;
      }

      let expenseData: any = {
        uid: user?.id,
        type: activeTab,
        cost: totalCost,
        show_id: selectedShow || null,
      };

      if (activeTab === 'km') {
        expenseData.distance_km = parseFloat(kmData.distance) || null;
        expenseData.vehicle_consumption = parseFloat(kmData.consumption) || null;
        expenseData.price_per_liter = parseFloat(kmData.pricePerLiter) || null;
      }

      const { error } = await supabase
        .from('locomotion_expenses')
        .insert([expenseData]);

      if (error) throw error;

      toast.success('Despesa salva com sucesso!');

      // Reset form
      setRides([]);
      setCurrentRide('');
      setKmData({ distance: '', consumption: '', pricePerLiter: '' });
      setOtherData({ cost: '', description: '' });
      setSelectedShow('');
      
      fetchExpenses();
    } catch (error) {
      console.error('Error saving expense:', error);
      toast.error('Não foi possível salvar a despesa');
    }
  };

  const formatCurrency = (value: number) => {
    return value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-[#fafafa]">
        <MusicianSidebar />
        
        <div className="flex-1 flex flex-col safe-area-top">
          <header className="h-16 border-b border-gray-200 bg-white flex items-center px-4 md:px-6 justify-between">
            <div className="flex items-center gap-4">
              <SidebarTrigger />
              <h1 className="text-xl font-semibold text-gray-900">Locomoção</h1>
            </div>
            
            <div className="flex items-center gap-3">
              <NotificationBell />
              <UserMenu userName={userData?.name} userRole={userRole} photoUrl={userData?.photo_url} />
            </div>
          </header>

          <main className="flex-1 p-4 md:p-6 overflow-auto pb-20 md:pb-6 scrollbar-hide" style={{
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            WebkitOverflowScrolling: 'touch'
          }}>
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Management Card */}
              <Card className="bg-white border-gray-200">
                <CardContent className="p-6">
                  <h2 className="text-xl font-bold text-gray-900 mb-1">Gerenciamento de Locomoção</h2>
                  <p className="text-sm text-gray-600 mb-6">Registre e associe despesas de deslocamento de forma detalhada e organizada.</p>

                  {/* Transport Tabs */}
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-6">
                    <button
                      onClick={() => setActiveTab('uber')}
                      className={`flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-lg transition-all ${
                        activeTab === 'uber'
                          ? 'bg-purple-600 text-white font-medium shadow-md'
                          : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                      }`}
                    >
                      <Car className="w-6 h-6" />
                      <span className="text-sm font-medium">Uber</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('km')}
                      className={`flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-lg transition-all ${
                        activeTab === 'km'
                          ? 'bg-purple-600 text-white font-medium shadow-md'
                          : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                      }`}
                    >
                      <Fuel className="w-6 h-6" />
                      <span className="text-sm font-medium text-center">Carro/Km Rodado</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('van')}
                      className={`flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-lg transition-all ${
                        activeTab === 'van'
                          ? 'bg-purple-600 text-white font-medium shadow-md'
                          : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                      }`}
                    >
                      <Truck className="w-6 h-6" />
                      <span className="text-sm font-medium">Van</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('onibus')}
                      className={`flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-lg transition-all ${
                        activeTab === 'onibus'
                          ? 'bg-purple-600 text-white font-medium shadow-md'
                          : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                      }`}
                    >
                      <Bus className="w-6 h-6" />
                      <span className="text-sm font-medium">Ônibus</span>
                    </button>

                    <button
                      onClick={() => setActiveTab('aviao')}
                      className={`flex flex-col items-center justify-center gap-2 py-4 px-3 rounded-lg transition-all ${
                        activeTab === 'aviao'
                          ? 'bg-purple-600 text-white font-medium shadow-md'
                          : 'bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100'
                      }`}
                    >
                      <Plane className="w-6 h-6" />
                      <span className="text-sm font-medium">Avião</span>
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 space-y-4">
                      {activeTab === 'uber' && (
                          <>
                            <div>
                              <Label htmlFor="ride-cost" className="text-gray-900 font-medium mb-2 block">Corridas</Label>
                              <CurrencyInput
                                id="ride-cost"
                                value={currentRide}
                                onChange={(value) => setCurrentRide(value)}
                                className="bg-white border-gray-300 text-gray-900"
                              />
                            </div>

                          <Button
                            type="button"
                            variant="outline"
                            onClick={addRide}
                            className="w-full bg-white border-gray-300 text-gray-900 hover:bg-gray-50"
                          >
                            <PlusCircle className="w-4 h-4 mr-2" />
                            Adicionar Corrida
                          </Button>

                          {rides.length > 0 && (
                            <div className="mt-4 space-y-2">
                              {rides.map((ride, index) => (
                                <div key={index} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                  <span className="text-sm text-gray-600">Corrida {index + 1}</span>
                                  <span className="font-medium text-gray-900">R$ {formatCurrency(ride.cost)}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </>
                      )}

                      {activeTab === 'km' && (
                        <>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <Label htmlFor="distance" className="text-gray-900 font-medium mb-2 block">Distância Total (km)</Label>
                              <Input
                                id="distance"
                                type="number"
                                inputMode="numeric"
                                placeholder="Ex: 150"
                                value={kmData.distance}
                                onChange={(e) => setKmData({ ...kmData, distance: e.target.value })}
                                className="bg-white border-gray-300 text-gray-900"
                                step="0.1"
                                min="0"
                              />
                            </div>

                            <div>
                              <Label htmlFor="consumption" className="text-gray-900 font-medium mb-2 block">Consumo do Veículo (km/l)</Label>
                              <Input
                                id="consumption"
                                type="number"
                                inputMode="numeric"
                                placeholder="Ex: 12"
                                value={kmData.consumption}
                                onChange={(e) => setKmData({ ...kmData, consumption: e.target.value })}
                                className="bg-white border-gray-300 text-gray-900"
                                step="0.1"
                                min="0"
                              />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="price-per-liter" className="text-gray-900 font-medium mb-2 block">Preço do Litro</Label>
                            <CurrencyInput
                              id="price-per-liter"
                              value={kmData.pricePerLiter}
                              onChange={(value) => setKmData({ ...kmData, pricePerLiter: value })}
                              className="bg-white border-gray-300 text-gray-900"
                            />
                          </div>
                        </>
                      )}

                      {(activeTab === 'van' || activeTab === 'onibus' || activeTab === 'aviao') && (
                        <>
                          <Alert className="bg-purple-50 border-purple-200">
                            <AlertCircle className="h-4 w-4 text-purple-700" />
                            <AlertDescription className="text-sm text-purple-900">
                              Caso sua viagem for por Km Rodado, utilize a aba "Carro/Km Rodado" para um cálculo preciso.
                            </AlertDescription>
                          </Alert>

                          <div>
                            <Label htmlFor="cost" className="text-gray-900 font-medium mb-2 block">Valor da Despesa</Label>
                            <CurrencyInput
                              id="cost"
                              value={otherData.cost}
                              onChange={(value) => setOtherData({ ...otherData, cost: value })}
                              className="bg-white border-gray-300 text-gray-900"
                            />
                          </div>

                          <div>
                            <Label htmlFor="description" className="text-gray-900 font-medium mb-2 block">Descrição</Label>
                            <Input
                              id="description"
                              type="text"
                              placeholder={`Ex: Aluguel da ${activeTab === 'van' ? 'van' : activeTab === 'onibus' ? 'ônibus' : 'avião'} para show`}
                              value={otherData.description}
                              onChange={(e) => setOtherData({ ...otherData, description: e.target.value })}
                              className="bg-white border-gray-300 text-gray-900"
                            />
                          </div>
                        </>
                      )}
                    </div>

                    {/* Right Side Card */}
                    <div className="lg:col-span-1">
                      <Card className="bg-purple-50 border-purple-200">
                        <CardContent className="p-6 space-y-4">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <h3 className="text-sm font-medium text-gray-900">
                                {activeTab === 'km' ? 'Custo Total Estimado' : 'Custo Total'}
                              </h3>
                              {activeTab === 'km' && <Fuel className="w-4 h-4 text-purple-700" />}
                            </div>
                            <p className="text-3xl font-bold text-purple-700">R$ {formatCurrency(getTotalCost())}</p>
                          </div>

                          <div>
                            <Label htmlFor="show-select" className="text-gray-900 font-medium mb-2 block">
                              Associar Custo ao Show (Opcional)
                            </Label>
                            <Select value={selectedShow} onValueChange={setSelectedShow}>
                              <SelectTrigger className="bg-white border-gray-300 text-gray-900">
                                <SelectValue placeholder="Selecione um show" />
                              </SelectTrigger>
                              <SelectContent className="bg-white">
                                {shows.map((show) => (
                                  <SelectItem key={show.id} value={show.id}>
                                    {show.venue_name} - {format(new Date(show.date_local), 'dd/MM/yyyy')}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>

                          <Button
                            onClick={handleSave}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white"
                          >
                            Salvar Despesa
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* History */}
              <Card className="bg-white border-gray-200">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Histórico De {format(currentMonth, 'MMMM', { locale: ptBR }).charAt(0).toUpperCase() + format(currentMonth, 'MMMM', { locale: ptBR }).slice(1)} De {format(currentMonth, 'yyyy')}
                      </h3>
                      <p className="text-sm text-gray-600">Despesas de locomoção registradas neste mês.</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
                        className="border-gray-300"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentMonth(new Date())}
                        className="border-gray-300"
                      >
                        Hoje
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
                        className="border-gray-300"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {expenses.length === 0 ? (
                    <div className="text-center py-12 border border-dashed border-gray-300 rounded-lg">
                      <p className="text-gray-500">Nenhuma despesa de locomoção registrada para este período.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {expenses.map((expense) => (
                        <div
                          key={expense.id}
                          className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                              {expense.type === 'uber' && <Car className="w-5 h-5 text-purple-600" />}
                              {expense.type === 'km' && <Car className="w-5 h-5 text-purple-600" />}
                              {expense.type === 'van' && <Truck className="w-5 h-5 text-purple-600" />}
                              {expense.type === 'onibus' && <Bus className="w-5 h-5 text-purple-600" />}
                              {expense.type === 'aviao' && <Plane className="w-5 h-5 text-purple-600" />}
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">
                                {expense.type === 'uber' && 'Uber'}
                                {expense.type === 'km' && 'Carro/Km Rodado'}
                                {expense.type === 'van' && 'Van'}
                                {expense.type === 'onibus' && 'Ônibus'}
                                {expense.type === 'aviao' && 'Avião'}
                              </p>
                              <p className="text-sm text-gray-500">
                                {format(new Date(expense.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-gray-900">R$ {formatCurrency(expense.cost)}</p>
                            {expense.distance_km && (
                              <p className="text-xs text-gray-500">{expense.distance_km} km</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </main>
        </div>
        <MobileBottomNav role="musician" />
      </div>
    </SidebarProvider>
  );
};

export default MusicianTransportation;
