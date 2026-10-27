# Adds purposeful animations (fades, wipes, genuine appointment-move motion paths) with PowerPoint,
# then saves the final .pptx and exports the matching PDF and slide PNGs.
$ErrorActionPreference = 'Stop'
$root = 'C:\Users\aaa\Documents\SAYR-AI-Care-in-Motion\sayr\docs\presentation'
$src = "$root\build\SAYR-Al-Dhafra-Health-Forum.pptx"
$dstPptx = "$root\SAYR-Al-Dhafra-Health-Forum.pptx"
$dstPdf = "$root\SAYR-Al-Dhafra-Health-Forum.pdf"
$pngDir = "$root\slides"
New-Item -ItemType Directory -Force $pngDir | Out-Null
Get-ChildItem $pngDir -Filter *.png | Remove-Item -Force

$FADE = 10; $WIPE = 22; $AFTER = 3; $WITH = 2
$app = New-Object -ComObject PowerPoint.Application
try {
  $p = $app.Presentations.Open($src, 0, 0, 0)
  $W = $p.PageSetup.SlideWidth; $H = $p.PageSetup.SlideHeight

  function Has($sl, $name) { foreach ($s in $sl.Shapes) { if ($s.Name -eq $name) { return $true } } return $false }
  function Add-Fade($sl, $names, $dur = 0.4, $trigger = $AFTER) {
    foreach ($n in $names) {
      if (-not (Has $sl $n)) { Write-Warning "missing $n on slide $($sl.SlideIndex)"; continue }
      $e = $sl.TimeLine.MainSequence.AddEffect($sl.Shapes($n), $FADE, 0, $trigger)
      $e.Timing.Duration = $dur
    }
  }
  function Add-Move($sl, $chipNames, $targetName, $groupName) {
    $t = $sl.Shapes($targetName)
    $g = $sl.Shapes.Range($chipNames).Group()
    $g.Name = $groupName
    $dx = ($t.Left - $g.Left) / $W
    $dy = ($t.Top - $g.Top) / $H
    $e = $sl.TimeLine.MainSequence.AddEffect($g, 0, 0, $AFTER)
    $b = $e.Behaviors.Add(1)
    $b.MotionEffect.Path = ('M 0 0 L {0} {1} E' -f $dx.ToString([cultureinfo]::InvariantCulture), $dy.ToString([cultureinfo]::InvariantCulture))
    $e.Timing.Duration = 1.4
    $e.Timing.TriggerDelayTime = 0.4
  }

  # 1 · opening: the clock appears, then the outage sweeps in
  $s = $p.Slides(1)
  Add-Fade $s @('S1_clock') 0.6
  $e = $s.TimeLine.MainSequence.AddEffect($s.Shapes('S1_outage'), $WIPE, 0, $AFTER); $e.EffectParameters.Direction = 4; $e.Timing.Duration = 0.8
  # 2 · the queue builds square by square
  $s = $p.Slides(2); Add-Fade $s (0..9 | ForEach-Object { "S2_sq$_" }) 0.25
  # 3 · the seven workflow steps
  $s = $p.Slides(3); Add-Fade $s (0..6 | ForEach-Object { "S3_step$_" }) 0.35
  # 4 · reading the canvas
  $s = $p.Slides(4); Add-Fade $s (1..6 | ForEach-Object { "S4_c$_" }) 0.3
  # 6 · the ripple chain, in order
  $s = $p.Slides(6); Add-Fade $s ((0..5 | ForEach-Object { "S6_chain$_" }) + @('S6_branch')) 0.4
  # 7 · callouts, then one genuine appointment move: J-036, GP-3, 12:18 -> 11:57
  $s = $p.Slides(7); Add-Fade $s (1..4 | ForEach-Object { "S7_c$_" }) 0.3
  Add-Move $s ([object[]]@('S7_chip', 'S7_chiptext')) 'S7_target' 'S7_chipgroup'
  # 9 · the waterfall builds bar by bar
  $s = $p.Slides(9)
  foreach ($i in 0..7) { $e = $s.TimeLine.MainSequence.AddEffect($s.Shapes("S9_bar$i"), $WIPE, 0, $AFTER); $e.Timing.Duration = 0.4 }
  # 14 · appendix B: seven genuine moves
  $s = $p.Slides(14)
  foreach ($i in 0..6) { Add-Move $s ([object[]]@("SB_chip$i", "SB_chiptext$i")) "SB_target$i" "SB_group$i" }

  $p.SaveAs($dstPptx, 24)
  $p.SaveAs($dstPdf, 32)
  $p.Export($pngDir, 'PNG', 1920, 1080)
  $count = $p.Slides.Count
  $anim = 0; foreach ($sl in $p.Slides) { $anim += $sl.TimeLine.MainSequence.Count }
  "slides: $count  animation effects: $anim"
  $p.Close()
} finally { $app.Quit() }
Get-Item $dstPptx, $dstPdf | Select-Object Name, Length
