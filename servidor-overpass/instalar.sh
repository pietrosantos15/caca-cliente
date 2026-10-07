#!/usr/bin/env bash
# Instala o Overpass próprio numa VM Ubuntu (testado com a imagem Ubuntu da Oracle Cloud, ARM ou x86).
# Uso: bash instalar.sh          (de dentro da pasta servidor-overpass, como usuário "ubuntu")
set -euo pipefail
cd "$(dirname "$0")"

echo "== 1/4 Docker"
if ! command -v docker >/dev/null 2>&1; then
  curl -fsSL https://get.docker.com | sudo sh
  sudo usermod -aG docker "$USER" || true
fi

echo "== 2/4 Firewall da própria VM (a imagem Ubuntu da Oracle bloqueia tudo, menos SSH)"
for p in 80 443; do
  sudo iptables -C INPUT -p tcp --dport "$p" -m state --state NEW -j ACCEPT 2>/dev/null \
    || sudo iptables -I INPUT 5 -p tcp --dport "$p" -m state --state NEW -j ACCEPT
done
sudo netfilter-persistent save >/dev/null 2>&1 || sudo sh -c 'iptables-save > /etc/iptables/rules.v4' || true

echo "== 3/4 Domínio para o HTTPS"
if [ ! -f .env ]; then
  IP=$(curl -fs https://api.ipify.org || curl -fs https://ifconfig.me)
  printf 'DOMINIO=%s.sslip.io\n' "$IP" > .env
  echo "Sem domínio próprio: usando $IP.sslip.io (troque em .env se tiver um domínio seu)"
fi
mkdir -p db
echo "Espaço em disco disponível (precisa de uns 60 GB livres para o Brasil):"; df -h . | tail -1

echo "== 4/4 Subindo Overpass + Caddy"
sudo docker compose up -d
DOM=$(grep '^DOMINIO=' .env | cut -d= -f2)
cat <<FIM

Pronto. A carga inicial do Brasil leva algumas horas (baixa 2 GB, converte e importa).
  Acompanhar:   sudo docker compose logs -f overpass
  Terminou quando aparecer "Overpass database ready" / o container ficar "healthy" em: sudo docker compose ps

Teste depois (dentistas a 1 km do centro de Sorocaba):
  curl "https://$DOM/api/interpreter?data=%5Bout%3Ajson%5D%3Bnode%5Bamenity%3Ddentist%5D(around%3A1000%2C-23.5015%2C-47.4526)%3Bout%3B"

Na Vercel, crie a variável OVERPASS_EPS com o valor:
  https://$DOM/api/interpreter
e faça um redeploy.
FIM
