interface CertificatePreviewProps {
  nominal: number;
  recipientName: string;
  senderName?: string;
  cardNumber?: string;
}

const CertificatePreview = ({ nominal, recipientName, senderName, cardNumber }: CertificatePreviewProps) => {
  const formatPrice = (value: number) => {
    return new Intl.NumberFormat("ru-RU").format(value);
  };

  return (
    <div className="w-full max-w-md">
      <div className="relative aspect-[3/4] bg-foreground text-background rounded-2xl overflow-hidden shadow-2xl shadow-foreground/20">
        <div className="absolute inset-0 opacity-[0.03]" style={{
          backgroundImage: `radial-gradient(circle at 1px 1px, currentColor 1px, transparent 0)`,
          backgroundSize: '24px 24px'
        }} />

        <div className="relative h-full flex flex-col justify-between p-8">
          <div>
            <div className="flex items-center gap-2 mb-12">
              <div className="w-5 h-5 border border-current/30 rounded-full" />
              <span className="font-display text-sm tracking-widest uppercase opacity-60">Sweep GIFT</span>
            </div>

            <div className="space-y-1">
              <p className="font-body text-xs uppercase tracking-widest opacity-40">Подарочный сертификат</p>
              <h3 className="font-display text-4xl font-light leading-tight">
                {nominal > 0 ? `${formatPrice(nominal)} ₽` : "— ₽"}
              </h3>
            </div>
          </div>

          <div className="space-y-6">
            <div className="h-px bg-current/10" />

            <div className="space-y-4">
              <div>
                <p className="font-body text-xs uppercase tracking-widest opacity-40 mb-1">Для</p>
                <p className="font-display text-2xl font-light italic">{recipientName}</p>
              </div>

              {senderName && (
                <div>
                  <p className="font-body text-xs uppercase tracking-widest opacity-40 mb-1">От</p>
                  <p className="font-display text-lg font-light">{senderName}</p>
                </div>
              )}
            </div>

            <div className="h-px bg-current/10" />

            <div className="flex items-end justify-between">
              <div>
                {cardNumber && (
                  <p className="font-body text-xs tracking-wider opacity-50">№ {cardNumber}</p>
                )}
                <p className="font-body text-xs opacity-30 mt-1">sweepgift.ru</p>
              </div>
              <div className="w-16 h-16 bg-current/10 rounded-lg flex items-center justify-center">
                <span className="font-body text-[8px] uppercase tracking-wider opacity-30">QR</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-muted-foreground font-body mt-4 opacity-60">
        Превью сертификата
      </p>
    </div>
  );
};

export default CertificatePreview;
