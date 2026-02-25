import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import Icon from "@/components/ui/icon";
import CertificateResult from "@/components/CertificateResult";
import { Button } from "@/components/ui/button";

const CHECK_PAYMENT_URL = "https://functions.poehali.dev/ff05838a-d8e7-43a7-9b9e-006f28780541";

interface CertificateData {
  clientId: string;
  cardNumber: string;
  cardBarcode: string;
  cardHash: string;
  recipientName: string;
  senderName: string;
  nominal: number;
  qrUrl: string;
}

type PageState = "loading" | "success" | "not_paid" | "error";

const PaymentReturn = () => {
  const [searchParams] = useSearchParams();
  const [state, setState] = useState<PageState>("loading");
  const [certificate, setCertificate] = useState<CertificateData | null>(null);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const orderId = searchParams.get("orderId");
    if (!orderId) {
      setState("error");
      setErrorMsg("Отсутствует ID заказа");
      return;
    }
    checkPayment(orderId);
  }, [searchParams]);

  const checkPayment = async (orderId: string) => {
    try {
      const resp = await fetch(CHECK_PAYMENT_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });
      const data = await resp.json();

      if (!resp.ok) {
        setState("error");
        setErrorMsg(data.error || "Ошибка проверки платежа");
        return;
      }

      if (data.paid && data.certificate) {
        setCertificate(data.certificate);
        setState("success");
      } else if (data.paid && data.error) {
        setState("error");
        setErrorMsg(data.error);
      } else {
        setState("not_paid");
        setErrorMsg(data.message || "Оплата не завершена");
      }
    } catch {
      setState("error");
      setErrorMsg("Не удалось проверить статус оплаты");
    }
  };

  const handleNewCertificate = () => {
    window.location.href = "/";
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <a href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center">
              <Icon name="Gift" size={16} className="text-background" />
            </div>
            <span className="font-display text-xl font-semibold tracking-tight">Sweep GIFT</span>
          </a>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-16">
        {state === "loading" && (
          <div className="text-center space-y-4 py-20">
            <div className="w-12 h-12 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin mx-auto" />
            <p className="font-body text-muted-foreground">Проверяем оплату...</p>
          </div>
        )}

        {state === "success" && certificate && (
          <CertificateResult certificate={certificate} onNewCertificate={handleNewCertificate} />
        )}

        {state === "not_paid" && (
          <div className="text-center space-y-6 py-20">
            <div className="w-14 h-14 bg-amber-500/10 rounded-full flex items-center justify-center mx-auto">
              <Icon name="Clock" size={24} className="text-amber-500" />
            </div>
            <div className="space-y-2">
              <h1 className="font-display text-3xl font-medium">Оплата не завершена</h1>
              <p className="text-muted-foreground font-body">{errorMsg}</p>
            </div>
            <Button onClick={() => window.location.href = "/"} className="h-14 px-8 text-base font-body rounded-lg bg-foreground text-background hover:bg-foreground/90">
              Попробовать снова
            </Button>
          </div>
        )}

        {state === "error" && (
          <div className="text-center space-y-6 py-20">
            <div className="w-14 h-14 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
              <Icon name="AlertCircle" size={24} className="text-red-500" />
            </div>
            <div className="space-y-2">
              <h1 className="font-display text-3xl font-medium">Произошла ошибка</h1>
              <p className="text-muted-foreground font-body">{errorMsg}</p>
            </div>
            <Button onClick={() => window.location.href = "/"} className="h-14 px-8 text-base font-body rounded-lg bg-foreground text-background hover:bg-foreground/90">
              На главную
            </Button>
          </div>
        )}
      </main>
    </div>
  );
};

export default PaymentReturn;
