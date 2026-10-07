# Overpass próprio na Oracle Cloud (uso ilimitado do OpenStreetMap)

Este diretório sobe um servidor Overpass seu, carregado com os dados do OpenStreetMap do Brasil e atualizado todo dia.
O app passa a consultar esse servidor primeiro, e só usa os espelhos públicos (que vivem sobrecarregados) como reserva.

## 1. Criar a máquina (gratuita, Always Free)

No painel da Oracle Cloud: **Compute → Instances → Create instance**

| Campo | Valor |
|---|---|
| Image | Canonical Ubuntu 24.04 (aarch64) |
| Shape | Ampere **VM.Standard.A1.Flex**, 4 OCPUs, 24 GB de RAM |
| Boot volume | **150 GB** (o plano gratuito dá 200 GB no total) |
| SSH keys | cole sua chave pública ou gere uma e baixe a privada |

Anote o **IP público** da instância quando ela estiver "Running".

Se aparecer *Out of host capacity*, a região está sem máquinas ARM livres no momento. Tente de novo em outro horário ou outro *availability domain*. Isso é comum e não é erro seu.

## 2. Liberar as portas 80 e 443

**Networking → Virtual cloud networks → sua VCN → Security Lists → Default Security List → Add Ingress Rules**

Duas regras, uma para cada porta:

- Source CIDR `0.0.0.0/0`, protocolo TCP, Destination port `80`
- Source CIDR `0.0.0.0/0`, protocolo TCP, Destination port `443`

## 3. Instalar

No seu computador, copie esta pasta para a VM e rode o instalador:

```bash
scp -r servidor-overpass ubuntu@SEU-IP:~/
ssh ubuntu@SEU-IP
cd servidor-overpass && bash instalar.sh
```

O script instala o Docker, libera as portas no firewall da própria VM, cria o arquivo `.env` com o domínio `SEU-IP.sslip.io` (HTTPS automático sem precisar comprar domínio) e sobe os dois containers.

## 4. Esperar a carga inicial

A primeira vez baixa 2 GB do Geofabrik, converte e importa. Leva de 2 a 5 horas. Pode fechar o SSH, continua rodando.

```bash
sudo docker compose logs -f overpass     # acompanhar
sudo docker compose ps                   # pronto quando o overpass aparecer como "healthy"
```

Mensagens normais no log, não são problema:

- centenas de linhas `compute_geometry: ... not found` (relações que cruzam a fronteira do extrato)
- `Error while downloading diffs` logo após a carga: o servidor tentou baixar a atualização seguinte, que o Geofabrik ainda não publicou. No dia seguinte entra.

## 5. Testar

```bash
curl "https://SEU-IP.sslip.io/api/interpreter?data=%5Bout%3Ajson%5D%3Bnode%5Bamenity%3Ddentist%5D(around%3A1000%2C-23.5015%2C-47.4526)%3Bout%3B"
```

Deve voltar um JSON com `elements` (dentistas a 1 km do centro de Sorocaba).

## 6. Ligar no app

Na Vercel: **Settings → Environment Variables → Add**

- Nome: `OVERPASS_EPS`
- Valor: `https://SEU-IP.sslip.io/api/interpreter`

Depois **Deployments → ⋯ → Redeploy**. A partir daí toda busca vai primeiro no seu servidor.
Para ter mais de um servidor próprio, separe as URLs por vírgula.

## Manutenção

- As atualizações do OSM entram sozinhas uma vez por dia (`OVERPASS_UPDATE_SLEEP`).
- Atualizar a imagem do Overpass: `sudo docker compose pull && sudo docker compose up -d`
- Ver espaço em disco: `df -h /` (o banco do Brasil ocupa uns 30 a 40 GB)
- A Oracle desliga máquinas gratuitas ociosas por 7 dias seguidos. A atualização diária costuma manter uso suficiente, mas se a VM sumir, basta recriar e rodar o `instalar.sh` de novo.
- Recomeçar do zero: `sudo docker compose down && sudo rm -rf db && sudo docker compose up -d`

## Outro país ou região menor

Troque no `.env` (lista em https://download.geofabrik.de/):

```
PLANET_URL=https://download.geofabrik.de/south-america/brazil/sudeste-latest.osm.pbf
DIFF_URL=https://download.geofabrik.de/south-america/brazil/sudeste-updates/
```
