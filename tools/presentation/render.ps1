# Renders every slide of the deck to PNG with PowerPoint (QA), optionally after a different file is given.
param([string]$Pptx = "C:\Users\aaa\Documents\SAYR-AI-Care-in-Motion\sayr\docs\presentation\build\SAYR-Al-Dhafra-Health-Forum.pptx",
      [string]$OutDir = "C:\Users\aaa\Documents\SAYR-AI-Care-in-Motion\sayr\docs\presentation\build\qa")
New-Item -ItemType Directory -Force $OutDir | Out-Null
Get-ChildItem $OutDir -Filter *.png | Remove-Item -Force
$app = New-Object -ComObject PowerPoint.Application
try {
  $p = $app.Presentations.Open($Pptx, -1, 0, 0)
  $p.Export($OutDir, "PNG", 1920, 1080)
  "slides: " + $p.Slides.Count
  $p.Close()
} finally { $app.Quit() }
Get-ChildItem $OutDir -Filter *.png | Select-Object -ExpandProperty Name
