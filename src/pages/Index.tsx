import { useState } from "react";
import Icon from "@/components/ui/icon";
import CertificatePreview from "@/components/CertificatePreview";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

const NOMINALS = [1000, 2000, 3000, 5000, 7000, 10000];

const Index = () => {
  const [selectedNominal, setSelectedNominal] = useState<number | null>(null);
  const [customNominal, setCustomNominal] = useState("");
  const [recipientName, setRecipientName] = useState("");
  const [senderName, setSenderName] = useState("");
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const { toast } = useToast();

  const currentNominal = selectedNominal || (customNominal ? parseInt(customNominal) : 0);
  const isValidNominal = currentNominal >= 500;

  const handleNominalSelect = (value: number) => {
    setSelectedNominal(value);
    setCustomNominal("");
  };

  const handleCustomNominal = (value: string) => {
    const num = value.replace(/\D/g, "");
    setCustomNominal(num);
    setSelectedNominal(null);
  };

  const handleNextStep = () => {
    if (step === 1 && isValidNominal) {
      setStep(2);
    } else if (step === 2 && recipientName.trim()) {
      setStep(3);
    }
  };

  const handlePurchase = async () => {
    setIsProcessing(true);
    toast({
      title: "Оформление сертификата",
      description: "Функция оплаты будет подключена на следующем шаге",
    });
    setTimeout(() => setIsProcessing(false), 1500);
  };

  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("ru-RU").format(value);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center">
              <Icon name="Gift" size={16} className="text-background" />
            </div>
            <span className="font-display text-xl font-semibold tracking-tight">Sweep GIFT</span>
          </div>
          <a
            href="/admin"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors font-body"
          >
            Для ресторана
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6">
        <div className="pt-16 pb-8">
          <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-light tracking-tight leading-tight opacity-0 animate-fade-in">
            Подарите
            <br />
            <span className="font-medium italic">незабываемый вечер</span>
          </h1>
          <p className="mt-4 text-muted-foreground font-body text-lg max-w-md opacity-0 animate-fade-in" style={{ animationDelay: "0.15s" }}>
            Электронный сертификат — идеальный подарок для тех, кто ценит вкус
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 pb-20">
          <div className="space-y-10 opacity-0 animate-slide-up" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center gap-4 text-sm font-body text-muted-foreground">
              <button
                onClick={() => setStep(1)}
                className={`flex items-center gap-2 transition-colors ${step >= 1 ? "text-foreground" : ""}`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${step >= 1 ? "bg-foreground text-background border-foreground" : "border-border"}`}>1</span>
                Сумма
              </button>
              <div className="w-8 h-px bg-border" />
              <button
                onClick={() => isValidNominal && setStep(2)}
                className={`flex items-center gap-2 transition-colors ${step >= 2 ? "text-foreground" : ""}`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${step >= 2 ? "bg-foreground text-background border-foreground" : "border-border"}`}>2</span>
                Получатель
              </button>
              <div className="w-8 h-px bg-border" />
              <button
                onClick={() => isValidNominal && recipientName.trim() && setStep(3)}
                className={`flex items-center gap-2 transition-colors ${step >= 3 ? "text-foreground" : ""}`}
              >
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs border ${step >= 3 ? "bg-foreground text-background border-foreground" : "border-border"}`}>3</span>
                Оплата
              </button>
            </div>

            {step === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-medium mb-1">Выберите номинал</h2>
                  <p className="text-sm text-muted-foreground font-body">Или укажите свою сумму от 500 ₽</p>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  {NOMINALS.map((nominal) => (
                    <button
                      key={nominal}
                      onClick={() => handleNominalSelect(nominal)}
                      className={`group relative py-5 px-4 border rounded-lg text-center transition-all duration-200 hover:border-foreground ${
                        selectedNominal === nominal
                          ? "border-foreground bg-foreground text-background"
                          : "border-border hover:shadow-sm"
                      }`}
                    >
                      <span className="font-display text-xl font-medium">{formatPrice(nominal)}</span>
                      <span className="block text-xs mt-0.5 opacity-60 font-body">₽</span>
                    </button>
                  ))}
                </div>

                <div className="relative">
                  <Input
                    type="text"
                    placeholder="Своя сумма"
                    value={customNominal}
                    onChange={(e) => handleCustomNominal(e.target.value)}
                    className="h-14 text-lg font-display pl-4 pr-12 border-border focus:border-foreground rounded-lg"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-body">₽</span>
                </div>

                <Button
                  onClick={handleNextStep}
                  disabled={!isValidNominal}
                  className="w-full h-14 text-base font-body font-medium rounded-lg bg-foreground text-background hover:bg-foreground/90 disabled:opacity-30"
                >
                  Продолжить
                  <Icon name="ArrowRight" size={18} className="ml-2" />
                </Button>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-medium mb-1">Кому дарите?</h2>
                  <p className="text-sm text-muted-foreground font-body">Имя будет указано на сертификате</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-body text-muted-foreground mb-1.5 block">Имя получателя</label>
                    <Input
                      type="text"
                      placeholder="Александр"
                      value={recipientName}
                      onChange={(e) => setRecipientName(e.target.value)}
                      className="h-14 text-lg font-display pl-4 border-border focus:border-foreground rounded-lg"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-body text-muted-foreground mb-1.5 block">Ваше имя <span className="opacity-50">(необязательно)</span></label>
                    <Input
                      type="text"
                      placeholder="Мария"
                      value={senderName}
                      onChange={(e) => setSenderName(e.target.value)}
                      className="h-14 text-lg font-display pl-4 border-border focus:border-foreground rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="h-14 px-6 rounded-lg border-border font-body"
                  >
                    <Icon name="ArrowLeft" size={18} />
                  </Button>
                  <Button
                    onClick={handleNextStep}
                    disabled={!recipientName.trim()}
                    className="flex-1 h-14 text-base font-body font-medium rounded-lg bg-foreground text-background hover:bg-foreground/90 disabled:opacity-30"
                  >
                    Продолжить
                    <Icon name="ArrowRight" size={18} className="ml-2" />
                  </Button>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <div>
                  <h2 className="font-display text-2xl font-medium mb-1">Подтвердите заказ</h2>
                  <p className="text-sm text-muted-foreground font-body">Проверьте данные перед оплатой</p>
                </div>

                <div className="space-y-4 p-6 bg-secondary/50 rounded-xl">
                  <div className="flex justify-between items-center font-body">
                    <span className="text-muted-foreground text-sm">Номинал</span>
                    <span className="font-display text-xl font-medium">{formatPrice(currentNominal)} ₽</span>
                  </div>
                  <div className="h-px bg-border" />
                  <div className="flex justify-between items-center font-body">
                    <span className="text-muted-foreground text-sm">Получатель</span>
                    <span className="font-medium">{recipientName}</span>
                  </div>
                  {senderName && (
                    <>
                      <div className="h-px bg-border" />
                      <div className="flex justify-between items-center font-body">
                        <span className="text-muted-foreground text-sm">От кого</span>
                        <span className="font-medium">{senderName}</span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="h-14 px-6 rounded-lg border-border font-body"
                  >
                    <Icon name="ArrowLeft" size={18} />
                  </Button>
                  <Button
                    onClick={handlePurchase}
                    disabled={isProcessing}
                    className="flex-1 h-14 text-base font-body font-medium rounded-lg bg-foreground text-background hover:bg-foreground/90"
                  >
                    {isProcessing ? (
                      <Icon name="Loader2" size={20} className="animate-spin" />
                    ) : (
                      <>
                        Оплатить {formatPrice(currentNominal)} ₽
                        <Icon name="CreditCard" size={18} className="ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="hidden lg:flex items-start justify-center pt-4 opacity-0 animate-fade-in" style={{ animationDelay: "0.4s" }}>
            <CertificatePreview
              nominal={currentNominal}
              recipientName={recipientName || "Имя получателя"}
              senderName={senderName}
            />
          </div>
        </div>
      </main>

      <footer className="border-t border-border/50 py-8">
        <div className="max-w-6xl mx-auto px-6 flex items-center justify-between text-sm text-muted-foreground font-body">
          <span>© 2026 Sweep GIFT</span>
          <span>Электронные сертификаты</span>
        </div>
      </footer>
    </div>
  );
};

export default Index;
