import { useState } from "react";
import Icon from "@/components/ui/icon";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Certificate {
  id: string;
  recipientName: string;
  senderName: string;
  nominal: number;
  cardNumber: string;
  status: "active" | "used" | "expired";
  createdAt: string;
  balance: number;
}

const MOCK_CERTIFICATES: Certificate[] = [
  {
    id: "1",
    recipientName: "Александр Петров",
    senderName: "Мария Иванова",
    nominal: 5000,
    cardNumber: "SG-00001",
    status: "active",
    createdAt: "2026-02-20",
    balance: 5000,
  },
  {
    id: "2",
    recipientName: "Елена Сидорова",
    senderName: "Дмитрий Козлов",
    nominal: 3000,
    cardNumber: "SG-00002",
    status: "used",
    createdAt: "2026-02-18",
    balance: 0,
  },
  {
    id: "3",
    recipientName: "Игорь Новиков",
    senderName: "",
    nominal: 10000,
    cardNumber: "SG-00003",
    status: "active",
    createdAt: "2026-02-22",
    balance: 7500,
  },
];

const Admin = () => {
  const [search, setSearch] = useState("");
  const [certificates] = useState<Certificate[]>(MOCK_CERTIFICATES);

  const formatPrice = (value: number) => new Intl.NumberFormat("ru-RU").format(value);

  const statusMap = {
    active: { label: "Активен", variant: "default" as const },
    used: { label: "Использован", variant: "secondary" as const },
    expired: { label: "Истёк", variant: "destructive" as const },
  };

  const filtered = certificates.filter(
    (c) =>
      c.recipientName.toLowerCase().includes(search.toLowerCase()) ||
      c.cardNumber.toLowerCase().includes(search.toLowerCase()) ||
      c.senderName.toLowerCase().includes(search.toLowerCase())
  );

  const totalActive = certificates.filter((c) => c.status === "active").length;
  const totalBalance = certificates
    .filter((c) => c.status === "active")
    .reduce((sum, c) => sum + c.balance, 0);
  const totalSold = certificates.reduce((sum, c) => sum + c.nominal, 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <a href="/" className="flex items-center gap-3 hover:opacity-70 transition-opacity">
              <div className="w-8 h-8 bg-foreground rounded-full flex items-center justify-center">
                <Icon name="Gift" size={16} className="text-background" />
              </div>
              <span className="font-display text-xl font-semibold tracking-tight">Sweep GIFT</span>
            </a>
            <span className="text-muted-foreground font-body text-sm ml-2">/ Админ-панель</span>
          </div>
          <Button variant="outline" size="sm" className="font-body" asChild>
            <a href="/">
              <Icon name="ExternalLink" size={14} className="mr-2" />
              На сайт
            </a>
          </Button>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-10">
        <div className="mb-10 opacity-0 animate-fade-in">
          <h1 className="font-display text-3xl font-medium tracking-tight mb-2">Сертификаты</h1>
          <p className="text-muted-foreground font-body">Управление выданными электронными сертификатами</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10 opacity-0 animate-slide-up" style={{ animationDelay: "0.1s" }}>
          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                <Icon name="CreditCard" size={18} className="text-muted-foreground" />
              </div>
              <span className="font-body text-sm text-muted-foreground">Активных</span>
            </div>
            <p className="font-display text-3xl font-medium">{totalActive}</p>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                <Icon name="Wallet" size={18} className="text-muted-foreground" />
              </div>
              <span className="font-body text-sm text-muted-foreground">Остаток на картах</span>
            </div>
            <p className="font-display text-3xl font-medium">{formatPrice(totalBalance)} ₽</p>
          </div>

          <div className="p-6 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center">
                <Icon name="TrendingUp" size={18} className="text-muted-foreground" />
              </div>
              <span className="font-body text-sm text-muted-foreground">Продано на сумму</span>
            </div>
            <p className="font-display text-3xl font-medium">{formatPrice(totalSold)} ₽</p>
          </div>
        </div>

        <div className="opacity-0 animate-slide-up" style={{ animationDelay: "0.2s" }}>
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Icon name="Search" size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Поиск по имени или номеру..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-11 font-body border-border rounded-lg"
              />
            </div>
            <span className="text-sm text-muted-foreground font-body">
              {filtered.length} из {certificates.length}
            </span>
          </div>

          <div className="border border-border rounded-xl overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="hover:bg-transparent">
                  <TableHead className="font-body text-xs uppercase tracking-wider">Номер</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider">Получатель</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider">От кого</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider text-right">Номинал</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider text-right">Остаток</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider">Статус</TableHead>
                  <TableHead className="font-body text-xs uppercase tracking-wider">Дата</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((cert) => (
                  <TableRow key={cert.id} className="font-body">
                    <TableCell className="font-medium text-sm">{cert.cardNumber}</TableCell>
                    <TableCell>{cert.recipientName}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {cert.senderName || "—"}
                    </TableCell>
                    <TableCell className="text-right font-display font-medium">
                      {formatPrice(cert.nominal)} ₽
                    </TableCell>
                    <TableCell className="text-right font-display font-medium">
                      {formatPrice(cert.balance)} ₽
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusMap[cert.status].variant} className="font-body text-xs font-normal">
                        {statusMap[cert.status].label}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {new Date(cert.createdAt).toLocaleDateString("ru-RU")}
                    </TableCell>
                  </TableRow>
                ))}
                {filtered.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-12 text-muted-foreground font-body">
                      <Icon name="SearchX" size={24} className="mx-auto mb-2 opacity-30" />
                      Ничего не найдено
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Admin;
