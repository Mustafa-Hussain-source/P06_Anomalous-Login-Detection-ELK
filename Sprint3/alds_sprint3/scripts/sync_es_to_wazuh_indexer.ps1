param(
    [string]$EsUrl = "http://127.0.0.1:9200",
    [string]$IndexerUrl = "https://127.0.0.1:9201",
    [string]$IndexerUser = "admin",
    [string]$IndexerPassword = "admin"
)

$indices = @("alds-login-events", "wazuh-alerts", "wazuh-logs")

[System.Net.ServicePointManager]::ServerCertificateValidationCallback = { $true }
$pair = "${IndexerUser}:${IndexerPassword}"
$basic = [Convert]::ToBase64String([Text.Encoding]::ASCII.GetBytes($pair))
$headers = @{ Authorization = "Basic $basic" }

foreach ($index in $indices) {
    try {
        $response = Invoke-RestMethod -Uri "$EsUrl/$index/_search?size=10000" -Method Get -ErrorAction Stop
    }
    catch {
        Write-Host "Skipping $index (not found in Elasticsearch)."
        continue
    }

    if (-not $response.hits.hits -or $response.hits.hits.Count -eq 0) {
        Write-Host "No documents to sync for $index."
        continue
    }

    # Route to time-series index name for Wazuh Dashboard compatibility
    $todayDate = Get-Date -Format "yyyy.MM.dd"
    $indexerIndex = "$index-$todayDate"

    $lines = New-Object System.Collections.Generic.List[string]
    foreach ($hit in $response.hits.hits) {
        $action = @{ index = @{ _index = $indexerIndex; _id = $hit._id } } | ConvertTo-Json -Compress
        $doc = $hit._source | ConvertTo-Json -Compress -Depth 20
        $lines.Add($action)
        $lines.Add($doc)
    }
    $payload = ($lines -join "`n") + "`n"

    $bulkResponse = Invoke-RestMethod `
        -Uri "$IndexerUrl/_bulk" `
        -Method Post `
        -Headers $headers `
        -ContentType "application/x-ndjson" `
        -Body $payload `
        -ErrorAction Stop

    if ($bulkResponse.errors -eq $true) {
        $failed = @($bulkResponse.items | Where-Object { $_.index.status -ge 300 }).Count
        Write-Host "Synced with errors for $indexerIndex (failed items: $failed)"
    }
    else {
        Write-Host "Synced $($response.hits.hits.Count) docs into $indexerIndex"
    }
}

Write-Host "Sync completed."
