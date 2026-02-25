import Icon from "@/components/ui/icon";
import { Button } from "@/components/ui/button";

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

interface CertificateResultProps {
  certificate: CertificateData;
  onNewCertificate: () => void;
}

const CertificateResult = ({ certificate, onNewCertificate }: CertificateResultProps) => {
  const formatPrice = (value: number) => new Intl.NumberFormat("ru-RU").format(value);

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(certificate.qrUrl || certificate.cardNumber)}&bgcolor=1a1a1a&color=f5f0eb&format=svg`;

  const handleShare = async () => {
    const text = `Подарочный сертификат Sweep GIFT на ${formatPrice(certificate.nominal)} ₽ для ${certificate.recipientName}. Карта: ${certificate.cardNumber}`;
    if (navigator.share) {
      await navigator.share({ title: "Sweep GIFT", text, url: certificate.qrUrl });
    } else {
      await navigator.clipboard.writeText(text + "\n" + certificate.qrUrl);
    }
  };

  return (
    <div className="space-y-8 opacity-0 animate-fade-in">
      <div className="text-center space-y-2">
        <div className="w-14 h-14 bg-foreground rounded-full flex items-center justify-center mx-auto mb-4">
          <Icon name="Check" size={24} className="text-background" />
        </div>
        <h1 className="font-display text-3xl md:text-4xl font-medium tracking-tight">Сертификат создан</h1>
        <p className="text-muted-foreground font-body">Карта клиента зарегистрирована в системе лояльности</p>
      </div>

      <div className="relative bg-foreground text-background rounded-2xl overflow-hidden shadow-2xl shadow-foreground/20">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }} />

        <div className="relative p-8 md:p-10">
          <div className="flex items-center gap-2 mb-10">
            <div className="w-5 h-5 border border-current/30 rounded-full" />
            <span className="font-display text-sm tracking-widest uppercase opacity-60">Sweep GIFT</span>
          </div>

          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
            <div className="space-y-6 flex-1">
              <div>
                <p className="font-body text-xs uppercase tracking-widest opacity-40 mb-1">Подарочный сертификат</p>
                <h2 className="font-display text-5xl font-light">{formatPrice(certificate.nominal)} ₽</h2>
              </div>

              <div className="h-px bg-current/10" />

              <div className="space-y-3">
                <div>
                  <p className="font-body text-xs uppercase tracking-widest opacity-40 mb-0.5">Для</p>
                  <p className="font-display text-2xl font-light italic">{certificate.recipientName}</p>
                </div>
                {certificate.senderName && (
                  <div>
                    <p className="font-body text-xs uppercase tracking-widest opacity-40 mb-0.5">От</p>
                    <p className="font-display text-lg font-light">{certificate.senderName}</p>
                  </div>
                )}
              </div>

              <div className="h-px bg-current/10" />

              <div className="space-y-1">
                <p className="font-body text-xs tracking-wider opacity-50">Карта № {certificate.cardNumber}</p>
                {certificate.cardBarcode && (
                  <p className="font-body text-xs tracking-wider opacity-30">Баркод: {certificate.cardBarcode}</p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-center gap-3 shrink-0">
              <div className="w-40 h-40 bg-current/10 rounded-xl flex items-center justify-center overflow-hidden">
                <img
                  src={qrImageUrl}
                  alt="QR код сертификата"
                  className="w-36 h-36"
                  loading="eager"
                />
              </div>
              <p className="font-body text-[10px] uppercase tracking-wider opacity-30 text-center">Отсканируйте для<br />активации карты</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <Button
          onClick={handleShare}
          className="flex-1 h-14 text-base font-body font-medium rounded-lg bg-foreground text-background hover:bg-foreground/90"
        >
          <Icon name="Share2" size={18} className="mr-2" />
          Поделиться
        </Button>
        {certificate.qrUrl && (
          <Button
            variant="outline"
            onClick={() => window.open(certificate.qrUrl, "_blank")}
            className="flex-1 h-14 text-base font-body font-medium rounded-lg border-border"
          >
            <Icon name="ExternalLink" size={18} className="mr-2" />
            Открыть карту
          </Button>
        )}
        <Button
          variant="outline"
          onClick={onNewCertificate}
          className="h-14 px-6 rounded-lg border-border font-body"
        >
          <Icon name="Plus" size={18} className="mr-2" />
          Ещё один
        </Button>
      </div>
    </div>
  );
};

export default CertificateResult;
