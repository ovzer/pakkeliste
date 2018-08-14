<?php
ini_set('display_errors', 1);
ini_set('display_startup_errors', 1);
error_reporting(E_ALL);

$dataArray = $_GET['array'];

$pakkeliste = array();

function getcsv($val) {
	return str_getcsv($val, ";");
}
function transposeData($data) {
  $retData = array();
    foreach ($data as $row => $columns) {
      foreach ($columns as $row2 => $column2) {
          $retData[$row2][$row] = $column2;
      }
    }
  return $retData;
}

function clamp($number, $min, $max) {
  if ($number < $min) {
    return $min;
  } elseif ($number > $max) {
    return $max;
  } else {
    return ceil($number);
  }
}

$csv = array_map("getcsv", file('pakkelisteKriterier.csv'));
//$csv = transposeData($csv);

$ndays = $dataArray["ndays"];
$stay = $dataArray["stay"];
$nraces = $dataArray["nraces"];
$ntrainings = $dataArray["ntrainings"];
$totalruns = $nraces + $ntrainings;
$maxtemp = $dataArray["maxtemp"];;
$mintemp = $dataArray["mintemp"];;

if ($maxtemp < 15) {
  $sokkfaktor = 0;
} elseif ($mintemp > 15) {
  $sokkfaktor = 1;
} else {
  $sokkfaktor = ($maxtemp-15)/($maxtemp - $mintemp);
}

for ($i = 1; $i < count($csv); $i++) {
  $pakkeliste[$i] = array(utf8_encode($csv[$i][0]), 0, 0);
}

for ($i = 1; $i < count($csv); $i++) {
  for ($j = 1; $j < count($csv[$i]); $j++) {
    $criteria = eval("return " . $csv[0][$j].";");
    if ( $criteria ) {
      $count = eval("return " . $csv[$i][$j].";");
      $pakkeliste[$i][1] += $count;
    }
  }
}

echo json_encode($pakkeliste);

?>