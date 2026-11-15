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
$ffmpeg = Join-Path $bin 'ffmpeg.exe'

function Download-File($url, $out) {
  Write-Host "  Dang tai $url"
  $curl = Join-Path $env:SystemRoot 'System32\curl.exe'
  for ($try = 1; $try -le 4; $try++) {
    try {
      if (Test-Path $curl) {
        # curl co san trong Windows 10/11: tu thu lai va tai tiep neu bi dut mang
        & $curl -L --fail --retry 5 --retry-delay 3 -C - -o $out $url
        if ($LASTEXITCODE -ne 0) { throw "curl loi $LASTEXITCODE" }
      } else {
        Invoke-WebRequest -UseBasicParsing -Uri $url -OutFile $out
      }
      return
    } catch {
      Write-Host "  Tai loi (lan $try/4), thu lai..."
      Start-Sleep -Seconds 3
    }
  }
  throw "Khong tai duoc $url. Kiem tra mang roi chay lai, hoac xem huong dan tai thu cong trong README."
}

Write-Host '== Buoc 1: tai cong cu (chi lan dau, khoang 2 phut) =='
if (-not (Test-Path $go2rtc)) {
  $zip = Join-Path $bin 'go2rtc.zip'
  Download-File 'https://github.com/AlexxIT/go2rtc/releases/latest/download/go2rtc_win64.zip' $zip
  Expand-Archive -Path $zip -DestinationPath $bin -Force
  Remove-Item $zip -Force
}
function Test-Exe($path, $minMB) {
  if (-not (Test-Path $path)) { return $false }
  if ((Get-Item $path).Length -lt ($minMB * 1MB)) { return $false }
  $b = [IO.File]::ReadAllBytes($path)[0..1]
  return ($b[0] -eq 0x4D -and $b[1] -eq 0x5A)
}
foreach ($f in @(@($go2rtc, 5), @($cloudflared, 10), @($node, 20), @($ffmpeg, 20))) {
  if ((Test-Path $f[0]) -and -not (Test-Exe $f[0] $f[1])) {
    Write-Host "  File hong, tai lai: $($f[0])"
    Remove-Item $f[0] -Force
  }
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

if (-not (Test-Path $ffmpeg)) {
  $zip = Join-Path $bin 'ffmpeg.zip'
  $tmp = Join-Path $bin 'ffmpeg-tmp'
  Write-Host '  (ffmpeg kha nang lon, tai mot lan, vui long doi...)'
  Download-File 'https://www.gyan.dev/ffmpeg/builds/ffmpeg-release-essentials.zip' $zip
  Expand-Archive -Path $zip -DestinationPath $tmp -Force
  $found = Get-ChildItem -Path $tmp -Recurse -Filter ffmpeg.exe | Select-Object -First 1
  if (-not $found) { throw 'Khong tim thay ffmpeg.exe trong file tai ve.' }
  Copy-Item $found.FullName $ffmpeg -Force
  Remove-Item $zip -Force
  Remove-Item $tmp -Recurse -Force
}
$env:PATH = "$bin;$env:PATH"

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
  camera: ffmpeg:rtsp://admin:$code@${ip}:554/cam/realmonitor?channel=1&subtype=1#video=h264#audio=aac
"@
  Set-Content -Path $cfg -Value $yaml -Encoding ASCII
  Write-Host '  Da luu cau hinh (file go2rtc.yaml, chi nam tren may nay).'
}

# Cau hinh cu: doi sang chuyen ma H.264 de trinh duyet nao cung phat duoc
$txt = Get-Content $cfg -Raw
if ($txt -notmatch 'ffmpeg:') {
  $txt = $txt -replace '(?m)^(\s*camera:\s*)(rtsp://\S+)\s*$', '$1ffmpeg:$2#video=h264#audio=aac'
  Set-Content -Path $cfg -Value $txt -Encoding ASCII
}

# Tat cac tien trinh cu con sot lai tu lan chay truoc (neu co)
foreach ($p in (Get-Process go2rtc, cloudflared, node -ErrorAction SilentlyContinue)) {
  if ($p.Path -and $p.Path.StartsWith($bin, [StringComparison]::OrdinalIgnoreCase)) { Stop-Process -Id $p.Id -Force -ErrorAction SilentlyContinue }
}
Start-Sleep -Seconds 1

$procs = @()
try {
  Write-Host ''
  Write-Host '== Buoc 3: bat camera =='
  $procs += Start-Process -FilePath $go2rtc -ArgumentList '-config', 'go2rtc.yaml' -WorkingDirectory $root -WindowStyle Hidden -RedirectStandardOutput (Join-Path $root 'go2rtc.log') -RedirectStandardError (Join-Path $root 'go2rtc-err.log') -PassThru
  $plog = Join-Path $root 'proxy.log'
  $procs += Start-Process -FilePath $node -ArgumentList 'proxy.js' -WorkingDirectory $root -WindowStyle Hidden -RedirectStandardOutput $plog -RedirectStandardError (Join-Path $root 'proxy-err.log') -PassThru
  Start-Sleep -Seconds 3

  Write-Host '  Dang thu mo hinh tu camera...'
  try {
    $r = Invoke-WebRequest -UseBasicParsing -Uri 'http://127.0.0.1:18080/api/stream.m3u8?src=camera' -TimeoutSec 60
    if ($r.StatusCode -eq 200) { Write-Host '  OK: da nhan duoc hinh tu camera.' }
  } catch {
    Write-Host '  CANH BAO: chua mo duoc hinh tu camera. Kiem tra IP, ma an toan, va may dang cung Wi-Fi voi camera.'
    Write-Host '  (Xoa file go2rtc.yaml roi chay lai de nhap lai thong tin.)'
    Write-Host '  --- Nhat ky go2rtc (da che ma an toan) ---'
    foreach ($lf in @('go2rtc.log', 'go2rtc-err.log')) {
      $lp = Join-Path $root $lf
      if (Test-Path $lp) { Get-Content $lp -ErrorAction SilentlyContinue | Select-Object -Last 12 | ForEach-Object { Write-Host ('  ' + ($_ -replace 'rtsp://[^@\s]*@', 'rtsp://***@')) } }
    }
  }

  if ($procs[1].HasExited) {
    Write-Host '  LOI: cong bao ve (node) bi tat. Noi dung loi:'
    Get-Content (Join-Path $root 'proxy-err.log') -ErrorAction SilentlyContinue | Select-Object -First 8 | ForEach-Object { Write-Host "  $_" }
    throw 'Cong bao ve khong chay. Chup man hinh nay gui lai.'
  }
  $log = Join-Path $root 'tunnel.log'
  if (Test-Path $log) { Remove-Item $log -Force -ErrorAction SilentlyContinue }
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
