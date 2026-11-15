# Cau noi camera Imou (RTSP) -> web. Chay bang cach bam doi vao bat-camera.bat
$ErrorActionPreference = 'Stop'
$ProgressPreference = 'SilentlyContinue'
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$root = $PSScriptRoot
$bin = Join-Path $root 'bin'
New-Item -ItemType Directory -Force -Path $bin | Out-Null

$go2rtc = Join-Path $bin 'go2rtc.exe'
$cloudflared = Join-Path $bin 'cloudflared.exe'
$node = Join-Path $bin 'node.exe'

function Download-File($url, $out) {
  Write-Host "  Dang tai $url"
  Invoke-WebRequest -UseBasicParsing -Uri $url -OutFile $out
}

Write-Host '== Buoc 1: tai cong cu (chi lan dau, khoang 2 phut) =='
if (-not (Test-Path $go2rtc)) {
  $zip = Join-Path $bin 'go2rtc.zip'
  Download-File 'https://github.com/AlexxIT/go2rtc/releases/latest/download/go2rtc_win64.zip' $zip
  Expand-Archive -Path $zip -DestinationPath $bin -Force
  Remove-Item $zip -Force
}
if (-not (Test-Path $cloudflared)) {
  Download-File 'https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.exe' $cloudflared
}
if (-not (Test-Path $node)) {
  $zip = Join-Path $bin 'node.zip'
  $tmp = Join-Path $bin 'node-tmp'
  Download-File 'https://nodejs.org/dist/v22.12.0/node-v22.12.0-win-x64.zip' $zip
  Expand-Archive -Path $zip -DestinationPath $tmp -Force
  Copy-Item (Join-Path $tmp 'node-v22.12.0-win-x64\node.exe') $node -Force
  Remove-Item $zip -Force
  Remove-Item $tmp -Recurse -Force
}

$cfg = Join-Path $root 'go2rtc.yaml'
if (-not (Test-Path $cfg)) {
  Write-Host ''
  Write-Host '== Buoc 2: nhap thong tin camera (chi lan dau, chi luu tren may nay) =='
  $ip = (Read-Host 'Dia chi IP camera (vi du 192.168.1.12)').Trim()
  if ($ip -notmatch '^\d{1,3}(\.\d{1,3}){3}$') { throw 'Dia chi IP khong hop le.' }
  $sec = Read-Host 'Ma an toan tren tem camera (se bi an khi go)' -AsSecureString
  $code = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($sec)).Trim()
  if ($code -notmatch '^[A-Za-z0-9]+$') { throw 'Ma an toan chi gom chu va so.' }
  $yaml = @"
api:
  listen: "127.0.0.1:11984"
rtsp:
  listen: ""
webrtc:
  listen: ""
streams:
  camera: rtsp://admin:$code@${ip}:554/cam/realmonitor?channel=1&subtype=1
"@
  Set-Content -Path $cfg -Value $yaml -Encoding ASCII
  Write-Host '  Da luu cau hinh (file go2rtc.yaml, chi nam tren may nay).'
}

$procs = @()
try {
  Write-Host ''
  Write-Host '== Buoc 3: bat camera =='
  $procs += Start-Process -FilePath $go2rtc -ArgumentList '-config', 'go2rtc.yaml' -WorkingDirectory $root -WindowStyle Minimized -PassThru
  $procs += Start-Process -FilePath $node -ArgumentList 'proxy.js' -WorkingDirectory $root -WindowStyle Minimized -PassThru
  Start-Sleep -Seconds 3

  Write-Host '  Dang thu mo hinh tu camera...'
  try {
    $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:18080/api/stream.m3u8?src=camera' -TimeoutSec 25
    if ($r.StatusCode -eq 200) { Write-Host '  OK: da nhan duoc hinh tu camera.' }
  } catch {
    Write-Host '  CANH BAO: chua mo duoc hinh tu camera. Kiem tra IP, ma an toan, va may dang cung Wi-Fi voi camera.'
    Write-Host '  (Xoa file go2rtc.yaml roi chay lai de nhap lai thong tin.)'
  }

  $log = Join-Path $root 'tunnel.log'
  if (Test-Path $log) { Remove-Item $log -Force }
  $procs += Start-Process -FilePath $cloudflared -ArgumentList 'tunnel', '--url', 'http://127.0.0.1:18080', '--no-autoupdate', '--protocol', 'http2' -RedirectStandardError $log -WindowStyle Hidden -PassThru

  Write-Host '  Dang tao duong ham ra internet...'
  $public = $null
  for ($i = 0; $i -lt 60 -and -not $public; $i++) {
    Start-Sleep -Seconds 1
    if (Test-Path $log) {
      $m = [regex]::Match((Get-Content $log -Raw -ErrorAction SilentlyContinue), 'https://[a-z0-9-]+\.trycloudflare\.com')
      if ($m.Success) { $public = $m.Value }
    }
  }
  if (-not $public) { throw 'Khong tao duoc duong ham. Kiem tra mang Internet roi chay lai.' }

  $link = "$public/api/stream.m3u8?src=camera"
  Set-Clipboard -Value $link
  Write-Host ''
  Write-Host '=============================================================='
  Write-Host ' CAMERA DANG CHAY. Dia chi luong camera (da sao chep san):'
  Write-Host ''
  Write-Host "   $link"
  Write-Host ''
  Write-Host ' Vao web -> Admin -> Cai dat -> Camera, dan dia chi nay roi bam Luu.'
  Write-Host ' GIU CUA SO NAY MO khi can xem camera. Bam Enter de tat.'
  Write-Host '=============================================================='
  [void](Read-Host)
}
finally {
  foreach ($p in $procs) {
    if ($p -and -not $p.HasExited) { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue }
  }
  Write-Host 'Da tat camera.'
}
