# PowerShell script to create and install a local Code Signing Certificate for StreamPulse
$certSubject = "CN=Yuksel Bilgin, O=StreamPulse, OU=Development, C=TR"
$pfxPath = Join-Path (Get-Location) "build\cert.pfx"
$password = ConvertTo-SecureString -String "StreamPulse2026!" -Force -AsPlainText

Write-Host "Creating Code Signing Certificate..." -ForegroundColor Cyan

# 1. Generate the certificate in CurrentUser\My
$cert = New-SelfSignedCertificate -Type CodeSigningCert -Subject $certSubject -CertStoreLocation "Cert:\CurrentUser\My" -NotAfter (Get-Date).AddYears(5)

Write-Host "Certificate created with Thumbprint: $($cert.Thumbprint)" -ForegroundColor Green

# 2. Ensure build directory exists
if (-not (Test-Path "build")) {
    New-Item -ItemType Directory -Path "build" | Out-Null
}

# 3. Export to PFX
Export-PfxCertificate -Cert $cert -FilePath $pfxPath -Password $password | Out-Null
Write-Host "Exported PFX to: $pfxPath" -ForegroundColor Green

# 4. Import certificate to Trusted Root and Trusted Publisher for current user
$rootStore = New-Object System.Security.Cryptography.X509Certificates.X509Store("Root", "CurrentUser")
$rootStore.Open("ReadWrite")
$rootStore.Add($cert)
$rootStore.Close()

$pubStore = New-Object System.Security.Cryptography.X509Certificates.X509Store("TrustedPublisher", "CurrentUser")
$pubStore.Open("ReadWrite")
$pubStore.Add($cert)
$pubStore.Close()

Write-Host "Certificate installed into CurrentUser\Root and CurrentUser\TrustedPublisher successfully!" -ForegroundColor Green
