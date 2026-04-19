Write-Host "Packaging Lambda function..."

pip install -r requirements.txt -t .\package --quiet
Copy-Item *.py package\
Compress-Archive -Path package\* -DestinationPath .\infra\lambda.zip -Force
Remove-Item -Recurse -Force package

Write-Host "Done: infra\lambda.zip created"
Get-Item .\infra\lambda.zip | Select-Object Name, Length
