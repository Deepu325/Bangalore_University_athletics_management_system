# Test API endpoints

$collegeId = '691dc72e27b8153b0d0c7dc1'
$token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MWRjNzJlMjdiODE1M2IwZDBjN2RjNCIsInVzZXJuYW1lIjoicmV2X2ZyX2pvaG4iLCJyb2xlIjoicGVkIiwiY29sbGVnZUlkIjoiNjkxZGM3MmUyN2I4MTUzYjBkMGM3ZGMxIiwiY29sbGVnZU5hbWUiOiJTdC4gWGF2aWVyIENvbGxlZ2UiLCJpYXQiOjE3NjM1NTkyNDQsImV4cCI6MTc2MzY0NTY0NH0.RzVViujGj0tfQMoPXfumrmPoLHYzaA5YEI90NAr1z0g'
$headers = @{'Content-Type'='application/json';'Authorization'="Bearer $token"}

Write-Host "Testing Athlete Registration..."
Write-Host "================================"

$body = @{
    name='Rajesh Kumar'
    gender='Male'
    age=21
    college=$collegeId
    events=@('100m','4x100m Relay')
} | ConvertTo-Json

Write-Host "Request Body:`n$body`n"

try {
    $resp = Invoke-WebRequest -Uri 'http://localhost:5001/api/athletes' -Method POST -Headers $headers -Body $body -ErrorAction Stop
    Write-Host "✓ SUCCESS!"
    Write-Host "Response:`n" ($resp.Content | ConvertFrom-Json | ConvertTo-Json)
} catch {
    Write-Host "✗ FAILED:`n$($_.Exception.Message)"
}

Write-Host "`n`nTesting Get Athletes..."
Write-Host "================================"
try {
    $resp = Invoke-WebRequest -Uri 'http://localhost:5001/api/athletes' -Method GET -Headers $headers -ErrorAction Stop
    $data = $resp.Content | ConvertFrom-Json
    Write-Host "✓ SUCCESS! Found $($data.Length) athletes"
    Write-Host "First athlete:`n" ($data[0] | ConvertTo-Json)
} catch {
    Write-Host "✗ FAILED:`n$($_.Exception.Message)"
}
